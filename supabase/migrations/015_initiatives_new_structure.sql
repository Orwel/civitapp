-- Iniciativas: tipo desde catálogo, estado/subestado nuevos, descripción, meta, fecha_inicio

-- Tipo de iniciativa (FK a catálogo)
ALTER TABLE initiatives
  ADD COLUMN initiative_type_id uuid REFERENCES initiative_types(id) ON DELETE SET NULL;

CREATE INDEX idx_initiatives_initiative_type_id ON initiatives(initiative_type_id);

-- Estado y subestado nuevos
ALTER TABLE initiatives
  ADD COLUMN estado initiative_state NOT NULL DEFAULT 'BORRADOR';

ALTER TABLE initiatives
  ADD COLUMN subestado initiative_substate;

-- Descripción (complementa o reemplaza summary según uso), meta y fecha de inicio
ALTER TABLE initiatives
  ADD COLUMN descripcion text;

ALTER TABLE initiatives
  ADD COLUMN meta text;

ALTER TABLE initiatives
  ADD COLUMN fecha_inicio date;

-- Migrar datos existentes: copiar summary a descripcion si existe
UPDATE initiatives SET descripcion = summary WHERE summary IS NOT NULL AND descripcion IS NULL;

-- Migrar status antiguo a estado (mapeo aproximado)
UPDATE initiatives SET estado = CASE
  WHEN status IN ('BORRADOR', 'PAUSADA') THEN 'BORRADOR'::initiative_state
  WHEN status IN ('EN_CONSTRUCCION', 'LISTA_PARA_FIRMAS', 'LISTA_PARA_RADICAR') THEN 'ABIERTA'::initiative_state
  WHEN status IN ('RADICADA', 'EN_TRAMITE') THEN 'EN_EJECUCION'::initiative_state
  WHEN status = 'EN_RESPUESTA' THEN 'EN_ESPERA_DE_RESPUESTA'::initiative_state
  WHEN status IN ('DECIDIDA', 'EN_CUMPLIMIENTO') THEN 'LOGRADA'::initiative_state
  WHEN status = 'CERRADA' THEN 'CERRADA'::initiative_state
  WHEN status = 'ARCHIVADA' THEN 'ARCHIVADA'::initiative_state
  ELSE estado
END;

COMMENT ON COLUMN initiatives.initiative_type_id IS 'Tipo de iniciativa desde catálogo: ambiental, social, denuncia, obra pública, empresarial.';
COMMENT ON COLUMN initiatives.estado IS 'Estado principal de la iniciativa.';
COMMENT ON COLUMN initiatives.subestado IS 'Subestado opcional: sin instrumentos, con instrumento judicial activo, etc.';
COMMENT ON COLUMN initiatives.meta IS 'Meta u objetivo de la iniciativa.';
COMMENT ON COLUMN initiatives.fecha_inicio IS 'Fecha de inicio de la iniciativa.';
