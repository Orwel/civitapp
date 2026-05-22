-- Permitir unirse a iniciativas públicas y tabla de invitaciones

-- 1) Política: usuario puede agregarse como miembro si la iniciativa es pública
CREATE POLICY "initiative_members_insert_self_public" ON initiative_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM initiatives i
    WHERE i.id = initiative_id AND i.visibility = 'PUBLIC'
  )
);

-- 2) Tabla de invitaciones (unirse a iniciativa o firmar instrumento)
CREATE TYPE invitation_type AS ENUM ('JOIN', 'SIGN');

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  instrument_id uuid REFERENCES initiative_instruments(id) ON DELETE CASCADE,
  signature_request_id uuid REFERENCES instrument_signature_requests(id) ON DELETE CASCADE,
  type invitation_type NOT NULL DEFAULT 'JOIN',
  email text,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT invitations_sign_has_instrument CHECK (
    type <> 'SIGN' OR (instrument_id IS NOT NULL AND signature_request_id IS NOT NULL)
  )
);

CREATE INDEX idx_invitations_initiative_id ON invitations(initiative_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

COMMENT ON TABLE invitations IS 'Invitaciones por link o email: unirse a iniciativa o firmar instrumento.';
COMMENT ON COLUMN invitations.type IS 'JOIN = unirse a la iniciativa; SIGN = firmar el instrumento (requiere instrument_id y signature_request_id).';

-- 3) RLS para invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Ver invitaciones: miembros de la iniciativa o admin (para listar); lectura por token se hace vía RPC
CREATE POLICY "invitations_select" ON invitations FOR SELECT USING (
  is_initiative_member(initiative_id) OR is_admin()
);

-- Crear invitación: solo miembros de la iniciativa
CREATE POLICY "invitations_insert" ON invitations FOR INSERT WITH CHECK (
  is_initiative_member(initiative_id) AND created_by = auth.uid()
);

-- Actualizar (marcar usada): solo miembros o el propio uso vía RPC
CREATE POLICY "invitations_update" ON invitations FOR UPDATE USING (
  is_initiative_member(initiative_id) OR is_admin()
);

-- 4) Función para canjear invitación (lectura por token + join/firmar)
CREATE OR REPLACE FUNCTION redeem_invitation(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv invitations%ROWTYPE;
  init_visible boolean;
  already_member boolean;
BEGIN
  SELECT * INTO inv FROM invitations
  WHERE token = p_token AND used_at IS NULL AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invitation_not_found_or_expired');
  END IF;

  -- Unirse como miembro si no lo es
  SELECT EXISTS (
    SELECT 1 FROM initiative_members
    WHERE initiative_id = inv.initiative_id AND user_id = auth.uid() AND member_status = 'ACTIVE'
  ) INTO already_member;

  IF NOT already_member THEN
    INSERT INTO initiative_members (initiative_id, user_id, role_in_initiative, member_status)
    VALUES (inv.initiative_id, auth.uid(), 'MEMBER', 'ACTIVE');
  END IF;

  -- Marcar invitación como usada
  UPDATE invitations SET used_at = now(), used_by = auth.uid() WHERE id = inv.id;

  IF inv.type = 'SIGN' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'type', 'SIGN',
      'initiative_id', inv.initiative_id,
      'instrument_id', inv.instrument_id,
      'signature_request_id', inv.signature_request_id
    );
  ELSE
    RETURN jsonb_build_object(
      'ok', true,
      'type', 'JOIN',
      'initiative_id', inv.initiative_id
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION redeem_invitation(uuid) IS 'Canjea una invitación por token: une al usuario a la iniciativa y devuelve datos para redirigir (a iniciativa o a firmar).';

-- 5) Preview de invitación por token (público, para mostrar en /invite/[token])
CREATE OR REPLACE FUNCTION get_invitation_preview(p_token uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'initiative_id', i.id,
    'initiative_title', i.title,
    'type', inv.type,
    'instrument_id', inv.instrument_id,
    'signature_request_id', inv.signature_request_id,
    'expires_at', inv.expires_at,
    'valid', (inv.used_at IS NULL AND inv.expires_at > now())
  )
  FROM invitations inv
  JOIN initiatives i ON i.id = inv.initiative_id
  WHERE inv.token = p_token;
$$;

COMMENT ON FUNCTION get_invitation_preview(uuid) IS 'Devuelve datos públicos de una invitación por token para mostrar en la página de canje (sin auth).';
