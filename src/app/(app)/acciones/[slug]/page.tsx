import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getPublicActionBySlug } from "@/application/actions";
import { ACTION_STATE_LABELS } from "@/core/types/actionState";
import { ShareBar } from "@/components/features/actions/ShareBar";
import {
  getActionDashboardPath,
  getCanonicalActionDashboardPath,
} from "@/lib/actionStateRoutes";
import { ACTION_DOCUMENTS_BUCKET } from "@/lib/actionDocuments";
import { sanitizeActionHtml } from "@/lib/sanitizeActionHtml";
import { resolveSignatureLevel, resolveSignerFields } from "@/core/entities/ActionType";
import { SignActionForm } from "@/components/features/actions/SignActionForm";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { ResponseDeadline } from "@/components/features/actions/ResponseDeadline";

export const dynamic = "force-dynamic";

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const repos = createRepositories(supabase);
  const action = await getPublicActionBySlug(repos, slug);
  if (!action) return { title: "Acción no encontrada" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const description =
    action.summary ??
    `${ACTION_STATE_LABELS[action.state]} · ${action.signatures_count} firmas en Civitapp`;

  return {
    title: `${action.title} | Civitapp`,
    description,
    openGraph: {
      title: action.title,
      description,
      url: `${siteUrl}/acciones/${slug}`,
      siteName: "Civitapp",
      images: [{ url: `${siteUrl}/api/og/${slug}`, width: 1200, height: 630 }],
      locale: "es_CO",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: action.title,
      description,
      images: [`${siteUrl}/api/og/${slug}`],
    },
  };
}

export default async function PublicActionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const repos = createRepositories(supabase);
  const action = await getPublicActionBySlug(repos, slug);
  if (!action) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const count = action.signatures_count;
  const goal = action.target_count ?? action.minimum_required;
  const pct = goal > 0 ? Math.min(100, Math.round((count / goal) * 100)) : 0;
  const days = daysUntil(action.firma_deadline_at);
  const leaders = action.leaders ?? [];

  const [actionType, fullAction, profile, hasSigned, pdfUrl] = await Promise.all([
    repos.catalog.getActionType(action.action_type_id),
    user ? repos.actions.getByIdWithType(action.id) : Promise.resolve(null),
    user ? repos.users.getProfile(user.id) : Promise.resolve(null),
    user ? repos.actions.hasSigned(action.id, user.id) : Promise.resolve(false),
    action.content_mode === "PDF" && action.content_pdf_storage_path
      ? supabase.storage
          .from(ACTION_DOCUMENTS_BUCKET)
          .createSignedUrl(action.content_pdf_storage_path, 3600)
          .then((r) => r.data?.signedUrl ?? null)
      : Promise.resolve(null),
  ]);

  return (
    <div className="flex-1 overflow-auto px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/acciones" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Acciones en curso
        </Link>

        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            {actionType?.name ? `${actionType.name} · ` : ""}
            {ACTION_STATE_LABELS[action.state]}
          </p>
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">{action.title}</h1>
          {action.summary && (
            <p className="text-sm text-[var(--muted)] leading-relaxed">{action.summary}</p>
          )}
        </header>

        {action.state === "EN_FIRMA" && (
          <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
            {days !== null && days <= 3 && days >= 0 && (
              <span className="inline-block rounded-md bg-red-950/80 text-red-200 text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                Urgente · vence en {days} día{days === 1 ? "" : "s"}
              </span>
            )}
            <div className="flex justify-between items-end">
              <span className="text-3xl font-bold text-[var(--accent)] tabular-nums">
                {count.toLocaleString("es-CO")}
              </span>
              <span className="text-sm text-[var(--muted)]">
                de {goal.toLocaleString("es-CO")} firmas
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
              <div className="h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
            </div>
            {action.firma_deadline_at && (
              <p className="text-xs text-[var(--muted)]">
                Recolección abierta hasta el{" "}
                {new Date(action.firma_deadline_at).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  timeZone: "America/Bogota",
                })}
              </p>
            )}
          </div>
        )}

        {action.state === "EN_FIRMA" && hasSigned && (
          <p className="rounded-card border-2 border-green-600/40 bg-green-500/5 p-4 text-sm font-semibold text-green-800 dark:text-green-300">
            Ya firmaste esta acción. ¡Gracias! Compártela para sumar más firmas.
          </p>
        )}

        {action.state === "EN_FIRMA" && !hasSigned && (
          <a
            href="#firmar"
            className="block w-full text-center rounded-lg py-3.5 text-sm font-bold bg-[var(--accent)] text-[var(--accent-foreground)]"
          >
            Firmar ahora
          </a>
        )}

        {(action.state === "RADICADO" || action.state === "EN_ESPERA_DE_OTRO_PROCESO") && (
          <ResponseDeadline
            dueOn={action.response_due_on}
            milestoneCode={action.milestone_code}
            businessDays={actionType?.response_business_days}
          />
        )}

        <ShareBar action={action} />

        {action.state !== "EN_CREACION" && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">El documento</h2>
            {pdfUrl ? (
              <PdfViewer url={pdfUrl} />
            ) : action.content_body ? (
              <div
                className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 max-h-[32rem] overflow-auto prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeActionHtml(action.content_body) }}
              />
            ) : (
              <p className="text-sm text-[var(--muted)]">Sin contenido para mostrar.</p>
            )}
            {action.body_snapshot_sha256 && (
              <p className="text-[10px] font-mono text-[var(--muted)] break-all">
                Texto congelado · SHA-256 {action.body_snapshot_sha256.slice(0, 32)}…
              </p>
            )}
          </section>
        )}

        {action.state === "EN_FIRMA" && !hasSigned && (
          <section id="firmar" className="scroll-mt-6">
            <SignActionForm
              actionId={action.id}
              slug={slug}
              actionTitle={action.title}
              signatureLevel={resolveSignatureLevel(actionType)}
              signerFields={resolveSignerFields(actionType)}
              sessionEmail={user?.email ?? null}
              initial={{
                full_name: profile?.full_name,
                cedula: profile?.cedula,
                address: profile?.address,
                phone: profile?.phone,
              }}
            />
          </section>
        )}

        {leaders.length > 0 && (
          <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Quienes lideran
            </p>
            <ul className="space-y-1">
              {leaders.map((l, i) => (
                <li key={i} className="text-sm text-[var(--foreground)]">
                  <span className="font-medium">{l.full_name ?? "Ciudadano"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {user && fullAction?.state === "EN_CREACION" && (
          <div className="rounded-card border border-[var(--border)] p-4 text-sm text-[var(--muted)]">
            Esta acción está en redacción.{" "}
            <Link
              href={getActionDashboardPath(action.id, "EN_CREACION")}
              className="text-[var(--accent)] font-semibold underline"
            >
              Ir al editor colaborativo
            </Link>
          </div>
        )}

        {user && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={
                fullAction
                  ? getCanonicalActionDashboardPath(fullAction)
                  : `/dashboard/acciones/${action.id}`
              }
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Ir a la acción
            </Link>
            <Link
              href={`/dashboard/acciones/${action.id}/chat`}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            >
              Chat del equipo
            </Link>
            <Link
              href={`/dashboard/acciones/${action.id}/meetups`}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            >
              Eventos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
