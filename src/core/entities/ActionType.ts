export type ActionTypeCategory = "ADMINISTRATIVA" | "QUEJA" | "JUDICIAL";

/** SIMPLE: datos + autorización · DRAWN: además firma manuscrita · VERIFIED: identidad aprobada */
export type SignatureLevel = "SIMPLE" | "DRAWN" | "VERIFIED";

export type SignerFieldKey = "cedula" | "address" | "phone" | "email";
export type SignerFieldRequirement = "required" | "optional";
export type SignerFieldsConfig = Partial<Record<SignerFieldKey, SignerFieldRequirement>>;

export interface ActionType {
  id: string;
  name: string;
  slug: string;
  competent_entity_hint: string | null;
  order_index: number;
  created_at: string;
  description?: string | null;
  category?: ActionTypeCategory;
  response_business_days?: number | null;
  default_close_rule?: "DEADLINE_WINS" | "QUORUM_OR_DEADLINE" | "QUORUM_ONLY";
  signature_level?: SignatureLevel;
  signer_fields?: SignerFieldsConfig;
  next_action_type_slug?: string | null;
  active?: boolean;
}

export interface ActionTypeMilestone {
  action_type_id: string;
  code: string;
  label: string;
  order_index: number;
}

/** La cédula siempre se pide: es lo mínimo para identificar a un peticionario. */
export function resolveSignerFields(type: Pick<ActionType, "signer_fields"> | null | undefined): SignerFieldsConfig {
  return { cedula: "required", ...(type?.signer_fields ?? {}) };
}

export function resolveSignatureLevel(type: Pick<ActionType, "signature_level"> | null | undefined): SignatureLevel {
  return type?.signature_level ?? "DRAWN";
}
