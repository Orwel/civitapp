import { notFound } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getAction, getPublicActionBySlug } from "@/application/actions";
import type { ActionState } from "@/core/types/actionState";
import { ensureActionStatePage } from "@/lib/ensureActionStatePage";

export async function loadActionStatePage(id: string, expectedState: ActionState) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const repos = createRepositories(supabase);
  const action = await getAction(repos, id);
  if (!action) notFound();
  ensureActionStatePage(action, expectedState);

  const publicAction = await getPublicActionBySlug(repos, action.slug);
  const signatures = await repos.actions.listSignaturesForAction(id);
  const isLeader = Boolean(user && user.id === action.created_by);

  return { action, user, publicAction, signatures, isLeader, repos };
}
