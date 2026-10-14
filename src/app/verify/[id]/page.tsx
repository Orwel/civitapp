import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/server";
import { ACTION_STATE_LABELS, type ActionState } from "@/core/types/actionState";
import { HashCheck } from "@/components/features/actions/HashCheck";
import { ResponseDeadline } from "@/components/features/actions/ResponseDeadline";

export const dynamic = "force-dynamic";

export default async function VerifyActionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: action } = await supabase
    .from("constitutional_actions_public")
    .select(
      "id, slug, title, state, body_snapshot_sha256, final_document_sha256, signatures_count, radicado_at, response_due_on, milestone_code, action_type_id"
    )
    .eq("id", id)
    .maybeSingle();

  const { data: type } = action
    ? await supabase
        .from("action_types")
        .select("name, response_business_days")
        .eq("id", action.action_type_id)
        .maybeSingle()
    : { data: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: mine } =
    action && user
      ? await supabase
          .from("constitutional_action_signatures")
          .select("signed_at_co_pretty, signature_hash")
          .eq("action_id", action.id)
          .eq("signer_user_id", user.id)
          .maybeSingle()
      : { data: null };

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <Link href="/" className="text-sm text-[var(--muted)]">
          ← Civitapp
        </Link>
        <h1 className="font-display text-2xl font-bold">Verificación de documento</h1>
        {action ? (
          <>
            <div className="rounded-card border border-[var(--border)] p-5 space-y-3 text-sm">
              {type?.name && (
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{type.name}</p>
              )}
              <p>
                <strong>{action.title}</strong>
              </p>
              <p className="text-[var(--muted)]">
                Estado: {ACTION_STATE_LABELS[action.state as ActionState] ?? action.state}
                {" · "}
                {Number(action.signatures_count).toLocaleString("es-CO")} firmas registradas
              </p>
              {action.radicado_at && (
                <p className="text-[var(--muted)]">
                  Radicado el{" "}
                  {new Date(action.radicado_at).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "America/Bogota",
                  })}
                </p>
              )}
              {mine && (
                <p className="rounded-lg bg-green-500/10 p-2 text-xs text-green-800 dark:text-green-300">
                  Tu firma está incluida ({mine.signed_at_co_pretty}).
                  {mine.signature_hash && (
                    <span className="block font-mono text-[10px] break-all mt-1">
                      Comprobante: {mine.signature_hash}
                    </span>
                  )}
                </p>
              )}
              {action.body_snapshot_sha256 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Hash del texto que se firmó
                  </p>
                  <code className="text-xs break-all block mt-1 font-mono bg-[var(--surface-hover)] p-2 rounded">
                    {action.body_snapshot_sha256}
                  </code>
                </div>
              )}
              {action.final_document_sha256 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Hash del PDF radicado (con anexo de firmas)
                  </p>
                  <code className="text-xs break-all block mt-1 font-mono bg-[var(--surface-hover)] p-2 rounded">
                    {action.final_document_sha256}
                  </code>
                </div>
              )}
              {action.state === "EN_FIRMA" && !mine ? (
                <Link
                  href={`/acciones/${action.slug}#firmar`}
                  className="block w-full text-center rounded-lg py-3 text-sm font-bold bg-[var(--accent)] text-[var(--accent-foreground)]"
                >
                  La recolección sigue abierta: firmar
                </Link>
              ) : (
                <Link
                  href={`/acciones/${action.slug}`}
                  className="inline-block text-[var(--accent)] font-semibold underline"
                >
                  Ver la acción
                </Link>
              )}
            </div>
            {(action.state === "RADICADO" || action.state === "EN_ESPERA_DE_OTRO_PROCESO") && (
              <ResponseDeadline
                dueOn={action.response_due_on}
                milestoneCode={action.milestone_code}
                businessDays={type?.response_business_days}
              />
            )}
            {(action.final_document_sha256 || action.body_snapshot_sha256) && (
              <HashCheck
                expected={[action.final_document_sha256, action.body_snapshot_sha256].filter(
                  (h): h is string => Boolean(h)
                )}
              />
            )}
          </>
        ) : (
          <p className="text-[var(--muted)]">Acción no encontrada o no es pública.</p>
        )}
      </div>
    </div>
  );
}
