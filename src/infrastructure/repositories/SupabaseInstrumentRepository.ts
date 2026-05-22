import type {
  InstrumentCatalogItem,
  InitiativeInstrument,
} from "@/core/entities/Instrument";
import type { IInstrumentRepository } from "@/core/repositories/IInstrumentRepository";
import type { InitiativeSubtype } from "@/core/enums/InitiativeSubtype";
import type { InstrumentStatus } from "@/core/enums/InstrumentStatus";
import type { InstrumentState } from "@/core/types/instrumentState";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseInstrumentRepository implements IInstrumentRepository {
  constructor(private supabase: SupabaseClient) {}

  private isMissingRelationshipError(err: unknown): boolean {
    const e = err as { code?: string; message?: string };
    return (
      e?.code === "PGRST200" ||
      (typeof e?.message === "string" &&
        e.message.includes("Could not find a relationship"))
    );
  }

  async getCatalogBySubtype(
    subtype: InitiativeSubtype
  ): Promise<InstrumentCatalogItem[]> {
    const { data, error } = await this.supabase
      .from("instrument_catalog")
      .select("*")
      .eq("initiative_subtype", subtype)
      .order("order_index", { ascending: true });

    if (error) throw error;
    return (data ?? []) as InstrumentCatalogItem[];
  }

  async createFromCatalog(
    initiativeId: string,
    catalogId: string,
    kind: string
  ): Promise<InitiativeInstrument> {
    const { data, error } = await this.supabase
      .from("initiative_instruments")
      .insert({
        initiative_id: initiativeId,
        catalog_id: catalogId,
        kind,
        status: "NO_INICIADO",
        estado: "BORRADOR",
        requiere_firmas: false,
        payload: {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as InitiativeInstrument;
  }

  async createByInstrumentType(
    initiativeId: string,
    instrumentTypeId: string,
    options?: { requiresSignatures?: boolean; metaFirmas?: number | null }
  ): Promise<InitiativeInstrument> {
    const { data, error } = await this.supabase
      .from("initiative_instruments")
      .insert({
        initiative_id: initiativeId,
        instrument_type_id: instrumentTypeId,
        catalog_id: null,
        estado: "BORRADOR",
        requiere_firmas: options?.requiresSignatures ?? false,
        meta_firmas: options?.metaFirmas ?? null,
        payload: {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as InitiativeInstrument;
  }

  async createCustom(
    initiativeId: string,
    kind: string,
    customTitle?: string | null
  ): Promise<InitiativeInstrument> {
    const { data, error } = await this.supabase
      .from("initiative_instruments")
      .insert({
        initiative_id: initiativeId,
        catalog_id: null,
        instrument_type_id: null,
        custom_title: customTitle ?? null,
        kind,
        status: "NO_INICIADO",
        estado: "BORRADOR",
        requiere_firmas: false,
        payload: {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as InitiativeInstrument;
  }

  async getByInitiative(initiativeId: string): Promise<InitiativeInstrument[]> {
    const { data, error } = await this.supabase
      .from("initiative_instruments")
      .select("*, instrument_types(id, name, slug, requires_signatures)")
      .eq("initiative_id", initiativeId)
      .order("created_at", { ascending: true });

    if (error) {
      if (this.isMissingRelationshipError(error)) {
        const fallback = await this.supabase
          .from("initiative_instruments")
          .select("*")
          .eq("initiative_id", initiativeId)
          .order("created_at", { ascending: true });
        if (fallback.error) throw fallback.error;
        return (fallback.data ?? []) as InitiativeInstrument[];
      }
      throw error;
    }
    const rows = (data ?? []) as (Record<string, unknown>)[];
    return rows.map((r) => ({
      ...r,
      instrument_type: r.instrument_types ?? null,
    })) as InitiativeInstrument[];
  }

  async updateStatus(
    instrumentId: string,
    status: InstrumentStatus
  ): Promise<InitiativeInstrument | null> {
    const { data, error } = await this.supabase
      .from("initiative_instruments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", instrumentId)
      .select()
      .single();

    if (error) throw error;
    return data as InitiativeInstrument;
  }

  async updateEstado(
    instrumentId: string,
    estado: InstrumentState
  ): Promise<InitiativeInstrument | null> {
    const { data, error } = await this.supabase
      .from("initiative_instruments")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("id", instrumentId)
      .select()
      .single();

    if (error) throw error;
    return data as InitiativeInstrument;
  }
}
