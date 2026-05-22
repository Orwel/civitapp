# Estados y transiciones de la acción constitucional

## Estados principales (7)

| Estado | Descripción |
|--------|-------------|
| `EN_CREACION` | Borrador editable. |
| `EN_FIRMA` | Recolección de firmas de respaldo; documento congelado. |
| `FIRMADO` | Cerrada la recolección; el líder debe radicar. |
| `RADICADO` | Radicada ante la entidad; avanza por hitos. |
| `APELADO` | Recurso de apelación en curso. |
| `EN_ESPERA_DE_OTRO_PROCESO` | Pausa por trámite previo o paralelo. |
| `FINALIZADO` | Terminal. |

## Hitos en `RADICADO` (`radicado_milestone`)

`RECIBIDA`, `ADMITIDA`, `INADMITIDA`, `EN_TRASLADO`, `EN_PRUEBAS`, `EN_AUDIENCIA`, `EN_DECISION`, `SENTENCIA`.

## Resultado en `FINALIZADO` (`finalizado_result`)

`FAVORABLE`, `PARCIALMENTE_FAVORABLE`, `DESFAVORABLE`, `IMPROCEDENTE`, `DESISTIDA`, `ARCHIVADA_SIN_DECISION`.

## Transiciones

| Desde | Hacia | Actor | Disparador |
|-------|--------|--------|------------|
| `EN_CREACION` | `EN_FIRMA` | Líder | Publicar |
| `EN_CREACION` | `EN_FIRMA` | Sistema | `publicacion_programada_at` alcanzado |
| `EN_FIRMA` | `FIRMADO` | Sistema | `signatures_count >= minimum_required` |
| `EN_FIRMA` | `FIRMADO` | Sistema | `now() >= firma_deadline_at` |
| `EN_FIRMA` | `FIRMADO` | Líder | Cerrar recolección |
| `FIRMADO` | `RADICADO` | Líder | Radicación + PDF final |
| `RADICADO` | *(hito)* | Líder | Actualizar `radicado_milestone` |
| `RADICADO` | `APELADO` | Líder | — |
| `RADICADO` | `EN_ESPERA_DE_OTRO_PROCESO` | Líder | — |
| `RADICADO` | `FINALIZADO` | Líder | + `finalizado_result` |
| `APELADO` | `RADICADO` | Líder | Reanudar |
| `APELADO` | `FINALIZADO` | Líder | + `finalizado_result` |
| `EN_ESPERA_DE_OTRO_PROCESO` | `RADICADO` | Líder | Reanudar |
| `EN_ESPERA_DE_OTRO_PROCESO` | `FINALIZADO` | Líder | + `finalizado_result` |

Cada transición se registra en `constitutional_action_state_transitions` con `trigger_type`: `MANUAL`, `SCHEDULED`, `SIGNATURE_COUNT`, `DEADLINE`.

## Función SQL

`evaluate_action_transitions(action_id)` evalúa transiciones automáticas; se invoca tras insertar firma y vía cron para fechas programadas.
