import type { Initiative } from "@/core/entities/Initiative";
import type { InitiativeSubtype } from "@/core/enums/InitiativeSubtype";

export interface CreateInitiativeInput {
  /** Tipo desde catálogo (recomendado). Si no se envía, se puede usar subtype por compatibilidad. */
  initiative_type_id?: string | null;
  /** @deprecated Usar initiative_type_id */
  subtype?: InitiativeSubtype;
  title: string;
  summary?: string;
  descripcion?: string | null;
  meta?: string | null;
  fecha_inicio?: string | null;
  created_by: string;
  visibility?: "PUBLIC" | "PRIVATE";
  legal_metadata?: Record<string, unknown>;
}

export interface IInitiativeRepository {
  create(data: CreateInitiativeInput): Promise<Initiative>;
  getById(id: string): Promise<Initiative | null>;
  getByIdWithType(id: string): Promise<Initiative | null>;
  getByUser(userId: string): Promise<Initiative[]>;
  update(
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
  ): Promise<Initiative | null>;
}
