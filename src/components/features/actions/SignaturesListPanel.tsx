import type { ActionSignatureRow } from "@/core/repositories/IConstitutionalActionRepository";
import { maskCedula } from "@/lib/maskCedula";

export function SignaturesListPanel({
  signatures,
  highlightUserId,
}: {
  signatures: ActionSignatureRow[];
  highlightUserId?: string | null;
}) {
  if (signatures.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)] rounded-card border border-[var(--border)] p-4">
        Aún no hay firmas registradas en esta acción.
      </p>
    );
  }

  return (
    <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
      <h3 className="text-sm font-semibold">
        Firmas registradas ({signatures.length})
      </h3>
      <ul className="space-y-3">
        {signatures.map((sig, i) => {
          const lugar = [sig.signer_geo_city, sig.signer_geo_region, sig.signer_geo_country]
            .filter(Boolean)
            .join(", ");
          const isMine = highlightUserId && sig.signer_user_id === highlightUserId;
          return (
            <li
              key={`${sig.signed_at}-${i}`}
              className={`text-sm border-b border-[var(--border)] pb-3 last:border-0 last:pb-0 rounded-lg -mx-1 px-2 ${
                isMine ? "bg-green-500/10 border-green-600/30" : ""
              }`}
            >
              {isMine && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
                  Tu firma
                </span>
              )}
              <p className="font-medium">{sig.snapshot_full_name}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                C.C. {maskCedula(sig.snapshot_cedula)}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {sig.signed_at_co_pretty ?? sig.signed_at}
                {lugar ? ` · ${lugar}` : ""}
              </p>
              {sig.signature_hash && (
                <p className="text-[10px] font-mono text-[var(--muted)] mt-1 break-all">
                  Hash: {sig.signature_hash.slice(0, 24)}…
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
