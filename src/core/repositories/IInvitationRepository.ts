import type { Invitation, InvitationPreview } from "@/core/entities/Invitation";

export interface CreateInvitationInput {
  initiativeId: string;
  instrumentId?: string | null;
  signatureRequestId?: string | null;
  type: "JOIN" | "SIGN";
  email?: string | null;
}

export interface IInvitationRepository {
  create(input: CreateInvitationInput, createdBy: string): Promise<Invitation>;
  getPreviewByToken(token: string): Promise<InvitationPreview | null>;
  /** Canjea la invitación (RPC). Devuelve datos para redirigir. */
  redeem(token: string): Promise<RedeemResult>;
}

export interface RedeemResult {
  ok: boolean;
  error?: string;
  type?: "JOIN" | "SIGN";
  initiative_id?: string;
  instrument_id?: string | null;
  signature_request_id?: string | null;
}
