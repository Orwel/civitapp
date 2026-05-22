# ADR-003: Firmar equivale a membresía

## Estado

Aceptado (2026-05).

## Decisión

- No existe `action_members` separado.
- `constitutional_action_signatures` otorga acceso a chat, bitácora y meetups.
- RLS: firmante o rol en `constitutional_action_roles` puede leer/escribir comunidad.

## Consecuencias

- Invitación a firmar = URL pública `/acciones/[slug]`.
- Drop de `initiative_members` y flujo JOIN por invitación (salvo invitar co-líderes por email, opcional).
