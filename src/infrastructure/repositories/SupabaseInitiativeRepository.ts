import type { Initiative } from "@/core/entities/Initiative";
import type {
  IInitiativeRepository,
  CreateInitiativeInput,
} from "@/core/repositories/IInitiativeRepository";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseInitiativeRepository implements IInitiativeRepository {
  constructor(private supabase: SupabaseClient) {}

  private isMissingRelationshipError(err: unknown): boolean {
    const e = err as { code?: string; message?: string };
    return (
      e?.code === "PGRST200" ||
      (typeof e?.message === "string" &&
        e.message.includes("Could not find a relationship"))
    );
  }

  async create(data: CreateInitiativeInput): Promise<Initiative> {
    const insert: Record<string, unknown> = {
      title: data.title,
      summary: data.summary ?? null,
      created_by: data.created_by,
      visibility: data.visibility ?? "PUBLIC",
      legal_metadata: data.legal_metadata ?? {},
      estado: "BORRADOR",
      descripcion: data.descripcion ?? data.summary ?? null,
      meta: data.meta ?? null,
      fecha_inicio: data.fecha_inicio ?? null,
      initiative_type_id: data.initiative_type_id ?? null,
    };
    if (data.subtype != null) {
      insert.subtype = data.subtype;
    }

    const { data: row, error } = await this.supabase
      .from("initiatives")
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    return row as Initiative;
  }

  async getById(id: string): Promise<Initiative | null> {
    const { data, error } = await this.supabase
      .from("initiatives")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as Initiative;
  }

  async getByIdWithType(id: string): Promise<Initiative | null> {
    const { data, error } = await this.supabase
      .from("initiatives")
      .select("*, initiative_types(id, name, slug)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      if (this.isMissingRelationshipError(error)) {
        const fallback = await this.supabase
          .from("initiatives")
          .select("*")
          .eq("id", id)
          .single();
        if (fallback.error) {
          if (fallback.error.code === "PGRST116") return null;
          throw fallback.error;
        }
        return fallback.data as Initiative;
      }
      throw error;
    }
    const row = data as Record<string, unknown>;
    return {
      ...row,
      initiative_type: row.initiative_types ?? null,
    } as Initiative;
  }

  async getByUser(userId: string): Promise<Initiative[]> {
    const { data: members } = await this.supabase
      .from("initiative_members")
      .select("initiative_id")
      .eq("user_id", userId)
      .eq("member_status", "ACTIVE");

    if (!members?.length) return [];

    const ids = members.map((m) => m.initiative_id);
    const withType = await this.supabase
      .from("initiatives")
      .select("*, initiative_types(id, name, slug)")
      .in("id", ids)
      .order("updated_at", { ascending: false });

    if (withType.error) {
      if (this.isMissingRelationshipError(withType.error)) {
        const fallback = await this.supabase
          .from("initiatives")
          .select("*")
          .in("id", ids)
          .order("updated_at", { ascending: false });
        if (fallback.error) throw fallback.error;
        return (fallback.data ?? []) as Initiative[];
      }
      throw withType.error;
    }

    const rows = (withType.data ?? []) as (Record<string, unknown>)[];
    return rows.map((r) => ({
      ...r,
      initiative_type: r.initiative_types ?? null,
    })) as Initiative[];
  }

  async update(
    id: string,
    data: Partial<
      Pick<
        Initiative,
        | "title"
        | "summary"
        | "descripcion"
        | "meta"
        | "fecha_inicio"
        | "estado"
        | "subestado"
        | "initiative_type_id"
        | "status"
        | "visibility"
        | "legal_metadata"
      >
    >
  ): Promise<Initiative | null> {
    const { data: row, error } = await this.supabase
      .from("initiatives")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return row as Initiative;
  }
}
