import type { InstrumentCatalogItem, InitiativeInstrument } from "@/core/entities/Instrument";
import type { InitiativeSubtype } from "@/core/enums/InitiativeSubtype";
import type { InstrumentStatus } from "@/core/enums/InstrumentStatus";
import type { InstrumentState } from "@/core/types/instrumentState";

export interface IInstrumentRepository {
  getCatalogBySubtype(subtype: InitiativeSubtype): Promise<InstrumentCatalogItem[]>;
  createFromCatalog(initiativeId: string, catalogId: string, kind: string): Promise<InitiativeInstrument>;
  /** Añade un instrumento desde el catálogo de tipos (instrument_types). */
  createByInstrumentType(
    initiativeId: string,
    instrumentTypeId: string,
    options?: { requiresSignatures?: boolean; metaFirmas?: number | null }
  ): Promise<InitiativeInstrument>;
  createCustom(
    initiativeId: string,
    kind: string,
    customTitle?: string | null
  ): Promise<InitiativeInstrument>;
  getByInitiative(initiativeId: string): Promise<InitiativeInstrument[]>;
  updateStatus(instrumentId: string, status: InstrumentStatus): Promise<InitiativeInstrument | null>;
  updateEstado(instrumentId: string, estado: InstrumentState): Promise<InitiativeInstrument | null>;
}
