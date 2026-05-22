"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/infrastructure/supabase/client";
import { signActionWithPadAction } from "@/app/(app)/dashboard/acciones/[id]/actions";
import { ACTION_DOCUMENTS_BUCKET } from "@/lib/actionDocuments";
import { actionSignatureStoragePath } from "@/lib/signatureUpload";
import { getActionDashboardPath } from "@/lib/actionStateRoutes";
import { SignaturePad, type SignaturePadHandle } from "@/components/features/actions/SignaturePad";
import { Button } from "@/components/ui/button";
import type { ActionSignatureRow } from "@/core/repositories/IConstitutionalActionRepository";
export function EnFirmaSignPanel({
  actionId,
  hasSigned,
  mySignature,
}: {
  actionId: string;
  hasSigned: boolean;
  mySignature: ActionSignatureRow | null;
}) {
  const router = useRouter();
  const padRef = useRef<SignaturePadHandle>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (hasSigned) {
    return (
      <div className="w-full rounded-card border-2 border-green-600/40 bg-green-500/5 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              Ya firmaste esta acción
            </p>
            {mySignature && (
              <p className="text-xs text-[var(--muted)] mt-1">
                {mySignature.snapshot_full_name} ·{" "}
                {mySignature.signed_at_co_pretty ?? mySignature.signed_at}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  async function handleConfirm() {
    setError(null);
    const blob = await padRef.current?.exportPngBlob();
    if (!blob) {
      setError("Dibuja tu firma en el recuadro antes de confirmar.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Debes iniciar sesión");
        return;
      }

      const path = actionSignatureStoragePath(actionId, user.id);
      const { error: uploadError } = await supabase.storage
        .from(ACTION_DOCUMENTS_BUCKET)
        .upload(path, blob, { upsert: true, contentType: "image/png" });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const res = await signActionWithPadAction(actionId, path);
      if (res.error) {
        setError(res.error);
        return;
      }

      router.push(getActionDashboardPath(actionId, "EN_FIRMA"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al firmar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-card border-2 border-[var(--accent)]/50 bg-[var(--surface)] p-4 space-y-4">
      <div>
        <p className="text-sm font-bold">Tu firma</p>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Dibuja en el recuadro y confirma para registrar tu firma en esta acción.
        </p>
      </div>
      <SignaturePad ref={padRef} />
      <Button
        type="button"
        variant="accent"
        disabled={loading}
        className="w-full sm:w-auto"
        onClick={() => void handleConfirm()}
      >
        {loading ? "Guardando firma…" : "Confirmar y firmar"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
