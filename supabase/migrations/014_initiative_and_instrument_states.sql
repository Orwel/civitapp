-- Estados de iniciativa e instrumentos (nuevos enums)

-- Estados de INICIATIVA
CREATE TYPE initiative_state AS ENUM (
  'BORRADOR',
  'ABIERTA',
  'EN_EJECUCION',
  'CON_INSTRUMENTOS_ACTIVOS',
  'EN_INCIDENCIA',
  'EN_ESPERA_DE_RESPUESTA',
  'LOGRADA',
  'CERRADA',
  'ARCHIVADA'
);

-- Subestados de iniciativa
CREATE TYPE initiative_substate AS ENUM (
  'SIN_INSTRUMENTOS',
  'CON_INSTRUMENTO_JUDICIAL_ACTIVO',
  'CON_RECOLECCION_DE_FIRMAS_EN_CURSO',
  'CON_AUDIENCIA_PROGRAMADA'
);

-- Estados de INSTRUMENTO (base + especiales por tipo)
CREATE TYPE instrument_state AS ENUM (
  -- Base genéricos
  'BORRADOR',
  'CONFIGURACION',
  'RECOLECCION',
  'RADICADO',
  'EN_TRAMITE',
  'EN_AUDIENCIA',
  'EN_DECISION',
  'FAVORABLE',
  'DESFAVORABLE',
  'ARCHIVADO',
  'CERRADO',
  -- Recolección de firmas
  'PENDIENTE_VALIDACION',
  'VALIDACION_REGISTRADURIA',
  'META_ALCANZADA',
  'META_NO_ALCANZADA',
  -- Acción judicial
  'ADMITIDA',
  'INADMITIDA',
  'EN_TRASLADO',
  'EN_PRUEBAS',
  'SENTENCIA',
  -- Derecho de petición
  'EN_TERMINO',
  'RESPONDIDO',
  'SILENCIO_ADMINISTRATIVO'
);

-- Estado de validación de una firma (para instrument_signatures)
CREATE TYPE signature_validation_status AS ENUM (
  'PENDIENTE',
  'VALIDACION_REGISTRADURIA',
  'VALIDADO',
  'RECHAZADO'
);

COMMENT ON TYPE initiative_state IS 'Estados posibles de la iniciativa.';
COMMENT ON TYPE initiative_substate IS 'Subestados opcionales de la iniciativa.';
COMMENT ON TYPE instrument_state IS 'Estados del instrumento (base y especiales según tipo).';
COMMENT ON TYPE signature_validation_status IS 'Estado de validación de una firma (ej. Registraduría).';
