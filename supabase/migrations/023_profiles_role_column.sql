-- Rol global como columna en profiles (un rol por usuario)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role role_global NOT NULL DEFAULT 'USER';

-- Migrar desde user_roles si existía (prioridad: ADMIN > POLITICAL_VERIFIED > USER)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    UPDATE public.profiles p
    SET role = sub.role
    FROM (
      SELECT
        user_id,
        CASE
          WHEN bool_or(role = 'ADMIN') THEN 'ADMIN'::role_global
          WHEN bool_or(role = 'POLITICAL_VERIFIED') THEN 'POLITICAL_VERIFIED'::role_global
          ELSE 'USER'::role_global
        END AS role
      FROM public.user_roles
      GROUP BY user_id
    ) sub
    WHERE p.id = sub.user_id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'USER')
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.protect_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role_change();

-- Perfiles sin fila (usuarios auth previos)
INSERT INTO public.profiles (id, full_name, role)
SELECT u.id, u.raw_user_meta_data->>'full_name', 'USER'::role_global
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Storage: esquema legacy (iniciativas) vs acciones constitucionales (post-022)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'initiative_members'
  ) THEN
    DROP POLICY IF EXISTS "attachments_read_members_or_admin" ON storage.objects;
    CREATE POLICY "attachments_read_members_or_admin"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'attachements_iniciatives'
      AND (
        EXISTS (
          SELECT 1 FROM public.initiative_members im
          WHERE im.initiative_id = (split_part(name, '/', 2))::uuid
            AND im.user_id = auth.uid()
            AND im.member_status = 'ACTIVE'
        )
        OR public.is_admin()
      )
    );
  ELSE
    -- Tras 022: quitar políticas del bucket legacy que referencian tablas eliminadas
    DROP POLICY IF EXISTS "attachments_read_members_or_admin" ON storage.objects;
    DROP POLICY IF EXISTS "attachments_upload_members" ON storage.objects;
  END IF;
END $$;

-- Eliminar tabla user_roles (rol único en profiles.role)
DROP TABLE IF EXISTS public.user_roles CASCADE;
