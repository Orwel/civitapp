import type {
  InitiativeMember,
  InitiativeMemberWithProfile,
} from "@/core/entities/Member";
import type { IInitiativeMemberRepository } from "@/core/repositories/IInitiativeMemberRepository";
import type { RoleInInitiative } from "@/core/enums/Roles";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseInitiativeMemberRepository
  implements IInitiativeMemberRepository
{
  constructor(private supabase: SupabaseClient) {}

  async add(
    initiativeId: string,
    userId: string,
    role: RoleInInitiative
  ): Promise<InitiativeMember> {
    const { data, error } = await this.supabase.rpc("add_initiative_member", {
      p_initiative_id: initiativeId,
      p_user_id: userId,
      p_role: role,
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row as InitiativeMember;
  }

  async getByInitiative(
    initiativeId: string
  ): Promise<InitiativeMemberWithProfile[]> {
    const { data: members, error: membersError } = await this.supabase
      .from("initiative_members")
      .select("*")
      .eq("initiative_id", initiativeId);

    if (membersError) throw membersError;
    if (!members?.length) return [];

    const userIds = [...new Set(members.map((m) => m.user_id))];
    const { data: profiles, error: profilesError } = await this.supabase
      .from("profiles")
      .select("id, full_name, photo_url")
      .in("id", userIds);

    if (profilesError) throw profilesError;
    const profileByUserId = new Map(
      (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, photo_url: p.photo_url }])
    );
    return members.map((m) => ({
      ...m,
      profile: profileByUserId.get(m.user_id) ?? null,
    })) as InitiativeMemberWithProfile[];
  }

  async getByUser(userId: string): Promise<InitiativeMember[]> {
    const { data, error } = await this.supabase
      .from("initiative_members")
      .select("*")
      .eq("user_id", userId)
      .eq("member_status", "ACTIVE");

    if (error) throw error;
    return (data ?? []) as InitiativeMember[];
  }

  async getMember(
    initiativeId: string,
    userId: string
  ): Promise<InitiativeMember | null> {
    const { data, error } = await this.supabase
      .from("initiative_members")
      .select("*")
      .eq("initiative_id", initiativeId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as InitiativeMember;
  }

  async isActiveMember(initiativeId: string, userId: string): Promise<boolean> {
    const m = await this.getMember(initiativeId, userId);
    return m?.member_status === "ACTIVE";
  }
}
