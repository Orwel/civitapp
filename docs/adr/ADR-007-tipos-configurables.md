# ADR-007 — Tipos de acción configurables y firma simple verificada por correo

**Estado:** aceptado · octubre 2026 · migración `036_flexible_action_types.sql`

## Contexto

El catálogo solo tenía acciones judiciales y todo su comportamiento estaba en código: hitos en un ENUM de juzgado, firma dibujada obligatoria, sin plazos. El primer caso real (derecho de petición colectivo por basuras y ratas) necesita un trámite administrativo con plazo legal, firma de baja fricción y una escalera petición → queja → acción popular.

## Decisión

1. Los **7 estados** de la acción no cambian. Lo que varía por tipo vive en `action_types`:
   `category`, `response_business_days`, `default_close_rule`, `signature_level` (`SIMPLE` / `DRAWN` / `VERIFIED`), `signer_fields` (jsonb), `next_action_type_slug`.
2. **Hitos por tipo** en `action_type_milestones`; la acción guarda `milestone_code`. El ENUM `radicado_milestone` se conserva por compatibilidad y se sincroniza cuando el código coincide.
3. **Término en días hábiles** con `co_holidays` + `add_business_days()`. Al radicar se fija `response_due_on` contando desde el día hábil siguiente a la fecha real de radicación. `src/lib/businessDays.ts` es el mismo algoritmo para la UI (el seed SQL se genera desde ahí).
4. **Firma simple verificada por correo**: el visitante llena sus datos y autoriza el tratamiento (casilla desmarcada, versión guardada en la firma); Supabase envía un código de un solo uso (`signInWithOtp`), al verificarlo se crea la cuenta sin contraseña y se registra la firma en el mismo paso.
5. **Documento definitivo inmutable**: al cerrar la recolección se genera el PDF (escrito + anexo + QR de verificación), se guarda en `{id}/final/firmado.pdf` y su SHA-256 en `final_document_sha256`. Tras radicar, la BD impide reemplazarlo.

## Evidencia por firma (defendibilidad)

Correo verificado por OTP (cuenta en `auth.users`), nombre y cédula (únicos por acción), fecha del servidor, hash del texto aceptado (`content_snapshot_sha256`), hash de la firma, versión del consentimiento, IP y user-agent (solo en BD, no en el PDF). La cédula no se valida contra Registraduría: es identificación simple, suficiente para un derecho de petición (Ley 1755 de 2015, art. 16).

## Consecuencias

- Agregar un tipo nuevo (p. ej. tutela colectiva, queja ante personería) es un INSERT, no código.
- Requiere configurar en Supabase la plantilla del correo con `{{ .Token }}` y un SMTP propio antes del lanzamiento.
