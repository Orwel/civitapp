# Esquema de base de datos (resumen)

Fuente de verdad: `supabase/migrations/`. Post-022 el modelo de iniciativas/instrumentos legacy fue eliminado.

## `constitutional_actions`

- `id`, `slug` (único), `action_type_id`, `title`, `summary`
- Contenido: `content_mode`, `content_template_id`, `content_data`, `content_body`, `content_pdf_storage_path`
- Estado: `state`, `radicado_milestone`, `finalizado_result`
- Firmas: `minimum_required`, `target_count`, `firma_deadline_at`, `firma_opened_at`
- Publicación: `publicacion_mode`, `publicacion_programada_at`
- Radicación: `radicado_at`, `radicado_number`, `radicado_entity_name`, `final_document_storage_path`, `final_document_sha256`
- `visibility`, `created_by`, timestamps

## `constitutional_action_signatures`

- `action_id`, `signer_user_id`, `signed_at`
- Snapshot: `snapshot_full_name`, `snapshot_cedula`, `snapshot_signature_storage_path`
- `identity_verified_at_sign` (estado del perfil al firmar)

## `profiles` (ampliado)

- `cedula`, paths Storage cédula/selfie/firma
- `identity_verification_status`, `identity_verified_at`, `identity_verified_by`

## Vista pública

`constitutional_actions_public` — sin PII de firmantes; incluye `signatures_count`.

## Funciones

- `evaluate_action_transitions(uuid)`
- `transition_action_state(...)` (RPC manual líder)

Ver migración `022_constitutional_actions_big_bang.sql`.
