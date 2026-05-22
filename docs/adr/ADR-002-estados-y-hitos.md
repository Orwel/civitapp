# ADR-002: Siete estados y hitos en RADICADO / FINALIZADO

## Estado

Aceptado (2026-05).

## Decisión

- `action_state` con 7 valores.
- Hitos judiciales en `radicado_milestone` (solo si `state = RADICADO`).
- Resultado en `finalizado_result` (obligatorio si `state = FINALIZADO`).
- Transiciones automáticas solo: publicación programada y cierre de firmas (count o deadline).

## Consecuencias

- Drop del enum `instrument_state` (23 valores).
- Auditoría en `constitutional_action_state_transitions`.
