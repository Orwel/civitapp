# Migraciones Supabase — Civitapp

## Estado (aplicadas en el proyecto)

| Migración | Descripción | Estado |
|-----------|-------------|--------|
| 001–023 | Base legacy + acciones constitucionales + perfiles | Aplicada |
| 024_public_view_leaders | Vista pública con `leaders`, hashes; revoca SELECT anon en tabla | Aplicada |
| 025_collab_drafts_and_lock | Colaboración, lock de edición, RPCs | Aplicada |
| 026_action_revisions | Historial de revisiones del borrador | Aplicada |
| 027_pdf_documents | Bucket `action_documents`, `body_snapshot_sha256` | Aplicada |
| 028_signature_evidence_and_close_rules | Firmas con evidencia, `signature_close_rule` | Aplicada |
| 030_chat_enhancements | Reply-to, reacciones en chat | Aplicada |
| 031_meetups_validation | Modos presencial/online/híbrido en eventos | Aplicada |
| 032_profiles_onboarded | `profiles.onboarded_at` | Aplicada |
| 033_action_roles_insert_creator | RLS: creador puede insertar roles iniciales | Aplicada |
| 034_action_docs_storage_update | Storage: UPDATE PDF borrador (upsert) | Aplicada |
| 034_actions_idempotency | `client_request_id` + índice único por creador | Aplicada |
| 035_action_signature_storage | Storage: firmantes suben su imagen de firma | Aplicada |
| 036_flexible_action_types | Tipos configurables, hitos por tipo, días hábiles, firma simple con datos y autorización, Storage endurecido (corrige subida de firma de 035) | **Pendiente** |

Verificado contra el esquema remoto el 2026-10-14. Las migraciones se aplican a mano (SQL editor), por eso `supabase_migrations` está vacía.

Plantillas guiadas (v1) no requieren migración: usan `content_data.template` y el valor `TEMPLATE` del enum `action_content_mode` (022).

Si añades una migración nueva, súmala a esta tabla.
