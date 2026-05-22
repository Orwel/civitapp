import type { InitiativeLeader } from "@/core/entities/InitiativeLeader";
import type { IInitiativeLeaderRepository } from "@/core/repositories/IInitiativeLeaderRepository";
import type { LeaderType } from "@/core/enums/Roles";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseInitiativeLeaderRepository
  implements IInitiativeLeaderRepository
{
  constructor(private supabase: SupabaseClient) {}

  async add(
    initiativeId: string,
    userId: string,
    leaderType: LeaderType
  ): Promise<InitiativeLeader> {
    const { data, error } = await this.supabase
      .from("initiative_leaders")
      .insert({
        initiative_id: initiativeId,
        user_id: userId,
        leader_type: leaderType,
      })
      .select()
      .single();

    if (error) throw error;
    return data as InitiativeLeader;
  }
}
