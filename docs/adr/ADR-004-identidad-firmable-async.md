# ADR-004: Identidad firmable al firmar, validación async

## Estado

Aceptado (2026-05).

## Decisión

- Registro inicial: email, nombre, contraseña (ligero).
- Al **primer intento de firmar**: captura cédula, fotos, firma en canvas.
- `identity_verification_status = PENDING`; ADMIN aprueba después.
- El usuario puede firmar con `PENDING`; si se rechaza, la firma queda marcada pero no se borra.

## Consecuencias

- Columnas nuevas en `profiles` + bucket Storage privado.
- Panel `/admin/identity-verifications`.
