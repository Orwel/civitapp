-- Permitir instrumentos sin catálogo (creados manualmente) y título custom
ALTER TABLE initiative_instruments
  ALTER COLUMN catalog_id DROP NOT NULL;

ALTER TABLE initiative_instruments
  ADD COLUMN IF NOT EXISTS custom_title text;

COMMENT ON COLUMN initiative_instruments.custom_title IS 'Título cuando el instrumento no viene del catálogo (catalog_id NULL).';
