# Verificación de identidad (ADMIN)

## Flujo

1. Usuario completa identidad al firmar → `PENDING`.
2. ADMIN revisa en `/admin/identity-verifications`.
3. Aprueba → `APPROVED`; rechaza → `REJECTED` (firmas existentes permanecen, flag en firma).

## No bloquea

Firmar con `PENDING` está permitido (ADR-004).
