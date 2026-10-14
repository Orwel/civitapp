import type {
  ActionContentMode,
  ActionState,
  ActionVisibility,
  FinalizadoResult,
  PublicacionMode,
  RadicadoMilestone,
} from "@/core/types/actionState";
import type { ActionType } from "@/core/entities/ActionType";

export interface ConstitutionalAction {
  id: string;
  slug: string;
  action_type_id: string;
  title: string;
  summary: string | null;
  content_mode: ActionContentMode;
  content_template_id: string | null;
  content_data: Record<string, unknown>;
  content_body: string | null;
  content_pdf_storage_path: string | null;
  state: ActionState;
  radicado_milestone: RadicadoMilestone | null;
  finalizado_result: FinalizadoResult | null;
  minimum_required: number;
  target_count: number | null;
  firma_deadline_at: string | null;
  firma_opened_at: string | null;
  publicacion_mode: PublicacionMode;
  publicacion_programada_at: string | null;
  radicado_at: string | null;
  radicado_number: string | null;
  radicado_entity_name: string | null;
  final_document_storage_path: string | null;
  final_document_sha256: string | null;
  body_snapshot_sha256?: string | null;
  body_frozen_at?: string | null;
  draft_collaboration?: "OPEN_AUTH" | "OPEN_INVITED";
  signature_close_rule?: "DEADLINE_WINS" | "QUORUM_OR_DEADLINE" | "QUORUM_ONLY";
  editor_lock_user_id?: string | null;
  visibility: ActionVisibility;
  created_by: string;
  created_at: string;
  updated_at: string;
  /** Hito actual (código definido por tipo en action_type_milestones). */
  milestone_code?: string | null;
  /** Último día del término de respuesta (fecha civil, Bogotá). */
  response_due_on?: string | null;
  action_type?: ActionType | null;
  signatures_count?: number;
}

export interface ActionLeaderPublic {
  full_name: string | null;
  role: string;
}

export interface ConstitutionalActionPublic {
  id: string;
  slug: string;
  action_type_id: string;
  title: string;
  summary: string | null;
  state: ActionState;
  radicado_milestone: RadicadoMilestone | null;
  finalizado_result: FinalizadoResult | null;
  minimum_required: number;
  target_count: number | null;
  firma_deadline_at: string | null;
  visibility: ActionVisibility;
  created_at: string;
  signatures_count: number;
  leaders?: ActionLeaderPublic[] | null;
  body_snapshot_sha256?: string | null;
  final_document_sha256?: string | null;
  milestone_code?: string | null;
  radicado_at?: string | null;
  response_due_on?: string | null;
  content_mode?: ActionContentMode;
  content_body?: string | null;
  content_pdf_storage_path?: string | null;
}
