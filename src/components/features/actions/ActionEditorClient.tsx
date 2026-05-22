"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import type { ActionContentMode } from "@/core/types/actionState";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { LegalDisclaimerBanner } from "@/components/legal/LegalDisclaimerBanner";
import { PdfDraftSection } from "@/components/features/actions/PdfDraftSection";
import { getActionDashboardPath } from "@/lib/actionStateRoutes";
import {
  acquireEditLockAction,
  heartbeatEditLockAction,
  releaseEditLockAction,
  saveActionDraftAction,
  setActionContentModeAction,
} from "@/app/(app)/dashboard/acciones/[id]/editar/actions";

export function ActionEditorClient({
  action,
  initialPdfPreviewUrl,
}: {
  action: ConstitutionalAction;
  initialPdfPreviewUrl: string | null;
}) {
  const router = useRouter();
  const [contentMode, setContentMode] = useState<ActionContentMode>(action.content_mode);
  const [html, setHtml] = useState(action.content_body ?? "");
  const [json, setJson] = useState<Record<string, unknown>>(
    (action.content_data as Record<string, unknown>) ?? {}
  );
  const [canEdit, setCanEdit] = useState(false);
  const [lockHolder, setLockHolder] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [modeSwitching, setModeSwitching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tryAcquire = useCallback(async () => {
    const res = await acquireEditLockAction(action.id);
    if (res.granted) {
      setCanEdit(true);
      setLockHolder(null);
      return true;
    }
    setCanEdit(false);
    setLockHolder(res.holder_name ?? "Otro usuario");
    return false;
  }, [action.id]);

  useEffect(() => {
    void tryAcquire();
    return () => {
      void releaseEditLockAction(action.id);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [action.id, tryAcquire]);

  useEffect(() => {
    if (!canEdit) return;
    heartbeatRef.current = setInterval(() => {
      void heartbeatEditLockAction(action.id);
    }, 10000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [canEdit, action.id]);

  const scheduleSave = useCallback(
    (nextHtml: string, nextJson: Record<string, unknown>) => {
      if (!canEdit) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        await saveActionDraftAction(action.id, {
          content_body: nextHtml,
          content_data: nextJson,
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }, 1500);
    },
    [canEdit, action.id]
  );

  async function switchMode(mode: ActionContentMode) {
    if (!canEdit || mode === contentMode) return;
    setModeSwitching(true);
    const res = await setActionContentModeAction(action.id, mode);
    setModeSwitching(false);
    if (!res.error) {
      setContentMode(mode);
      router.refresh();
    }
  }

  const hasPdf = Boolean(action.content_pdf_storage_path);

  return (
    <div className="space-y-4">
      <LegalDisclaimerBanner compact />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canEdit || modeSwitching}
          onClick={() => void switchMode("TEXT")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold border ${
            contentMode === "TEXT"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
              : "border-[var(--border)]"
          }`}
        >
          Redactar (editor)
        </button>
        <button
          type="button"
          disabled={!canEdit || modeSwitching}
          onClick={() => void switchMode("PDF")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold border ${
            contentMode === "PDF"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
              : "border-[var(--border)]"
          }`}
        >
          Subir PDF
        </button>
      </div>

      {!canEdit && (
        <div className="rounded-card border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <strong>{lockHolder}</strong> está editando este borrador. Solo lectura por ahora.{" "}
          <button
            type="button"
            className="underline font-semibold"
            onClick={() => void tryAcquire()}
          >
            Reintentar
          </button>
        </div>
      )}
      {canEdit && contentMode === "TEXT" && (
        <p className="text-xs text-[var(--muted)]">
          {saveStatus === "saving"
            ? "Guardando…"
            : saveStatus === "saved"
              ? "Guardado"
              : "Tienes el control de edición"}
        </p>
      )}

      {contentMode === "PDF" ? (
        <PdfDraftSection
          actionId={action.id}
          canEdit={canEdit}
          initialPreviewUrl={initialPdfPreviewUrl}
          hasPdf={hasPdf}
        />
      ) : (
        <RichTextEditor
          content={html}
          editable={canEdit}
          onChange={(h, j) => {
            setHtml(h);
            setJson(j);
            scheduleSave(h, j);
          }}
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            router.push(getActionDashboardPath(action.id, action.state))
          }
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
        >
          Volver al panel
        </button>
      </div>
    </div>
  );
}
