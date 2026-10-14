import { notFound } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getAction, getPublicActionBySlug } from "@/application/actions";
import type { ActionState } from "@/core/types/actionState";
import { ensureActionStatePage } from "@/lib/ensureActionStatePage";
import { isActionLeader } from "@/lib/actionLeader";

export async function loadActionStatePage(id: string, expectedState: ActionState) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const repos = createRepositories(supabase);
  const action = await getAction(repos, id);
  if (!action) notFound();
  ensureActionStatePage(action, expectedState);

  const [publicAction, signatures, actionType, milestones, leaderByRole] = await Promise.all([
    getPublicActionBySlug(repos, action.slug),
    repos.actions.listSignaturesForAction(id),
    repos.catalog.getActionType(action.action_type_id),
    repos.catalog.getMilestones(action.action_type_id),
    user ? isActionLeader(supabase, id, user.id) : Promise.resolve(false),
  ]);
  const isLeader = Boolean(user && (user.id === action.created_by || leaderByRole));

  return { action, user, publicAction, signatures, isLeader, repos, actionType, milestones };
}
