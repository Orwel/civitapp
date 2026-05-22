import type { ActionEvent } from "@/core/entities/Event";
import type { IEventRepository } from "@/core/repositories/IEventRepository";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseEventRepository implements IEventRepository {
  constructor(private supabase: SupabaseClient) {}

  async getByAction(actionId: string, limit = 100): Promise<ActionEvent[]> {
    const { data, error } = await this.supabase
      .from("action_events")
      .select("*")
      .eq("action_id", actionId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ActionEvent[];
  }
}
