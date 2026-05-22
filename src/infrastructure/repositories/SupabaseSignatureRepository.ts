import type {
  InstrumentSignatureRequest,
  InstrumentSignature,
} from "@/core/entities/Signature";
import type { ISignatureRepository } from "@/core/repositories/ISignatureRepository";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseSignatureRepository implements ISignatureRepository {
  constructor(private supabase: SupabaseClient) {}

  async createRequest(
    instrumentId: string,
    initiativeId: string,
    createdBy: string,
    targetCount?: number
  ): Promise<InstrumentSignatureRequest> {
    const { data, error } = await this.supabase
      .from("instrument_signature_requests")
      .insert({
        instrument_id: instrumentId,
        initiative_id: initiativeId,
        created_by: createdBy,
        status: "OPEN",
        target_count: targetCount ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as InstrumentSignatureRequest;
  }

  async getRequestsByInstrument(
    instrumentId: string
  ): Promise<InstrumentSignatureRequest[]> {
    const { data, error } = await this.supabase
      .from("instrument_signature_requests")
      .select("*")
      .eq("instrument_id", instrumentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as InstrumentSignatureRequest[];
  }

  async getRequestsByInitiative(
    initiativeId: string
  ): Promise<InstrumentSignatureRequest[]> {
    const { data, error } = await this.supabase
      .from("instrument_signature_requests")
      .select("*")
      .eq("initiative_id", initiativeId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as InstrumentSignatureRequest[];
  }

  async addSignature(
    requestId: string,
    instrumentId: string,
    signerUserId: string,
    evidence?: Record<string, unknown>
  ): Promise<InstrumentSignature> {
    const { data, error } = await this.supabase
      .from("instrument_signatures")
      .insert({
        signature_request_id: requestId,
        instrument_id: instrumentId,
        signer_user_id: signerUserId,
        evidence: evidence ?? {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as InstrumentSignature;
  }

  async getSignaturesByRequest(
    requestId: string
  ): Promise<InstrumentSignature[]> {
    const { data, error } = await this.supabase
      .from("instrument_signatures")
      .select("*")
      .eq("signature_request_id", requestId)
      .order("signed_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as InstrumentSignature[];
  }
}
