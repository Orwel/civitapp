# Radicación

## Actor

Líder.

## Precondiciones

- `state = FIRMADO`
- PDF compuesto generado o en generación

## Flujo

1. Revisa documento final con todas las firmas.
2. Ingresa entidad, número y fecha de radicado.
3. Transición a `RADICADO`, `radicado_milestone = RECIBIDA`.
4. Actualiza hitos según avance del proceso.

## Responsabilidad

El líder dirige el buen término; la app documenta y alerta, no sustituye al abogado.
