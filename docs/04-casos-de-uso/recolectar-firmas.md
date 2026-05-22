# Recolectar y cerrar firmas

## Actor

Líder (publicar / cerrar); sistema (automático); firmantes (firmar).

## Reglas de cierre (`EN_FIRMA` → `FIRMADO`)

1. `signatures_count >= minimum_required`
2. `now() >= firma_deadline_at` (si definido)
3. Líder: "Cerrar recolección"

Primera condición cumplida gana. Firmas extra antes del plazo se conservan.

## Público

Contador visible sin autenticación vía vista `constitutional_actions_public`.
