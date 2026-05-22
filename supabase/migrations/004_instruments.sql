-- Catálogo de instrumentos (seed) e instrumentos por iniciativa

CREATE TABLE instrument_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_subtype initiative_subtype NOT NULL,
  kind instrument_kind NOT NULL,
  title text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_instrument_catalog_subtype ON instrument_catalog(initiative_subtype);

-- Instrumentos instanciados por iniciativa
CREATE TABLE initiative_instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  catalog_id uuid NOT NULL REFERENCES instrument_catalog(id),
  kind instrument_kind NOT NULL,
  status instrument_status NOT NULL DEFAULT 'NO_INICIADO',
  payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_initiative_instruments_initiative_id ON initiative_instruments(initiative_id);
CREATE INDEX idx_initiative_instruments_catalog_id ON initiative_instruments(catalog_id);
CREATE INDEX idx_initiative_instruments_status ON initiative_instruments(status);

-- Líderes por instrumento
CREATE TABLE instrument_leaders (
  instrument_id uuid NOT NULL REFERENCES initiative_instruments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (instrument_id, user_id)
);

CREATE INDEX idx_instrument_leaders_instrument_id ON instrument_leaders(instrument_id);
