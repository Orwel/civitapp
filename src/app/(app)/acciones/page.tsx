import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { ActionCard } from "@/components/features/actions/ActionCard";
import type { ActionState } from "@/core/types/actionState";

export const dynamic = "force-dynamic";

const TABS: { key: ActionState | "ALL"; label: string }[] = [
  { key: "EN_FIRMA", label: "En firma" },
  { key: "EN_CREACION", label: "En redacción" },
  { key: "FIRMADO", label: "Firmadas" },
  { key: "RADICADO", label: "Radicadas" },
  { key: "ALL", label: "Todas" },
];

export default async function AccionesPublicPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = (tab as ActionState | "ALL") || "EN_FIRMA";

  const supabase = await createClient();
  const repos = createRepositories(supabase);

  const actions =
    activeTab === "ALL"
      ? await repos.actions.listPublic(50)
      : await repos.actions.listPublicByState(activeTab, 50);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex-1 overflow-auto px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Acciones en curso</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Firmas de respaldo ciudadano · Colombia
            </p>
          </div>
          {user ? (
            <Link
              href="/acciones/nueva"
              className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-foreground)]"
            >
              Crear
            </Link>
          ) : (
            <Link
              href="/register?redirect=/acciones/nueva"
              className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-foreground)]"
            >
              Crear cuenta
            </Link>
          )}
        </header>

        {user && activeTab === "EN_FIRMA" && (
          <p className="text-sm rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3">
            Tus acciones en <strong>redacción</strong> aparecen en la pestaña{" "}
            <Link href="/acciones?tab=EN_CREACION" className="text-[var(--accent)] font-semibold underline">
              En redacción
            </Link>{" "}
            y en el menú lateral bajo <strong>Borradores</strong>.
          </p>
        )}

        <nav className="flex flex-wrap gap-2">
          {TABS.map(({ key, label }) => (
            <Link
              key={key}
              href={key === "ALL" ? "/acciones?tab=ALL" : `/acciones?tab=${key}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                activeTab === key
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {actions.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">No hay acciones en esta categoría.</p>
        ) : (
          <ul className="space-y-4">
            {actions.map((a) => (
              <li key={a.id}>
                <ActionCard action={a} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
