-- Instrumentos: tipo desde catálogo, estado nuevo, requiere_firmas, meta_firmas, fecha_radicacion

-- Tipo de instrumento (FK a catálogo)
ALTER TABLE initiative_instruments
  ADD COLUMN instrument_type_id uuid REFERENCES instrument_types(id) ON DELETE SET NULL;

CREATE INDEX idx_initiative_instruments_instrument_type_id ON initiative_instruments(instrument_type_id);

-- Estado nuevo del instrumento
ALTER TABLE initiative_instruments
  ADD COLUMN estado instrument_state NOT NULL DEFAULT 'BORRADOR';

-- Firmas y radicación
ALTER TABLE initiative_instruments
  ADD COLUMN requiere_firmas boolean NOT NULL DEFAULT false;

ALTER TABLE initiative_instruments
  ADD COLUMN meta_firmas int;

ALTER TABLE initiative_instruments
  ADD COLUMN fecha_radicacion date;

-- Migrar status antiguo a estado (mapeo aproximado)
UPDATE initiative_instruments SET estado = CASE
  WHEN status IN ('NO_INICIADO') THEN 'BORRADOR'::instrument_state
  WHEN status = 'EN_PREPARACION' THEN 'CONFIGURACION'::instrument_state
  WHEN status IN ('LISTO_PARA_FIRMAR', 'EN_FIRMA') THEN 'RECOLECCION'::instrument_state
  WHEN status IN ('LISTO_PARA_EJECUTAR', 'EJECUTADO') THEN 'RADICADO'::instrument_state
  WHEN status = 'EN_RESPUESTA' THEN 'EN_TRAMITE'::instrument_state
  WHEN status = 'COMPLETADO' THEN 'CERRADO'::instrument_state
  WHEN status IN ('BLOQUEADO', 'CANCELADO') THEN 'ARCHIVADO'::instrument_state
  ELSE estado
END;

COMMENT ON COLUMN initiative_instruments.instrument_type_id IS 'Tipo de instrumento desde catálogo (administrativo, judicial, participativo, etc.).';
COMMENT ON COLUMN initiative_instruments.estado IS 'Estado del instrumento (base o especial según tipo).';
COMMENT ON COLUMN initiative_instruments.requiere_firmas IS 'Si este instrumento requiere recolección de firmas.';
COMMENT ON COLUMN initiative_instruments.meta_firmas IS 'Meta de firmas cuando requiere_firmas es true.';
COMMENT ON COLUMN initiative_instruments.fecha_radicacion IS 'Fecha de radicación ante la entidad.';
