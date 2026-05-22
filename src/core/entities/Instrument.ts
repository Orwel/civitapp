import type { InstrumentKind } from "@/core/enums/InstrumentKind";
import type { InstrumentStatus } from "@/core/enums/InstrumentStatus";
import type { InstrumentState } from "@/core/types/instrumentState";

/** Item del catálogo antiguo (instrument_catalog) - mantener por compatibilidad */
export interface InstrumentCatalogItem {
  id: string;
  initiative_subtype: string;
  kind: InstrumentKind;
  title: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
}

export interface InitiativeInstrument {
  id: string;
  initiative_id: string;
  catalog_id: string | null;
  /** Tipo desde catálogo nuevo (instrument_types) */
  instrument_type_id: string | null;
  custom_title: string | null;
  /** @deprecated Usar instrument_type_id + tipo (join) */
  kind?: InstrumentKind;
  /** @deprecated Usar estado */
  status?: InstrumentStatus;
  /** Estado del instrumento (nuevo modelo) */
  estado: InstrumentState;
  requiere_firmas: boolean;
  meta_firmas: number | null;
  fecha_radicacion: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  /** Tipo resuelto para UI (join) */
  instrument_type?: { id: string; name: string; slug: string; requires_signatures: boolean } | null;
}
