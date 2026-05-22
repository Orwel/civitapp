import type { Profile, PoliticalProfile } from "@/core/entities/Profile";
import type {
  IUserRepository,
  UpdateSignableIdentityInput,
} from "@/core/repositories/IUserRepository";
import type { RoleGlobal } from "@/core/enums/Roles";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseUserRepository implements IUserRepository {
  constructor(private supabase: SupabaseClient) {}

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as Profile;
  }

  async updateSignableIdentity(
    userId: string,
    input: UpdateSignableIdentityInput
  ): Promise<Profile> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update({
        cedula: input.cedula,
        cedula_front_path: input.cedula_front_path,
        cedula_back_path: input.cedula_back_path ?? null,
        selfie_path: input.selfie_path ?? null,
        signature_image_path: input.signature_image_path,
        identity_verification_status: "PENDING",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  }

  async getRoles(userId: string): Promise<RoleGlobal[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (error) {
      if (error.code === "PGRST116") return [];
      throw error;
    }
    const role = (data as { role?: RoleGlobal }).role ?? "USER";
    return [role];
  }

  async isAdmin(userId: string): Promise<boolean> {
    const roles = await this.getRoles(userId);
    return roles.includes("ADMIN");
  }

  async getPoliticalProfile(userId: string): Promise<PoliticalProfile | null> {
    const { data, error } = await this.supabase
      .from("political_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as PoliticalProfile;
  }

  async listProfilesPendingIdentity(limit = 50): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("identity_verification_status", "PENDING")
      .not("cedula", "is", null)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Profile[];
  }

  async setIdentityVerification(
    userId: string,
    status: "APPROVED" | "REJECTED",
    verifiedBy: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from("profiles")
      .update({
        identity_verification_status: status,
        identity_verified_at: new Date().toISOString(),
        identity_verified_by: verifiedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) throw error;
  }
}
