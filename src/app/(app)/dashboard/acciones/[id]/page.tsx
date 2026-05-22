import { notFound, redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getAction } from "@/application/actions";
import { getCanonicalActionDashboardPath } from "@/lib/actionStateRoutes";

/** Entrada idempotente: siempre redirige a la página del estado actual. */
export default async function ActionEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const repos = createRepositories(supabase);
  const action = await getAction(repos, id);
  if (!action) notFound();
  redirect(getCanonicalActionDashboardPath(action));
}
