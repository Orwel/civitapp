import type { ActionType, ActionTypeMilestone } from "@/core/entities/ActionType";
import type { ICatalogRepository } from "@/core/repositories/ICatalogRepository";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseCatalogRepository implements ICatalogRepository {
  constructor(private supabase: SupabaseClient) {}

  async getActionTypes(): Promise<ActionType[]> {
    const { data, error } = await this.supabase
      .from("action_types")
      .select("*")
      .order("order_index", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as ActionType[]).filter((t) => t.active !== false);
  }

  async getActionType(id: string): Promise<ActionType | null> {
    const { data, error } = await this.supabase
      .from("action_types")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as ActionType | null) ?? null;
  }

  async getMilestones(actionTypeId: string): Promise<ActionTypeMilestone[]> {
    const { data, error } = await this.supabase
      .from("action_type_milestones")
      .select("*")
      .eq("action_type_id", actionTypeId)
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ActionTypeMilestone[];
  }
}
