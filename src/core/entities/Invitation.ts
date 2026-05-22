/** Tipo de invitación: unirse a la iniciativa o firmar un instrumento */
export type InvitationType = "JOIN" | "SIGN";

export interface Invitation {
  id: string;
  initiative_id: string;
  instrument_id: string | null;
  signature_request_id: string | null;
  type: InvitationType;
  email: string | null;
  token: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
}

/** Vista previa pública de una invitación (por token) */
export interface InvitationPreview {
  initiative_id: string;
  initiative_title: string;
  type: InvitationType;
  instrument_id: string | null;
  signature_request_id: string | null;
  expires_at: string;
  valid: boolean;
}
