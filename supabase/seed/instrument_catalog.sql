-- Seed: instrument_catalog para 4 subtypes MVP
-- DERECHO_PETICION, TUTELA, POPULAR, PROYECTO_NORMATIVO

-- Derecho de petición
INSERT INTO instrument_catalog (id, initiative_subtype, kind, title, order_index, is_required) VALUES
  (gen_random_uuid(), 'DERECHO_PETICION', 'DOC_PRINCIPAL', 'Documento principal de petición', 1, true),
  (gen_random_uuid(), 'DERECHO_PETICION', 'ANEXOS', 'Anexos y soportes', 2, false),
  (gen_random_uuid(), 'DERECHO_PETICION', 'FIRMAS', 'Firmas de respaldo', 3, false),
  (gen_random_uuid(), 'DERECHO_PETICION', 'RADICACION', 'Radicación ante entidad', 4, true),
  (gen_random_uuid(), 'DERECHO_PETICION', 'SEGUIMIENTO', 'Seguimiento y respuesta', 5, false);

-- Tutela
INSERT INTO instrument_catalog (id, initiative_subtype, kind, title, order_index, is_required) VALUES
  (gen_random_uuid(), 'TUTELA', 'DOC_PRINCIPAL', 'Escrito de tutela', 1, true),
  (gen_random_uuid(), 'TUTELA', 'ANEXOS', 'Pruebas y anexos', 2, false),
  (gen_random_uuid(), 'TUTELA', 'FIRMAS', 'Firmas (si aplica)', 3, false),
  (gen_random_uuid(), 'TUTELA', 'RADICACION', 'Radicación ante juez', 4, true),
  (gen_random_uuid(), 'TUTELA', 'SEGUIMIENTO', 'Seguimiento y fallo', 5, false),
  (gen_random_uuid(), 'TUTELA', 'IMPUGNACION', 'Impugnación', 6, false);

-- Acción popular
INSERT INTO instrument_catalog (id, initiative_subtype, kind, title, order_index, is_required) VALUES
  (gen_random_uuid(), 'POPULAR', 'DOC_PRINCIPAL', 'Demanda de acción popular', 1, true),
  (gen_random_uuid(), 'POPULAR', 'ANEXOS', 'Anexos y pruebas', 2, false),
  (gen_random_uuid(), 'POPULAR', 'FIRMAS', 'Apoyos ciudadanos', 3, false),
  (gen_random_uuid(), 'POPULAR', 'RADICACION', 'Radicación', 4, true),
  (gen_random_uuid(), 'POPULAR', 'SEGUIMIENTO', 'Seguimiento procesal', 5, false);

-- Proyecto normativo
INSERT INTO instrument_catalog (id, initiative_subtype, kind, title, order_index, is_required) VALUES
  (gen_random_uuid(), 'PROYECTO_NORMATIVO', 'DOC_PRINCIPAL', 'Texto del proyecto', 1, true),
  (gen_random_uuid(), 'PROYECTO_NORMATIVO', 'ANEXOS', 'Exposición de motivos y anexos', 2, false),
  (gen_random_uuid(), 'PROYECTO_NORMATIVO', 'FIRMAS', 'Firmas de respaldo', 3, false),
  (gen_random_uuid(), 'PROYECTO_NORMATIVO', 'RADICACION', 'Presentación ante corporación', 4, true),
  (gen_random_uuid(), 'PROYECTO_NORMATIVO', 'SEGUIMIENTO', 'Seguimiento en trámite', 5, false);
