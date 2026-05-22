import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/server";

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
      "id, slug, title, state, body_snapshot_sha256, final_document_sha256, signatures_count"
    )
    .eq("id", id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <Link href="/" className="text-sm text-[var(--muted)]">
          ← Civitapp
        </Link>
        <h1 className="font-display text-2xl font-bold">Verificación de documento</h1>
        {action ? (
          <div className="rounded-card border border-[var(--border)] p-5 space-y-3 text-sm">
            <p>
              <strong>{action.title}</strong>
            </p>
            <p className="text-[var(--muted)]">Estado: {action.state}</p>
            <p className="text-[var(--muted)]">{action.signatures_count} firmas registradas</p>
            {action.body_snapshot_sha256 && (
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                  Hash del cuerpo congelado
                </p>
                <code className="text-xs break-all block mt-1 font-mono bg-[var(--surface-hover)] p-2 rounded">
                  {action.body_snapshot_sha256}
                </code>
              </div>
            )}
            {action.final_document_sha256 && (
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                  Hash del PDF firmado
                </p>
                <code className="text-xs break-all block mt-1 font-mono bg-[var(--surface-hover)] p-2 rounded">
                  {action.final_document_sha256}
                </code>
              </div>
            )}
            <Link
              href={`/acciones/${action.slug}`}
              className="inline-block text-[var(--accent)] font-semibold underline"
            >
              Ver acción pública
            </Link>
          </div>
        ) : (
          <p className="text-[var(--muted)]">Acción no encontrada o no es pública.</p>
        )}
        <p className="text-xs text-[var(--muted)]">
          Compara el hash SHA-256 de tu archivo descargado con el registrado aquí para confirmar
          integridad.
        </p>
      </div>
    </div>
  );
}
