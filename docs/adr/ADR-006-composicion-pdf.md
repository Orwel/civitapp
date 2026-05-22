# ADR-006: Composición del PDF al radicar

## Estado

Aceptado (2026-05).

## Decisión

- Al pasar a `RADICADO`, generar PDF inmutable: documento base + páginas de firmas (nombre, cédula, imagen, timestamp) sin traslapes.
- Librería: `pdf-lib` en Server Action (MVP).
- Guardar en Storage; hash en `final_document_sha256`.

## Consecuencias

- Fase 5 del sprint; no bloquea rutas públicas ni firmas.
