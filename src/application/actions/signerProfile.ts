import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/core/entities/Profile";

/** Perfil mínimo para firmar en modo prueba (sin cédula ni adjuntos). */
export function profileForSigning(user: User, existing: Profile | null): Profile {
  if (existing) return existing;
  const now = new Date().toISOString();
  const name =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Participante";
  return {
    id: user.id,
    full_name: name,
    photo_url: null,
    cedula: null,
    cedula_front_path: null,
    cedula_back_path: null,
    selfie_path: null,
    signature_image_path: null,
    identity_verification_status: "PENDING",
    identity_verified_at: null,
    identity_verified_by: null,
    onboarded_at: null,
    created_at: now,
    updated_at: now,
  };
}
