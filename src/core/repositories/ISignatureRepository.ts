import type { InstrumentSignatureRequest, InstrumentSignature } from "@/core/entities/Signature";

export interface ISignatureRepository {
  createRequest(instrumentId: string, initiativeId: string, createdBy: string, targetCount?: number): Promise<InstrumentSignatureRequest>;
  getRequestsByInstrument(instrumentId: string): Promise<InstrumentSignatureRequest[]>;
  getRequestsByInitiative(initiativeId: string): Promise<InstrumentSignatureRequest[]>;
  addSignature(requestId: string, instrumentId: string, signerUserId: string, evidence?: Record<string, unknown>): Promise<InstrumentSignature>;
  getSignaturesByRequest(requestId: string): Promise<InstrumentSignature[]>;
}
