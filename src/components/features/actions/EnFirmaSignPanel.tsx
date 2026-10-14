import { CheckCircle2 } from "lucide-react";
import type { ActionSignatureRow } from "@/core/repositories/IConstitutionalActionRepository";
import {
  SignActionForm,
  type SignActionFormProps,
} from "@/components/features/actions/SignActionForm";

export function EnFirmaSignPanel({
  hasSigned,
  mySignature,
  formProps,
}: {
  hasSigned: boolean;
  mySignature: ActionSignatureRow | null;
  formProps: SignActionFormProps;
}) {
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
  return <SignActionForm {...formProps} />;
}
