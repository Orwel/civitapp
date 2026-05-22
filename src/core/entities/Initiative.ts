import type { InitiativeStatus } from "@/core/enums/InitiativeStatus";
import type { InitiativeSubtype } from "@/core/enums/InitiativeSubtype";
import type { InitiativeVisibility } from "@/core/enums/Roles";
import type { InitiativeState, InitiativeSubstate } from "@/core/types/initiativeState";

export interface Initiative {
  id: string;
  /** @deprecated Usar initiative_type_id + tipo (join) */
  subtype?: InitiativeSubtype;
  /** Tipo de iniciativa desde catálogo (ambiental, social, denuncia, etc.) */
  initiative_type_id: string | null;
  title: string;
  summary: string | null;
  /** Descripción (nuevo modelo) */
  descripcion: string | null;
  /** Meta u objetivo de la iniciativa */
  meta: string | null;
  /** Fecha de inicio */
  fecha_inicio: string | null;
  /** @deprecated Usar estado */
  status?: InitiativeStatus;
  /** Estado principal (nuevo modelo) */
  estado: InitiativeState;
  /** Subestado opcional */
  subestado: InitiativeSubstate | null;
  created_by: string;
  visibility: InitiativeVisibility;
  legal_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  /** Tipo resuelto (join) para UI */
  initiative_type?: { id: string; name: string; slug: string } | null;
}

/** Iniciativa con tipo resuelto (nombre) para UI */
export interface InitiativeWithType extends Initiative {
  initiative_type?: { id: string; name: string; slug: string } | null;
}
