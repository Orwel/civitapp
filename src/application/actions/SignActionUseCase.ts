import { createHash } from "crypto";
import type { Profile } from "@/core/entities/Profile";
import {
  resolveSignatureLevel,
  resolveSignerFields,
  type ActionType,
  type SignerFieldKey,
} from "@/core/entities/ActionType";
import type { Repositories } from "@/infrastructure/repositories";
import { formatSignedAtColombia } from "@/lib/formatColombiaTime";
import { DATA_CONSENT_VERSION } from "@/lib/legal/dataConsent";

export interface SignActionMeta {
  client_ip?: string | null;
  user_agent?: string | null;
  signer_geo_country?: string | null;
  signer_geo_region?: string | null;
  signer_geo_city?: string | null;
  signer_lat?: number | null;
  signer_lng?: number | null;
}

export interface SignerInput {
  full_name: string;
  cedula: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  data_consent: boolean;
  /** Imagen de firma dibujada (solo si el tipo la exige). */
  signature_storage_path?: string | null;
}

const FIELD_LABELS: Record<SignerFieldKey, string> = {
  cedula: "la cédula",
  address: "la dirección",
  phone: "el celular",
  email: "el correo",
};

export function normalizeCedula(raw: string): string {
  return raw.replace(/[^\dA-Za-z]/g, "").toUpperCase();
}

export function validateSignerInput(
  type: Pick<ActionType, "signer_fields" | "signature_level"> | null,
  input: SignerInput
): { ok: true; value: Required<Omit<SignerInput, "data_consent">> } | { ok: false; error: string } {
  const fields = resolveSignerFields(type);
  const level = resolveSignatureLevel(type);

  const fullName = input.full_name.replace(/\s+/g, " ").trim();
  if (fullName.length < 5 || !fullName.includes(" ")) {
    return { ok: false, error: "Escribe tu nombre completo (nombres y apellidos)." };
  }
  const cedula = normalizeCedula(input.cedula ?? "");
  if (!/^(\d{5,10}|[A-Z0-9]{5,15})$/.test(cedula)) {
    return { ok: false, error: "Revisa el número de cédula (solo números, sin puntos)." };
  }
  const address = input.address?.trim() || null;
  const phone = input.phone?.replace(/[^\d+]/g, "") || null;
  const email = input.email?.trim().toLowerCase() || null;

  for (const key of ["address", "phone", "email"] as const) {
    const value = { address, phone, email }[key];
    if (fields[key] === "required" && !value) {
      return { ok: false, error: `Falta ${FIELD_LABELS[key]}.` };
    }
  }
  if (phone && !/^\+?\d{7,13}$/.test(phone)) {
    return { ok: false, error: "Revisa el número de celular." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Revisa el correo electrónico." };
  }
  if (!input.data_consent) {
    return { ok: false, error: "Debes autorizar el tratamiento de tus datos para firmar." };
  }
  const signaturePath = input.signature_storage_path?.trim() || null;
  if (level !== "SIMPLE" && !signaturePath) {
    return { ok: false, error: "Dibuja tu firma en el recuadro." };
  }

  return {
    ok: true,
    value: {
      full_name: fullName,
      cedula,
      address: fields.address ? address : null,
      phone: fields.phone ? phone : null,
      email: fields.email ? email : null,
      signature_storage_path: level === "SIMPLE" ? null : signaturePath,
    },
  };
}

export async function signAction(
  repos: Repositories,
  actionId: string,
  userId: string,
  profile: Profile,
  input: SignerInput,
  meta?: SignActionMeta
): Promise<{ signatureNumber: number | null }> {
  const action = await repos.actions.getById(actionId);
  if (!action) throw new Error("Acción no encontrada");
  if (action.state !== "EN_FIRMA") {
    throw new Error("Esta acción no está en recolección de firmas");
  }
  const type = await repos.catalog.getActionType(action.action_type_id);
  const level = resolveSignatureLevel(type);
  if (level === "VERIFIED" && profile.identity_verification_status !== "APPROVED") {
    throw new Error("Esta acción exige identidad verificada antes de firmar");
  }

  const checked = validateSignerInput(type, input);
  if (!checked.ok) throw new Error(checked.error);
  const signer = checked.value;

  if (await repos.actions.hasSigned(actionId, userId)) {
    throw new Error("Ya firmaste esta acción");
  }

  const signedAt = new Date().toISOString();
  const contentHash = action.body_snapshot_sha256 ?? "";
  const signatureHash = createHash("sha256")
    .update(`${userId}|${actionId}|${signedAt}|${signer.cedula}|${contentHash}`)
    .digest("hex");

  try {
    await repos.actions.signAction(actionId, userId, {
      full_name: signer.full_name,
      cedula: signer.cedula,
      signature_path: signer.signature_storage_path,
      signature_level: level,
      address: signer.address,
      phone: signer.phone,
      email: signer.email,
      data_consent_at: signedAt,
      data_consent_version: DATA_CONSENT_VERSION,
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
  } catch (err) {
    const code = (err as { code?: string; message?: string })?.code;
    const msg = (err as { message?: string })?.message ?? "";
    if (code === "23505") {
      throw new Error(
        msg.includes("cedula")
          ? "Ya hay una firma registrada con esta cédula en esta acción."
          : "Ya firmaste esta acción"
      );
    }
    throw err;
  }

  // Reutiliza los datos para próximas acciones del mismo caso (autorizado en el consentimiento).
  await repos.users
    .updateSignerContact(userId, {
      full_name: signer.full_name,
      cedula: signer.cedula,
      address: signer.address,
      phone: signer.phone,
    })
    .catch(() => undefined);

  const publicAction = await repos.actions.getPublicBySlug(action.slug).catch(() => null);
  return { signatureNumber: publicAction?.signatures_count ?? null };
}
