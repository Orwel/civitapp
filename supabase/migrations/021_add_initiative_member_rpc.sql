-- Insertar en initiative_members vía RPC para evitar RLS en el primer miembro (creador).
-- La función comprueba: (1) te añades tú y eres el creador, o (2) ya eres miembro/admin.
CREATE OR REPLACE FUNCTION add_initiative_member(
  p_initiative_id uuid,
  p_user_id uuid,
  p_role text DEFAULT 'MEMBER'
)
RETURNS SETOF initiative_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created_by uuid;
BEGIN
  -- Solo el creador puede añadirse a sí mismo; miembros/admin pueden añadir a otros.
  IF p_user_id = auth.uid() THEN
    SELECT created_by INTO v_created_by FROM initiatives WHERE id = p_initiative_id;
    IF v_created_by IS DISTINCT FROM auth.uid() AND NOT is_admin() THEN
      RAISE EXCEPTION 'Solo el creador de la iniciativa puede añadirse como miembro';
    END IF;
  ELSE
    IF NOT is_initiative_member(p_initiative_id) AND NOT is_admin() THEN
      RAISE EXCEPTION 'No tienes permiso para añadir miembros a esta iniciativa';
    END IF;
  END IF;

  RETURN QUERY
  INSERT INTO initiative_members (initiative_id, user_id, role_in_initiative, member_status)
  VALUES (p_initiative_id, p_user_id, p_role::role_in_initiative, 'ACTIVE')
  RETURNING *;
END;
$$;

-- Permitir ejecución a usuarios autenticados (anon con JWT también)
GRANT EXECUTE ON FUNCTION add_initiative_member(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_initiative_member(uuid, uuid, text) TO anon;
