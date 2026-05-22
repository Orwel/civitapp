import type { ActionType } from "@/core/entities/ActionType";
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
    return (data ?? []) as ActionType[];
  }
}
