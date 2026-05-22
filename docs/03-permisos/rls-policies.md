# RLS y políticas (Supabase / Postgres)

## Objetivo

**Row Level Security** filtra qué filas puede leer o escribir cada petición autenticada a PostgREST. Así, aunque el cliente use la `anon` key con JWT de usuario, no ve datos de iniciativas o instrumentos a los que no pertenece (salvo excepciones documentadas: catálogos públicos, iniciativas públicas en SELECT, etc.).

## Funciones auxiliares (SECURITY DEFINER)

Definidas en `008_rls.sql` (y reutilizadas después):

| Función | Comportamiento |
|---------|----------------|
| `is_admin()` | `true` si existe fila en `user_roles` con `role = 'ADMIN'` para `auth.uid()`. |
| `is_initiative_member(init_id uuid)` | `true` si existe miembro **ACTIVE** en `initiative_members` para esa iniciativa y `auth.uid()`. |

Están marcadas `STABLE` / `SECURITY DEFINER` para poder usarlas en políticas sin recursión incorrecta.

## Patrones por tabla (resumen)

- **profiles**: propio usuario actualiza; admin todo; lectura ampliada a perfiles de **la misma iniciativa** (`010_profiles_same_initiative.sql`).
- **user_roles**, **political_profiles**: usuario ve lo suyo; admin todo.
- **initiatives**: SELECT si `visibility = 'PUBLIC'` **o** miembro activo **o** admin; INSERT si `created_by = auth.uid()`; UPDATE/DELETE si miembro o admin (revisar migraciones posteriores si se afinó).
- **initiative_members**: SELECT/UPDATE si miembro o admin; INSERT ampliado para creador, miembros, admin y **auto-insert en públicas** (`019`, `020`); RPC `add_initiative_member` para casos bordes.
- **initiative_leaders**, **initiative_instruments**, **instrument_leaders**, **chat**, **events**, **attachments**, **signature_requests**, **signatures**: en general lectura/escritura si miembro activo de la iniciativa relacionada (o condiciones extra en firmas: `signer_user_id = auth.uid()`, request `OPEN`).
- **instrument_catalog**: SELECT público (`true`).
- **initiative_types**, **instrument_categories**, **instrument_types**: SELECT público (`018_rls_catalog_tables.sql`).
- **initiative_meetups** y asistencia: miembros; inserción de asistencia con `user_id = auth.uid()` y pertenencia al meetup (`011_meetups.sql`).
- **invitations**: SELECT/INSERT/UPDATE según miembro; preview y canje vía RPC **SECURITY DEFINER** (`019_invitations_and_join_public.sql`).

## Storage

Políticas en `009_storage_bucket.sql` sobre `storage.objects` para el bucket `attachements_iniciatives`: path esperado con `initiative_id` en segmento para comprobar membresía (y admin por `user_roles`).

## Importante para desarrolladores

1. **Cualquier consulta nueva** debe considerar si la tabla tiene RLS y si el rol `authenticated` tiene políticas adecuadas.
2. Las **Server Actions** usan el usuario de la sesión; si algo falla con “permission denied”, revisar políticas y si hace falta una **RPC SECURITY DEFINER** (como invitaciones o `add_initiative_member`).
3. Una **matriz detallada** acción × rol × recurso para producto está planificada en Oleada 2 (`matriz-permisos.md`).

## Referencias

- Migración base: `supabase/migrations/008_rls.sql`.
- Añadidos: `010`, `011`, `018`, `019`, `020`, `021`.
