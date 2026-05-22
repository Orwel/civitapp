# ADR-001: Acción constitucional como agregado raíz

## Estado

Aceptado (2026-05).

## Contexto

El modelo iniciativa + instrumentos dispersaba el foco del producto.

## Decisión

- Agregado raíz: `constitutional_actions`.
- Eliminar `initiatives` y tablas asociadas en migración 022 (big bang, sin datos productivos).
- Chat, eventos, meetups y adjuntos cuelgan de `action_id`.

## Consecuencias

- Refactor amplio de rutas (`/dashboard/acciones`, `/acciones/[slug]`).
- Redirect temporal desde `/dashboard/initiatives/*`.
