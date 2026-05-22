import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { listUserActions } from "@/application/actions";
import { ACTION_STATE_LABELS } from "@/core/types/actionState";
import { Card } from "@/components/ui/card";
import { OnboardingModal } from "@/components/legal/OnboardingModal";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const repos = createRepositories(supabase);
  const { led, signed } = await listUserActions(repos, user.id);
  const profile = await repos.users.getProfile(user.id);
  const showOnboarding = profile && !profile.onboarded_at;

  return (
    <div className="flex-1 overflow-auto px-4 py-6 lg:px-8">
      {showOnboarding && <OnboardingModal show />}
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">Mis acciones</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Acciones que lideras o en las que has firmado.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold mb-3">Lidero</h2>
          {led.length === 0 ? (
            <Card className="p-6 text-sm text-[var(--muted)]">
              <Link href="/acciones/nueva" className="text-[var(--accent)] font-semibold">
                Crear una acción
              </Link>
            </Card>
          ) : (
            <ul className="space-y-2">
              {led.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/dashboard/acciones/${a.id}`}
                    className="block rounded-card border border-[var(--border)] p-4 hover:bg-[var(--surface-hover)]"
                  >
                    <span className="font-medium">{a.title}</span>
                    <span className="ml-2 text-xs text-[var(--muted)]">
                      {ACTION_STATE_LABELS[a.state]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="text-sm font-semibold mb-3">He firmado</h2>
          {signed.length === 0 ? (
            <Card className="p-6 text-sm text-[var(--muted)]">
              <Link href="/acciones" className="text-[var(--accent)] font-semibold">
                Explorar acciones para firmar
              </Link>
            </Card>
          ) : (
            <ul className="space-y-2">
              {signed.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/dashboard/acciones/${a.id}`}
                    className="block rounded-card border border-[var(--border)] p-4 hover:bg-[var(--surface-hover)]"
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
