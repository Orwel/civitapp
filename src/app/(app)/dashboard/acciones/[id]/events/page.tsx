import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getAction } from "@/application/actions";
import { EventsList } from "@/components/features/events/EventsList";

export default async function ActionEventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const repos = createRepositories(supabase);
  const action = await getAction(repos, id);
  if (!action) return null;

  const events = await repos.events.getByAction(id, 50);

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-auto flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Bitácora</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Transiciones y actividad de la acción.
        </p>
      </div>
      <EventsList events={events} />
    </main>
  );
}
