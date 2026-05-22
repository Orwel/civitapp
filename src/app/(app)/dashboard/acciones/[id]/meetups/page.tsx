import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getAction } from "@/application/actions";
import { ActionMeetupsPanel } from "@/components/features/meetups/ActionMeetupsPanel";

export default async function ActionMeetupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const repos = createRepositories(supabase);
  const action = await getAction(repos, id);
  if (!action) return null;

  const meetups = await repos.meetups.getByAction(id);

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-auto flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Eventos</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Marchas, movilizaciones y encuentros de la acción.
        </p>
      </div>
      <ActionMeetupsPanel actionId={id} meetups={meetups} />
    </main>
  );
}
