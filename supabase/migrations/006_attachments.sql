-- Adjuntos (bucket attachements_iniciatives)

CREATE TABLE initiative_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  instrument_id uuid REFERENCES initiative_instruments(id) ON DELETE SET NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  bucket text NOT NULL DEFAULT 'attachements_iniciatives',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  sha256 text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_initiative_attachments_initiative_id ON initiative_attachments(initiative_id);
CREATE INDEX idx_initiative_attachments_instrument_id ON initiative_attachments(instrument_id);
CREATE INDEX idx_initiative_attachments_uploaded_by ON initiative_attachments(uploaded_by);

-- Bucket se crea vía Supabase Dashboard o API; política de storage por RLS en 008
