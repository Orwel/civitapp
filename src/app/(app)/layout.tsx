import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { listUserActions } from "@/application/actions";
import { AppShell } from "@/components/layout/AppShell";

export const runtime = "nodejs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const repos = createRepositories(supabase);

  let actions: Awaited<ReturnType<typeof listUserActions>>["led"] = [];
  let guestActions: Awaited<
    ReturnType<typeof repos.actions.listGuestSidebar>
  > | undefined;

  if (user) {
    const { led, signed } = await listUserActions(repos, user.id);
    const byId = new Map<string, (typeof led)[0]>();
    for (const a of [...led, ...signed]) byId.set(a.id, a);
    actions = Array.from(byId.values());
  } else {
    guestActions = await repos.actions.listGuestSidebar();
  }

  return (
    <AppShell user={user} actions={actions} guestActions={guestActions}>
      {children}
    </AppShell>
  );
}
