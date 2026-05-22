# RPC y funciones SQL relevantes

Funciones en esquema `public` llamadas desde la aplicación Next/Supabase client. Comprobar permisos `GRANT` en cada migración.

## `redeem_invitation(p_token uuid)` → `jsonb`

- **Migración**: `019_invitations_and_join_public.sql`.
- **Seguridad**: `SECURITY DEFINER`, `search_path = public`.
- **Comportamiento**: Busca invitación válida (`used_at` nulo, `expires_at` > now). Si el usuario no es miembro ACTIVE, inserta en `initiative_members` como MEMBER. Marca la invitación usada. Devuelve JSON con `ok`, `type` (JOIN | SIGN), ids de iniciativa/instrumento/solicitud según corresponda.

## `get_invitation_preview(p_token uuid)` → `jsonb`

- **Migración**: `019_invitations_and_join_public.sql`.
- **Seguridad**: `SECURITY DEFINER`, `STABLE`.
- **Comportamiento**: Datos públicos para la página `/invite/[token]` (título de iniciativa, tipo, expiración, `valid`).

## `add_initiative_member(p_initiative_id uuid, p_user_id uuid, p_role text)` → `SETOF initiative_members`

- **Migración**: `021_add_initiative_member_rpc.sql`.
- **Seguridad**: `SECURITY DEFINER`.
- **Comportamiento**: Valida que quien se añade a sí mismo sea el `created_by` de la iniciativa (o admin); si añade a otro, exige miembro activo o admin. Inserta fila ACTIVE. Existe `GRANT EXECUTE` a `authenticated` y `anon` (revisar si `anon` es intencional para vuestro modelo de amenazas).

## Trigger `handle_new_user`

- **Migración**: `002_profiles.sql`.
- **Evento**: `AFTER INSERT ON auth.users`.
- **Efecto**: Crea fila en `profiles` y asigna rol global `USER`.

## Funciones helper (no RPC de negocio directo)

- `is_admin()`, `is_initiative_member(uuid)`: usadas en políticas RLS (`008_rls.sql`).

## Cómo invocarlas desde TypeScript

Típicamente:

```ts
const { data, error } = await supabase.rpc("redeem_invitation", { p_token: token });
```

Los repositorios en `src/infrastructure/repositories/` encapsulan las llamadas concretas (p. ej. `SupabaseInvitationRepository`).
