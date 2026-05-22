import type { SignatureRequestStatus } from "@/core/enums/Roles";

export interface InstrumentSignatureRequest {
  id: string;
  instrument_id: string;
  initiative_id: string;
  created_by: string;
  status: SignatureRequestStatus;
  target_count: number | null;
  created_at: string;
  closed_at: string | null;
}

export interface InstrumentSignature {
  id: string;
  signature_request_id: string;
  instrument_id: string;
  signer_user_id: string;
  signed_at: string;
  evidence: Record<string, unknown>;
}
