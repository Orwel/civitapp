import type {
  ConstitutionalAction,
  ConstitutionalActionPublic,
} from "@/core/entities/ConstitutionalAction";
import type {
  ActionContentMode,
  ActionState,
  ActionVisibility,
  FinalizadoResult,
  PublicacionMode,
  RadicadoMilestone,
} from "@/core/types/actionState";

export interface CreateActionInput {
  action_type_id: string;
  title: string;
  summary?: string | null;
  slug: string;
  content_mode?: ActionContentMode;
  content_body?: string | null;
  content_data?: Record<string, unknown>;
  minimum_required?: number;
  target_count?: number | null;
  firma_deadline_at?: string | null;
  publicacion_mode?: PublicacionMode;
  publicacion_programada_at?: string | null;
  visibility?: ActionVisibility;
  created_by: string;
  draft_collaboration?: "OPEN_AUTH" | "OPEN_INVITED";
  signature_close_rule?: "DEADLINE_WINS" | "QUORUM_OR_DEADLINE" | "QUORUM_ONLY";
  client_request_id?: string | null;
}

export interface ActionSignatureRow {
  signer_user_id: string;
  snapshot_full_name: string;
  snapshot_cedula: string;
  signed_at: string;
  signed_at_co_pretty: string | null;
  signer_geo_city: string | null;
  signer_geo_region: string | null;
  signer_geo_country: string | null;
  signature_hash: string | null;
  snapshot_signature_storage_path: string;
  client_ip: string | null;
  user_agent: string | null;
}

export interface IConstitutionalActionRepository {
  create(data: CreateActionInput): Promise<ConstitutionalAction>;
  findByCreatorRequest(
    userId: string,
    clientRequestId: string
  ): Promise<ConstitutionalAction | null>;
  getById(id: string): Promise<ConstitutionalAction | null>;
  getByIdWithType(id: string): Promise<ConstitutionalAction | null>;
  getBySlug(slug: string): Promise<ConstitutionalAction | null>;
  getPublicBySlug(slug: string): Promise<ConstitutionalActionPublic | null>;
  listByCreator(userId: string): Promise<ConstitutionalAction[]>;
  listSignedByUser(userId: string): Promise<ConstitutionalAction[]>;
  listPublic(limit?: number): Promise<ConstitutionalActionPublic[]>;
  listPublicByState(
    state: ActionState,
    limit?: number
  ): Promise<ConstitutionalActionPublic[]>;
  listGuestSidebar(): Promise<{
    inSignature: ConstitutionalActionPublic[];
    inDraft: ConstitutionalActionPublic[];
  }>;
  update(
    id: string,
    data: Partial<
      Pick<
        ConstitutionalAction,
        | "title"
        | "summary"
        | "content_body"
        | "content_data"
        | "content_mode"
        | "content_pdf_storage_path"
        | "minimum_required"
        | "target_count"
        | "firma_deadline_at"
        | "publicacion_programada_at"
        | "visibility"
      >
    >
  ): Promise<ConstitutionalAction | null>;
  addRole(
    actionId: string,
    userId: string,
    role: "CREADOR" | "LIDER" | "CO_LIDER" | "APOYO",
    grantedBy: string
  ): Promise<void>;
  transitionState(
    actionId: string,
    toState: ActionState,
    options?: {
      reason?: string;
      radicado_milestone?: RadicadoMilestone;
      finalizado_result?: FinalizadoResult;
      radicado_number?: string;
      radicado_entity_name?: string;
    }
  ): Promise<ConstitutionalAction>;
  signAction(
    actionId: string,
    signerUserId: string,
    snapshot: {
      full_name: string;
      cedula: string;
      signature_path: string;
      identity_status: string;
      signer_geo_country?: string | null;
      signer_geo_region?: string | null;
      signer_geo_city?: string | null;
      signer_lat?: number | null;
      signer_lng?: number | null;
      signed_at_co_pretty?: string | null;
      signature_hash?: string | null;
      content_snapshot_sha256?: string | null;
      client_ip?: string | null;
      user_agent?: string | null;
    }
  ): Promise<void>;
  listSignaturesForAction(actionId: string): Promise<ActionSignatureRow[]>;
  hasSigned(actionId: string, userId: string): Promise<boolean>;
  evaluateTransitions(actionId: string): Promise<void>;
}
