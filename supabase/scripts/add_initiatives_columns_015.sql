-- Añade las columnas de la migración 015 a initiatives (si no existen).
-- Ejecutar en el SQL Editor de Supabase. Requiere: tabla initiative_types y enums initiative_state, initiative_substate.

-- Tipo de iniciativa (FK a catálogo)
ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS initiative_type_id uuid REFERENCES initiative_types(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_initiatives_initiative_type_id ON initiatives(initiative_type_id);

-- Estado y subestado
ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS estado initiative_state NOT NULL DEFAULT 'BORRADOR';
ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS subestado initiative_substate;

-- Descripción, meta y fecha de inicio
ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS meta text;
ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS fecha_inicio date;

-- Migrar datos existentes (solo si hay filas)
UPDATE initiatives SET descripcion = summary WHERE summary IS NOT NULL AND descripcion IS NULL;
UPDATE initiatives SET estado = CASE
  WHEN status::text IN ('BORRADOR', 'PAUSADA') THEN 'BORRADOR'::initiative_state
  WHEN status::text IN ('EN_CONSTRUCCION', 'LISTA_PARA_FIRMAS', 'LISTA_PARA_RADICAR') THEN 'ABIERTA'::initiative_state
  WHEN status::text IN ('RADICADA', 'EN_TRAMITE') THEN 'EN_EJECUCION'::initiative_state
  WHEN status::text = 'EN_RESPUESTA' THEN 'EN_ESPERA_DE_RESPUESTA'::initiative_state
  WHEN status::text IN ('DECIDIDA', 'EN_CUMPLIMIENTO') THEN 'LOGRADA'::initiative_state
  WHEN status::text = 'CERRADA' THEN 'CERRADA'::initiative_state
  WHEN status::text = 'ARCHIVADA' THEN 'ARCHIVADA'::initiative_state
  ELSE estado
END;

COMMENT ON COLUMN initiatives.initiative_type_id IS 'Tipo de iniciativa desde catálogo';
COMMENT ON COLUMN initiatives.estado IS 'Estado principal de la iniciativa';
COMMENT ON COLUMN initiatives.subestado IS 'Subestado opcional';
COMMENT ON COLUMN initiatives.descripcion IS 'Descripción de la iniciativa';
COMMENT ON COLUMN initiatives.meta IS 'Meta u objetivo de la iniciativa';
COMMENT ON COLUMN initiatives.fecha_inicio IS 'Fecha de inicio de la iniciativa';
