"use client";

import { useCallback, useState } from "react";
import { FileUp, FileText } from "lucide-react";
import { createClient } from "@/infrastructure/supabase/client";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import {
  ACTION_DOCUMENTS_BUCKET,
  draftPdfStoragePath,
} from "@/lib/actionDocuments";
import {
  getActionPdfSignedUrlAction,
  saveActionPdfDraftAction,
} from "@/app/(app)/dashboard/acciones/[id]/editar/actions";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

export function PdfDraftSection({
  actionId,
  canEdit,
  initialPreviewUrl,
  hasPdf,
}: {
  actionId: string;
  canEdit: boolean;
  initialPreviewUrl: string | null;
  hasPdf: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPreview = useCallback(async () => {
    const res = await getActionPdfSignedUrlAction(actionId);
    if (res.url) setPreviewUrl(res.url);
  }, [actionId]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!canEdit) return;
      setError(null);
      if (file.type !== "application/pdf") {
        setError("Solo se permiten archivos PDF.");
        return;
      }
      if (file.size > MAX_PDF_BYTES) {
        setError("El PDF no puede superar 15 MB.");
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const path = draftPdfStoragePath(actionId);
        const { error: uploadError } = await supabase.storage
          .from(ACTION_DOCUMENTS_BUCKET)
          .upload(path, file, { upsert: true, contentType: "application/pdf" });

        if (uploadError) {
          setError(uploadError.message);
          return;
        }

        const saveRes = await saveActionPdfDraftAction(actionId, path);
        if (saveRes.error) {
          setError(saveRes.error);
          return;
        }
        await refreshPreview();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir el PDF");
      } finally {
        setUploading(false);
      }
    },
    [actionId, canEdit, refreshPreview]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <div className="flex items-start gap-2">
          <FileText className="h-5 w-5 text-[var(--accent)] shrink-0" />
          <div>
            <p className="text-sm font-semibold">Documento PDF</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Sube el escrito ya redactado (máx. 15 MB). Se guarda de forma privada en
              Supabase hasta publicar para firmas.
            </p>
          </div>
        </div>

        {canEdit && (
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] p-8 cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors">
            <FileUp className="h-8 w-8 text-[var(--muted)]" />
            <span className="text-sm font-semibold">
              {uploading
                ? "Subiendo…"
                : hasPdf
                  ? "Reemplazar PDF"
                  : "Seleccionar PDF"}
            </span>
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
        )}

        {error && (
          <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-2">
            {error}
          </p>
        )}
      </div>

      {previewUrl ? (
        <PdfViewer url={previewUrl} />
      ) : (
        !canEdit && (
          <p className="text-sm text-[var(--muted)]">Aún no hay PDF cargado en este borrador.</p>
        )
      )}
    </div>
  );
}
