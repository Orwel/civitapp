-- Firmas colectivas por instrumento

CREATE TABLE instrument_signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES initiative_instruments(id) ON DELETE CASCADE,
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  status signature_request_status NOT NULL DEFAULT 'OPEN',
  target_count int,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE INDEX idx_signature_requests_instrument_id ON instrument_signature_requests(instrument_id);
CREATE INDEX idx_signature_requests_initiative_id ON instrument_signature_requests(initiative_id);
CREATE INDEX idx_signature_requests_status ON instrument_signature_requests(status);

CREATE TABLE instrument_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_request_id uuid NOT NULL REFERENCES instrument_signature_requests(id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES initiative_instruments(id) ON DELETE CASCADE,
  signer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signed_at timestamptz NOT NULL DEFAULT now(),
  evidence jsonb DEFAULT '{}',
  UNIQUE (signature_request_id, signer_user_id)
);

CREATE INDEX idx_instrument_signatures_request_id ON instrument_signatures(signature_request_id);
CREATE INDEX idx_instrument_signatures_signer ON instrument_signatures(signer_user_id);
