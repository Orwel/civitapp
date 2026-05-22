-- Firmas: estado de validación (ej. Registraduría)

ALTER TABLE instrument_signatures
  ADD COLUMN estado_validacion signature_validation_status NOT NULL DEFAULT 'PENDIENTE';

COMMENT ON COLUMN instrument_signatures.estado_validacion IS 'Estado de validación de la firma: PENDIENTE, VALIDACION_REGISTRADURIA, VALIDADO, RECHAZADO.';
