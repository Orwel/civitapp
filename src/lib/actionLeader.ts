import type { SupabaseClient } from "@supabase/supabase-js";

/** Creador, líder o co-líder de la acción (mismo criterio que is_action_leader en SQL). */
export async function isActionLeader(
  supabase: SupabaseClient,
  actionId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("constitutional_action_roles")
    .select("role")
    .eq("action_id", actionId)
    .eq("user_id", userId)
    .in("role", ["CREADOR", "LIDER", "CO_LIDER"])
    .limit(1);
  return Boolean(data?.length);
}
