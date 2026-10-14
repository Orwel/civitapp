import type {
  ConstitutionalAction,
  ConstitutionalActionPublic,
} from "@/core/entities/ConstitutionalAction";
import type {
  ActionSignatureRow,
  CreateActionInput,
  IConstitutionalActionRepository,
} from "@/core/repositories/IConstitutionalActionRepository";
import type {
  ActionState,
  FinalizadoResult,
  RadicadoMilestone,
} from "@/core/types/actionState";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseConstitutionalActionRepository
  implements IConstitutionalActionRepository
{
  constructor(private supabase: SupabaseClient) {}

  private mapRow(row: Record<string, unknown>): ConstitutionalAction {
    return {
      ...(row as unknown as ConstitutionalAction),
      action_type: (row.action_types as ConstitutionalAction["action_type"]) ?? null,
    };
  }

  async create(data: CreateActionInput): Promise<ConstitutionalAction> {
    const { data: row, error } = await this.supabase
      .from("constitutional_actions")
      .insert({
        slug: data.slug,
        action_type_id: data.action_type_id,
        title: data.title,
        summary: data.summary ?? null,
        content_mode: data.content_mode ?? "TEXT",
        content_body: data.content_body ?? null,
        content_data: data.content_data ?? {},
        minimum_required: data.minimum_required ?? 1,
        target_count: data.target_count ?? null,
        firma_deadline_at: data.firma_deadline_at ?? null,
        publicacion_mode: data.publicacion_mode ?? "MANUAL",
        publicacion_programada_at: data.publicacion_programada_at ?? null,
        visibility: data.visibility ?? "PUBLIC",
        created_by: data.created_by,
        draft_collaboration: data.draft_collaboration ?? "OPEN_INVITED",
        signature_close_rule: data.signature_close_rule ?? "QUORUM_OR_DEADLINE",
        state: "EN_CREACION",
        client_request_id: data.client_request_id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return row as ConstitutionalAction;
  }

  async findByCreatorRequest(
    userId: string,
    clientRequestId: string
  ): Promise<ConstitutionalAction | null> {
    const { data, error } = await this.supabase
      .from("constitutional_actions")
      .select("*")
      .eq("created_by", userId)
      .eq("client_request_id", clientRequestId)
      .maybeSingle();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as ConstitutionalAction | null;
  }

  async getById(id: string): Promise<ConstitutionalAction | null> {
    const { data, error } = await this.supabase
      .from("constitutional_actions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as ConstitutionalAction;
  }

  async getByIdWithType(id: string): Promise<ConstitutionalAction | null> {
    const { data, error } = await this.supabase
      .from("constitutional_actions")
      .select("*, action_types(*)")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return this.mapRow(data as Record<string, unknown>);
  }

  async getBySlug(slug: string): Promise<ConstitutionalAction | null> {
    const { data, error } = await this.supabase
      .from("constitutional_actions")
      .select("*, action_types(*)")
      .eq("slug", slug)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return this.mapRow(data as Record<string, unknown>);
  }

  async getPublicBySlug(slug: string): Promise<ConstitutionalActionPublic | null> {
    const { data, error } = await this.supabase
      .from("constitutional_actions_public")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as ConstitutionalActionPublic;
  }

  async listByCreator(userId: string): Promise<ConstitutionalAction[]> {
    const { data, error } = await this.supabase
      .from("constitutional_actions")
      .select("*, action_types(*)")
      .eq("created_by", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.mapRow(r as Record<string, unknown>));
  }

  async listSignedByUser(userId: string): Promise<ConstitutionalAction[]> {
    const { data: sigs, error: e1 } = await this.supabase
      .from("constitutional_action_signatures")
      .select("action_id")
      .eq("signer_user_id", userId);
    if (e1) throw e1;
    const ids = [...new Set((sigs ?? []).map((s) => s.action_id))];
    if (ids.length === 0) return [];
    const { data, error } = await this.supabase
      .from("constitutional_actions")
      .select("*, action_types(*)")
      .in("id", ids)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.mapRow(r as Record<string, unknown>));
  }

  async listPublic(limit = 50): Promise<ConstitutionalActionPublic[]> {
    const { data, error } = await this.supabase
      .from("constitutional_actions_public")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ConstitutionalActionPublic[];
  }

  async listPublicByState(
    state: import("@/core/types/actionState").ActionState,
    limit = 50
  ): Promise<ConstitutionalActionPublic[]> {
    const { data, error } = await this.supabase
      .from("constitutional_actions_public")
      .select("*")
      .eq("state", state)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ConstitutionalActionPublic[];
  }

  async listGuestSidebar(): Promise<{
    inSignature: ConstitutionalActionPublic[];
    inDraft: ConstitutionalActionPublic[];
  }> {
    const [inSignature, inDraft] = await Promise.all([
      this.listPublicByState("EN_FIRMA", 3),
      this.listPublicByState("EN_CREACION", 2),
    ]);
    return { inSignature, inDraft };
  }

  async update(
    id: string,
    patch: Parameters<IConstitutionalActionRepository["update"]>[1]
  ): Promise<ConstitutionalAction | null> {
    const { data, error } = await this.supabase
      .from("constitutional_actions")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ConstitutionalAction;
  }

  async addRole(
    actionId: string,
    userId: string,
    role: "CREADOR" | "LIDER" | "CO_LIDER" | "APOYO",
    grantedBy: string
  ): Promise<void> {
    const { error } = await this.supabase.from("constitutional_action_roles").insert({
      action_id: actionId,
      user_id: userId,
      role,
      granted_by: grantedBy,
    });
    if (error) throw error;
  }

  async transitionState(
    actionId: string,
    toState: ActionState,
    options?: {
      reason?: string;
      radicado_milestone?: RadicadoMilestone;
      finalizado_result?: FinalizadoResult;
      radicado_number?: string;
      radicado_entity_name?: string;
      radicado_at?: string;
      milestone_code?: string;
    }
  ): Promise<ConstitutionalAction> {
    const { data, error } = await this.supabase.rpc("transition_action_state", {
      p_action_id: actionId,
      p_to_state: toState,
      p_reason: options?.reason ?? null,
      p_radicado_milestone: options?.radicado_milestone ?? null,
      p_finalizado_result: options?.finalizado_result ?? null,
      p_radicado_number: options?.radicado_number ?? null,
      p_radicado_entity_name: options?.radicado_entity_name ?? null,
      p_radicado_at: options?.radicado_at ?? null,
      p_milestone_code: options?.milestone_code ?? null,
    });
    if (error) throw error;
    return data as ConstitutionalAction;
  }

  async setMilestone(actionId: string, code: string): Promise<ConstitutionalAction> {
    const { data, error } = await this.supabase.rpc("set_action_milestone", {
      p_action_id: actionId,
      p_code: code,
    });
    if (error) throw error;
    return data as ConstitutionalAction;
  }

  async setFinalDocument(actionId: string, storagePath: string, sha256: string): Promise<void> {
    const { error } = await this.supabase
      .from("constitutional_actions")
      .update({
        final_document_storage_path: storagePath,
        final_document_sha256: sha256,
        updated_at: new Date().toISOString(),
      })
      .eq("id", actionId);
    if (error) throw error;
  }

  async signAction(
    actionId: string,
    signerUserId: string,
    snapshot: Parameters<IConstitutionalActionRepository["signAction"]>[2]
  ): Promise<void> {
    const { error } = await this.supabase
      .from("constitutional_action_signatures")
      .insert({
        action_id: actionId,
        signer_user_id: signerUserId,
        snapshot_full_name: snapshot.full_name,
        snapshot_cedula: snapshot.cedula,
        snapshot_signature_storage_path: snapshot.signature_path,
        signature_level: snapshot.signature_level,
        snapshot_address: snapshot.address ?? null,
        snapshot_phone: snapshot.phone ?? null,
        snapshot_email: snapshot.email ?? null,
        data_consent_at: snapshot.data_consent_at,
        data_consent_version: snapshot.data_consent_version,
        identity_verified_at_sign: snapshot.identity_status,
        signer_geo_country: snapshot.signer_geo_country ?? null,
        signer_geo_region: snapshot.signer_geo_region ?? null,
        signer_geo_city: snapshot.signer_geo_city ?? null,
        signer_lat: snapshot.signer_lat ?? null,
        signer_lng: snapshot.signer_lng ?? null,
        signed_at_co_pretty: snapshot.signed_at_co_pretty ?? null,
        signature_hash: snapshot.signature_hash ?? null,
        content_snapshot_sha256: snapshot.content_snapshot_sha256 ?? null,
        client_ip: snapshot.client_ip ?? null,
        user_agent: snapshot.user_agent ?? null,
      });
    if (error) throw error;
  }

  async listSignaturesForAction(actionId: string) {
    // PostgREST corta en 1.000 filas por defecto: se pagina para no perder firmas.
    const PAGE = 1000;
    const rows: ActionSignatureRow[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.supabase
        .from("constitutional_action_signatures")
        .select(
          "signer_user_id, snapshot_full_name, snapshot_cedula, signed_at, signed_at_co_pretty, signer_geo_city, signer_geo_region, signer_geo_country, signature_hash, snapshot_signature_storage_path, signature_level"
        )
        .eq("action_id", actionId)
        .order("signed_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      rows.push(...((data ?? []) as ActionSignatureRow[]));
      if (!data || data.length < PAGE) break;
    }
    return rows;
  }

  async hasSigned(actionId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("constitutional_action_signatures")
      .select("id")
      .eq("action_id", actionId)
      .eq("signer_user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async evaluateTransitions(actionId: string): Promise<void> {
    const { error } = await this.supabase.rpc("evaluate_action_transitions", {
      p_action_id: actionId,
    });
    if (error) throw error;
  }
}
