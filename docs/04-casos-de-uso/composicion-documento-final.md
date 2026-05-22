# Composición del documento final (PDF)

## Cuándo

Al radicar (`FIRMADO` → `RADICADO`) o justo antes en preview.

## Entrada

- Base: HTML renderizado, o PDF subido.
- Firmas: `constitutional_action_signatures` ordenadas por `signed_at`.

## Salida

- PDF único en Storage.
- `final_document_sha256` en la acción.
- Inmutable tras radicación.

## Contenido por firma

Nombre, cédula, imagen de firma, fecha/hora UTC, sin solapamiento de bloques.

Ver [ADR-006](../adr/ADR-006-composicion-pdf.md).
