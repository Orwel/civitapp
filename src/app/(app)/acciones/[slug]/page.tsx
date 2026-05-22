import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getPublicActionBySlug } from "@/application/actions";
import { ACTION_STATE_LABELS } from "@/core/types/actionState";
import { ShareBar } from "@/components/features/actions/ShareBar";
import { cn } from "@/lib/utils";
import {
  getActionDashboardPath,
  getCanonicalActionDashboardPath,
} from "@/lib/actionStateRoutes";

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ firmar?: string }>;
}) {
  const { slug } = await params;
  const { firmar } = await searchParams;
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
  const wantsSign = firmar === "1" || action.state === "EN_FIRMA";
  const enFirmaPath = getActionDashboardPath(action.id, "EN_FIRMA");
  const signHref = user
    ? enFirmaPath
    : `/login?redirect=${encodeURIComponent(enFirmaPath)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(`/acciones/${slug}`)}`;
  const leaders = action.leaders ?? [];

  let fullAction = null;
  if (user) {
    fullAction = await repos.actions.getByIdWithType(action.id);
  }

  return (
    <div className="flex-1 overflow-auto px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/acciones" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Acciones en curso
        </Link>

        <ShareBar action={action} />

        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            {ACTION_STATE_LABELS[action.state]}
          </p>
          <h1 className="font-display text-2xl font-bold text-[var(--foreground)]">{action.title}</h1>
          {action.summary && (
            <p className="text-sm text-[var(--muted)] leading-relaxed">{action.summary}</p>
          )}
        </header>

        {leaders.length > 0 && (
          <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Participantes
            </p>
            <ul className="space-y-1">
              {leaders.map((l, i) => (
                <li key={i} className="text-sm text-[var(--foreground)]">
                  <span className="font-medium">{l.full_name ?? "Ciudadano"}</span>
                  <span className="text-[var(--muted)] ml-2 text-xs">{l.role}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
          </div>
        )}

        {!user && (
          <div className="rounded-card border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 space-y-3 text-center">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              El contenido completo de esta acción es visible para usuarios registrados
            </p>
            <p className="text-xs text-[var(--muted)]">
              {action.state === "EN_FIRMA"
                ? "Regístrate para leer el documento y firmar."
                : action.state === "EN_CREACION"
                  ? "Regístrate para ver el borrador y aportar a la redacción."
                  : "Regístrate para ver el documento y participar en el chat."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={registerHref}
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-foreground)]"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href={`/login?redirect=${encodeURIComponent(`/acciones/${slug}`)}`}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}

        {user && fullAction?.content_body && fullAction.state !== "EN_CREACION" && (
          <div className="rounded-card border border-[var(--border)] p-4 bg-[var(--surface)] max-h-96 overflow-auto">
            <pre className="text-xs whitespace-pre-wrap font-sans text-[var(--foreground)]">
              {fullAction.content_body}
            </pre>
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

        {wantsSign && action.state === "EN_FIRMA" && (
          <Link
            href={signHref}
            className={cn(
              "block w-full text-center rounded-lg py-3.5 text-sm font-bold transition",
              "bg-[var(--accent)] text-[var(--accent-foreground)]"
            )}
          >
            Firmar esta acción
          </Link>
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
