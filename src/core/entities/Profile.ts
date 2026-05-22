import type { RoleGlobal } from "@/core/enums/Roles";

export interface Profile {
  id: string;
  full_name: string | null;
  photo_url: string | null;
  role?: RoleGlobal;
  cedula: string | null;
  cedula_front_path: string | null;
  cedula_back_path: string | null;
  selfie_path: string | null;
  signature_image_path: string | null;
  identity_verification_status: "PENDING" | "APPROVED" | "REJECTED";
  identity_verified_at: string | null;
  identity_verified_by: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PoliticalProfile {
  user_id: string;
  office_type: string;
  region: string | null;
  verification_status: string;
  verified_at: string | null;
  verified_by: string | null;
  public_profile: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function profileHasSignableIdentity(profile: Profile): boolean {
  return Boolean(
    profile.cedula?.trim() &&
      profile.signature_image_path?.trim() &&
      profile.cedula_front_path?.trim()
  );
}
