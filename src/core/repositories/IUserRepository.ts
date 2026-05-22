import type { Profile, PoliticalProfile } from "@/core/entities/Profile";
import type { RoleGlobal } from "@/core/enums/Roles";

export interface UpdateSignableIdentityInput {
  cedula: string;
  cedula_front_path: string;
  cedula_back_path?: string | null;
  selfie_path?: string | null;
  signature_image_path: string;
}

export interface IUserRepository {
  getProfile(userId: string): Promise<Profile | null>;
  updateSignableIdentity(userId: string, data: UpdateSignableIdentityInput): Promise<Profile>;
  getRoles(userId: string): Promise<RoleGlobal[]>;
  isAdmin(userId: string): Promise<boolean>;
  getPoliticalProfile(userId: string): Promise<PoliticalProfile | null>;
  listProfilesPendingIdentity(limit?: number): Promise<Profile[]>;
  setIdentityVerification(
    userId: string,
    status: "APPROVED" | "REJECTED",
    verifiedBy: string
  ): Promise<void>;
}
