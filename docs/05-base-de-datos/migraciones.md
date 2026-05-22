# Migraciones SQL

Ubicación: `supabase/migrations/`. Convención: prefijo numérico `NNN_descripcion.sql`. Aplicar en orden en entornos nuevos.

## Lista actual (resumen)

| Archivo | Contenido principal |
|---------|----------------------|
| `001_enums.sql` | Tipos ENUM base (iniciativa, instrumento, roles, visibilidad, firmas, oficina, verificación). |
| `002_profiles.sql` | `profiles`, `user_roles`, `political_profiles`, trigger `handle_new_user`. |
| `003_initiatives.sql` | `initiatives`, `initiative_members`, `initiative_leaders`. |
| `004_instruments.sql` | `instrument_catalog`, `initiative_instruments`, `instrument_leaders`. |
| `005_chat_events.sql` | Hilos, mensajes de chat, `initiative_events`. |
| `006_attachments.sql` | `initiative_attachments`. |
| `007_signatures.sql` | Solicitudes y firmas. |
| `008_rls.sql` | RLS y helpers `is_admin`, `is_initiative_member`. |
| `009_storage_bucket.sql` | Bucket `attachements_iniciatives` y políticas storage. |
| `010_profiles_same_initiative.sql` | Política SELECT perfiles misma iniciativa. |
| `011_meetups.sql` | Meetups, asistencia, RLS. |
| `012_instruments_custom_title.sql` | `catalog_id` nullable, `custom_title`. |
| `013_initiative_and_instrument_catalog.sql` | Tablas y seed de tipos de iniciativa e instrumentos. |
| `014_initiative_and_instrument_states.sql` | ENUMs `initiative_state`, `initiative_substate`, `instrument_state`, `signature_validation_status`. |
| `015_initiatives_new_structure.sql` | Columnas nuevas en `initiatives` + migración de datos. |
| `016_instruments_new_structure.sql` | Columnas nuevas en `initiative_instruments` + migración. |
| `017_signatures_validation_status.sql` | Columna validación en firmas. |
| `018_rls_catalog_tables.sql` | RLS lectura pública en catálogos nuevos. |
| `019_initiatives_subtype_nullable.sql` | `initiatives.subtype` nullable. |
| `019_invitations_and_join_public.sql` | Política auto-unión pública, tabla `invitations`, RPC preview/redeem. |
| `020_initiative_members_insert_creator.sql` | Ajuste política INSERT miembros (creador). |
| `021_add_initiative_member_rpc.sql` | Función `add_initiative_member` (SECURITY DEFINER). |
| `022_constitutional_actions_big_bang.sql` | **Pivot**: drop modelo iniciativa/instrumento; tablas `constitutional_actions`, firmas, roles, chat/eventos/meetups por acción; vista pública; RPC transiciones. |

## Colisión de prefijo `019_`

Hay **dos** archivos con prefijo `019_`. Las herramientas que ordenan alfabéticamente aplicarán primero `019_initiatives_subtype_nullable` y luego `019_invitations_and_join_public`. Comprueba en CI o despliegue que ese orden no rompe dependencias (hoy es coherente: invitaciones no depende del nullable de subtype).

**Recomendación técnica**: renumerar uno de los dos a `022_` o similar en un PR dedicado y actualizar este documento (ítem T1.2 en sprint tracker).

## README del proyecto

El `README.md` en la raíz menciona migraciones “001 a 018”; **el proyecto tiene migraciones hasta 021** y dos `019_`. Conviene alinear el README raíz cuando se toque de nuevo (no es bloqueante para la doc en `docs/`).

## Seeds adicionales

- `supabase/seed/instrument_catalog.sql`: datos legacy del catálogo de instrumentos si se usa entorno limpio sin depender solo del 013.
