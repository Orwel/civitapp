import { createHash } from "crypto";
import type { Profile } from "@/core/entities/Profile";
import type { Repositories } from "@/infrastructure/repositories";
import { formatSignedAtColombia } from "@/lib/formatColombiaTime";

export interface SignActionMeta {
  client_ip?: string | null;
  user_agent?: string | null;
  signer_geo_country?: string | null;
  signer_geo_region?: string | null;
  signer_geo_city?: string | null;
  signer_lat?: number | null;
  signer_lng?: number | null;
  /** Imagen de firma dibujada en el pad. */
  signature_storage_path?: string | null;
  signer_email?: string | null;
}

function signerSnapshot(profile: Profile, userId: string, email?: string | null) {
  const fullName =
    profile.full_name?.trim() || email?.split("@")[0]?.trim() || "Participante";
  const cedula =
    profile.cedula?.trim() || `PRUEBA-${userId.replace(/-/g, "").slice(0, 10)}`;
  return { fullName, cedula };
}

export async function signAction(
  repos: Repositories,
  actionId: string,
  userId: string,
  profile: Profile,
  meta?: SignActionMeta
): Promise<void> {
  const signaturePath = meta?.signature_storage_path?.trim();
  if (!signaturePath) {
    throw new Error("Debes dibujar tu firma en el recuadro");
  }
  const action = await repos.actions.getById(actionId);
  if (!action) throw new Error("Acción no encontrada");
  if (action.state !== "EN_FIRMA") {
    throw new Error("Esta acción no está en recolección de firmas");
  }
  const already = await repos.actions.hasSigned(actionId, userId);
  if (already) throw new Error("Ya firmaste esta acción");

  const { fullName, cedula } = signerSnapshot(profile, userId, meta?.signer_email);
  const signedAt = new Date().toISOString();
  const contentHash = action.body_snapshot_sha256 ?? "";
  const signatureHash = createHash("sha256")
    .update(`${userId}|${actionId}|${signedAt}|${cedula}|${contentHash}`)
    .digest("hex");

  await repos.actions.signAction(actionId, userId, {
    full_name: fullName,
    cedula,
    signature_path: signaturePath,
    identity_status: profile.identity_verification_status,
    signed_at_co_pretty: formatSignedAtColombia(signedAt),
    signature_hash: signatureHash,
    content_snapshot_sha256: contentHash || null,
    client_ip: meta?.client_ip ?? null,
    user_agent: meta?.user_agent ?? null,
    signer_geo_country: meta?.signer_geo_country ?? "CO",
    signer_geo_region: meta?.signer_geo_region ?? null,
    signer_geo_city: meta?.signer_geo_city ?? null,
    signer_lat: meta?.signer_lat ?? null,
    signer_lng: meta?.signer_lng ?? null,
  });
}
