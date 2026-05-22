import type { Invitation, InvitationPreview } from "@/core/entities/Invitation";
import type {
  IInvitationRepository,
  CreateInvitationInput,
  RedeemResult,
} from "@/core/repositories/IInvitationRepository";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseInvitationRepository implements IInvitationRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(
    input: CreateInvitationInput,
    createdBy: string
  ): Promise<Invitation> {
    const { data, error } = await this.supabase
      .from("invitations")
      .insert({
        initiative_id: input.initiativeId,
        instrument_id: input.instrumentId ?? null,
        signature_request_id: input.signatureRequestId ?? null,
        type: input.type,
        email: input.email ?? null,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Invitation;
  }

  async getPreviewByToken(token: string): Promise<InvitationPreview | null> {
    const { data, error } = await this.supabase.rpc("get_invitation_preview", {
      p_token: token,
    });

    if (error) {
      if (error.code === "PGRST116" || error.message?.includes("null")) return null;
      throw error;
    }
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    if (!d.initiative_id) return null;
    return {
      initiative_id: d.initiative_id as string,
      initiative_title: (d.initiative_title as string) ?? "",
      type: (d.type as "JOIN" | "SIGN") ?? "JOIN",
      instrument_id: (d.instrument_id as string) ?? null,
      signature_request_id: (d.signature_request_id as string) ?? null,
      expires_at: (d.expires_at as string) ?? "",
      valid: (d.valid as boolean) ?? false,
    };
  }

  async redeem(token: string): Promise<RedeemResult> {
    const { data, error } = await this.supabase.rpc("redeem_invitation", {
      p_token: token,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data || typeof data !== "object") {
      return { ok: false, error: "Respuesta inválida" };
    }
    const d = data as Record<string, unknown>;
    if (d.ok !== true) {
      return {
        ok: false,
        error: (d.error as string) ?? "invitation_not_found_or_expired",
      };
    }
    return {
      ok: true,
      type: d.type as "JOIN" | "SIGN",
      initiative_id: d.initiative_id as string,
      instrument_id: (d.instrument_id as string) ?? null,
      signature_request_id: (d.signature_request_id as string) ?? null,
    };
  }
}
