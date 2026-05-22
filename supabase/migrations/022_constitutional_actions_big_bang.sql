-- Pivot: acciones constitucionales como agregado raíz (big bang, sin migración de datos)

-- ========== DROP LEGACY ==========
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS instrument_signatures CASCADE;
DROP TABLE IF EXISTS instrument_signature_requests CASCADE;
DROP TABLE IF EXISTS instrument_leaders CASCADE;
DROP TABLE IF EXISTS initiative_instruments CASCADE;
DROP TABLE IF EXISTS instrument_catalog CASCADE;
DROP TABLE IF EXISTS initiative_meetup_attendance CASCADE;
DROP TABLE IF EXISTS initiative_meetups CASCADE;
DROP TABLE IF EXISTS initiative_events CASCADE;
DROP TABLE IF EXISTS initiative_chat_messages CASCADE;
DROP TABLE IF EXISTS initiative_chat_threads CASCADE;
DROP TABLE IF EXISTS initiative_attachments CASCADE;
DROP TABLE IF EXISTS initiative_leaders CASCADE;
DROP TABLE IF EXISTS initiative_members CASCADE;
DROP TABLE IF EXISTS initiatives CASCADE;
DROP TABLE IF EXISTS initiative_types CASCADE;
DROP TABLE IF EXISTS instrument_types CASCADE;
DROP TABLE IF EXISTS instrument_categories CASCADE;

DROP FUNCTION IF EXISTS is_initiative_member(uuid);
DROP FUNCTION IF EXISTS add_initiative_member(uuid, uuid, role_in_initiative);
DROP FUNCTION IF EXISTS redeem_invitation(text);

DROP TYPE IF EXISTS initiative_state CASCADE;
DROP TYPE IF EXISTS initiative_substate CASCADE;
DROP TYPE IF EXISTS instrument_state CASCADE;
DROP TYPE IF EXISTS signature_validation_status CASCADE;
DROP TYPE IF EXISTS initiative_status CASCADE;
DROP TYPE IF EXISTS initiative_subtype CASCADE;
DROP TYPE IF EXISTS instrument_status CASCADE;
DROP TYPE IF EXISTS instrument_kind CASCADE;
DROP TYPE IF EXISTS role_in_initiative CASCADE;
DROP TYPE IF EXISTS member_status CASCADE;
DROP TYPE IF EXISTS leader_type CASCADE;
DROP TYPE IF EXISTS initiative_visibility CASCADE;
DROP TYPE IF EXISTS signature_request_status CASCADE;
DROP TYPE IF EXISTS invitation_type CASCADE;

-- ========== NEW ENUMS ==========
CREATE TYPE action_state AS ENUM (
  'EN_CREACION',
  'EN_FIRMA',
  'FIRMADO',
  'RADICADO',
  'APELADO',
  'EN_ESPERA_DE_OTRO_PROCESO',
  'FINALIZADO'
);

CREATE TYPE radicado_milestone AS ENUM (
  'RECIBIDA',
  'ADMITIDA',
  'INADMITIDA',
  'EN_TRASLADO',
  'EN_PRUEBAS',
  'EN_AUDIENCIA',
  'EN_DECISION',
  'SENTENCIA'
);

CREATE TYPE finalizado_result AS ENUM (
  'FAVORABLE',
  'PARCIALMENTE_FAVORABLE',
  'DESFAVORABLE',
  'IMPROCEDENTE',
  'DESISTIDA',
  'ARCHIVADA_SIN_DECISION'
);

CREATE TYPE action_content_mode AS ENUM ('TEMPLATE', 'TEXT', 'PDF');
CREATE TYPE publicacion_mode AS ENUM ('MANUAL', 'SCHEDULED');
CREATE TYPE action_visibility AS ENUM ('PUBLIC', 'UNLISTED');
CREATE TYPE action_role AS ENUM ('CREADOR', 'LIDER', 'CO_LIDER', 'APOYO');
CREATE TYPE transition_trigger_type AS ENUM ('MANUAL', 'SCHEDULED', 'SIGNATURE_COUNT', 'DEADLINE');

CREATE TYPE identity_verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ========== PROFILES (identity) ==========
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cedula text UNIQUE,
  ADD COLUMN IF NOT EXISTS cedula_front_path text,
  ADD COLUMN IF NOT EXISTS cedula_back_path text,
  ADD COLUMN IF NOT EXISTS selfie_path text,
  ADD COLUMN IF NOT EXISTS signature_image_path text,
  ADD COLUMN IF NOT EXISTS identity_verification_status identity_verification_status NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS identity_verified_by uuid REFERENCES auth.users(id);

-- ========== CATALOG ==========
CREATE TABLE action_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  competent_entity_hint text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO action_types (name, slug, competent_entity_hint, order_index) VALUES
  ('Acción de tutela', 'accion_tutela', 'Juez de la República', 1),
  ('Acción popular', 'accion_popular', 'Juez administrativo', 2),
  ('Acción de grupo', 'accion_grupo', 'Juez administrativo', 3),
  ('Acción de cumplimiento', 'accion_cumplimiento', 'Juez administrativo / contencioso', 4),
  ('Acción de nulidad', 'accion_nulidad', 'Jurisdicción de lo contencioso administrativo', 5),
  ('Acción de inconstitucionalidad', 'accion_inconstitucionalidad', 'Corte Constitucional (vía filtro)', 6);

CREATE TABLE action_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type_id uuid REFERENCES action_types(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  schema jsonb NOT NULL DEFAULT '{}',
  body_template text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== ACTIONS ==========
CREATE TABLE constitutional_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  action_type_id uuid NOT NULL REFERENCES action_types(id),
  title text NOT NULL,
  summary text,
  content_mode action_content_mode NOT NULL DEFAULT 'TEXT',
  content_template_id uuid REFERENCES action_templates(id) ON DELETE SET NULL,
  content_data jsonb NOT NULL DEFAULT '{}',
  content_body text,
  content_pdf_storage_path text,
  state action_state NOT NULL DEFAULT 'EN_CREACION',
  radicado_milestone radicado_milestone,
  finalizado_result finalizado_result,
  minimum_required int NOT NULL DEFAULT 1,
  target_count int,
  firma_deadline_at timestamptz,
  firma_opened_at timestamptz,
  publicacion_mode publicacion_mode NOT NULL DEFAULT 'MANUAL',
  publicacion_programada_at timestamptz,
  radicado_at timestamptz,
  radicado_number text,
  radicado_entity_name text,
  final_document_storage_path text,
  final_document_sha256 text,
  visibility action_visibility NOT NULL DEFAULT 'PUBLIC',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_constitutional_actions_slug ON constitutional_actions(slug);
CREATE INDEX idx_constitutional_actions_state ON constitutional_actions(state);
CREATE INDEX idx_constitutional_actions_created_by ON constitutional_actions(created_by);
CREATE INDEX idx_constitutional_actions_visibility ON constitutional_actions(visibility);

CREATE TABLE constitutional_action_roles (
  action_id uuid NOT NULL REFERENCES constitutional_actions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role action_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (action_id, user_id, role)
);

CREATE INDEX idx_action_roles_user ON constitutional_action_roles(user_id);

CREATE TABLE constitutional_action_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES constitutional_actions(id) ON DELETE CASCADE,
  signer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signed_at timestamptz NOT NULL DEFAULT now(),
  snapshot_full_name text NOT NULL,
  snapshot_cedula text NOT NULL,
  snapshot_signature_storage_path text NOT NULL,
  identity_verified_at_sign identity_verification_status NOT NULL DEFAULT 'PENDING',
  client_ip inet,
  user_agent text,
  UNIQUE (action_id, signer_user_id)
);

CREATE INDEX idx_action_signatures_action ON constitutional_action_signatures(action_id);

CREATE TABLE constitutional_action_state_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES constitutional_actions(id) ON DELETE CASCADE,
  from_state action_state,
  to_state action_state NOT NULL,
  from_milestone radicado_milestone,
  to_milestone radicado_milestone,
  trigger_type transition_trigger_type NOT NULL DEFAULT 'MANUAL',
  actor_id uuid REFERENCES auth.users(id),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_action_transitions_action ON constitutional_action_state_transitions(action_id);

-- ========== COMMUNITY ==========
CREATE TABLE action_chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES constitutional_actions(id) ON DELETE CASCADE,
  title text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_action_chat_default ON action_chat_threads(action_id) WHERE is_default = true;

CREATE TABLE action_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES action_chat_threads(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES constitutional_actions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  message text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE action_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES constitutional_actions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE action_meetups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES constitutional_actions(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_date date NOT NULL,
  event_time time NOT NULL,
  meeting_point text,
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE action_meetup_attendance (
  meetup_id uuid NOT NULL REFERENCES action_meetups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status meetup_attendance_status NOT NULL DEFAULT 'GOING',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (meetup_id, user_id)
);

CREATE TABLE action_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES constitutional_actions(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  bucket text NOT NULL DEFAULT 'action_attachments',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  sha256 text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== PUBLIC VIEW ==========
CREATE OR REPLACE VIEW constitutional_actions_public AS
SELECT
  a.id,
  a.slug,
  a.action_type_id,
  a.title,
  a.summary,
  a.state,
  a.radicado_milestone,
  a.finalizado_result,
  a.minimum_required,
  a.target_count,
  a.firma_deadline_at,
  a.visibility,
  a.created_at,
  (SELECT count(*)::int FROM constitutional_action_signatures s WHERE s.action_id = a.id) AS signatures_count
FROM constitutional_actions a
WHERE a.visibility = 'PUBLIC';

-- ========== HELPERS ==========
CREATE OR REPLACE FUNCTION is_action_signer(p_action_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM constitutional_action_signatures
    WHERE action_id = p_action_id AND signer_user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_action_leader(p_action_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM constitutional_action_roles
    WHERE action_id = p_action_id
      AND user_id = auth.uid()
      AND role IN ('CREADOR', 'LIDER', 'CO_LIDER')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_access_action_community(p_action_id uuid)
RETURNS boolean AS $$
  SELECT is_action_signer(p_action_id) OR is_action_leader(p_action_id) OR is_admin();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION action_signatures_count(p_action_id uuid)
RETURNS int AS $$
  SELECT count(*)::int FROM constitutional_action_signatures WHERE action_id = p_action_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========== TRANSITIONS ==========
CREATE OR REPLACE FUNCTION record_action_transition(
  p_action_id uuid,
  p_from_state action_state,
  p_to_state action_state,
  p_trigger transition_trigger_type,
  p_actor_id uuid,
  p_reason text DEFAULT NULL,
  p_from_milestone radicado_milestone DEFAULT NULL,
  p_to_milestone radicado_milestone DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO constitutional_action_state_transitions (
    action_id, from_state, to_state, from_milestone, to_milestone,
    trigger_type, actor_id, reason
  ) VALUES (
    p_action_id, p_from_state, p_to_state, p_from_milestone, p_to_milestone,
    p_trigger, p_actor_id, p_reason
  );
  INSERT INTO action_events (action_id, event_type, actor_id, payload)
  VALUES (
    p_action_id,
    'STATE_CHANGED',
    p_actor_id,
    jsonb_build_object(
      'from_state', p_from_state,
      'to_state', p_to_state,
      'trigger', p_trigger
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION evaluate_action_transitions(p_action_id uuid)
RETURNS void AS $$
DECLARE
  r constitutional_actions%ROWTYPE;
  v_count int;
  v_from action_state;
BEGIN
  SELECT * INTO r FROM constitutional_actions WHERE id = p_action_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  v_from := r.state;
  v_count := action_signatures_count(p_action_id);

  IF r.state = 'EN_CREACION'
     AND r.publicacion_mode = 'SCHEDULED'
     AND r.publicacion_programada_at IS NOT NULL
     AND now() >= r.publicacion_programada_at THEN
    UPDATE constitutional_actions
    SET state = 'EN_FIRMA', firma_opened_at = now(), updated_at = now()
    WHERE id = p_action_id;
    PERFORM record_action_transition(p_action_id, v_from, 'EN_FIRMA', 'SCHEDULED', NULL, 'Publicación programada');
    RETURN;
  END IF;

  IF r.state = 'EN_FIRMA' THEN
    IF v_count >= r.minimum_required
       OR (r.firma_deadline_at IS NOT NULL AND now() >= r.firma_deadline_at) THEN
      UPDATE constitutional_actions
      SET state = 'FIRMADO', updated_at = now()
      WHERE id = p_action_id;
      PERFORM record_action_transition(
        p_action_id, v_from, 'FIRMADO',
        CASE WHEN v_count >= r.minimum_required THEN 'SIGNATURE_COUNT'::transition_trigger_type ELSE 'DEADLINE'::transition_trigger_type END,
        NULL,
        'Cierre automático de recolección'
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trg_evaluate_after_signature()
RETURNS trigger AS $$
BEGIN
  PERFORM evaluate_action_transitions(NEW.action_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_action_signature_insert
  AFTER INSERT ON constitutional_action_signatures
  FOR EACH ROW EXECUTE FUNCTION trg_evaluate_after_signature();

CREATE OR REPLACE FUNCTION transition_action_state(
  p_action_id uuid,
  p_to_state action_state,
  p_reason text DEFAULT NULL,
  p_radicado_milestone radicado_milestone DEFAULT NULL,
  p_finalizado_result finalizado_result DEFAULT NULL,
  p_radicado_number text DEFAULT NULL,
  p_radicado_entity_name text DEFAULT NULL
) RETURNS constitutional_actions AS $$
DECLARE
  r constitutional_actions%ROWTYPE;
  v_from action_state;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT is_action_leader(p_action_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO r FROM constitutional_actions WHERE id = p_action_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Action not found'; END IF;
  v_from := r.state;

  IF p_to_state = 'EN_FIRMA' AND v_from = 'EN_CREACION' THEN
    UPDATE constitutional_actions SET
      state = 'EN_FIRMA',
      firma_opened_at = now(),
      updated_at = now()
    WHERE id = p_action_id;
  ELSIF p_to_state = 'FIRMADO' AND v_from = 'EN_FIRMA' THEN
    UPDATE constitutional_actions SET state = 'FIRMADO', updated_at = now() WHERE id = p_action_id;
  ELSIF p_to_state = 'RADICADO' AND v_from = 'FIRMADO' THEN
    UPDATE constitutional_actions SET
      state = 'RADICADO',
      radicado_milestone = COALESCE(p_radicado_milestone, 'RECIBIDA'),
      radicado_at = now(),
      radicado_number = p_radicado_number,
      radicado_entity_name = p_radicado_entity_name,
      updated_at = now()
    WHERE id = p_action_id;
  ELSIF p_to_state = 'FINALIZADO' THEN
    IF p_finalizado_result IS NULL THEN RAISE EXCEPTION 'finalizado_result required'; END IF;
    UPDATE constitutional_actions SET
      state = 'FINALIZADO',
      finalizado_result = p_finalizado_result,
      updated_at = now()
    WHERE id = p_action_id;
  ELSE
    UPDATE constitutional_actions SET
      state = p_to_state,
      radicado_milestone = COALESCE(p_radicado_milestone, radicado_milestone),
      updated_at = now()
    WHERE id = p_action_id;
  END IF;

  PERFORM record_action_transition(p_action_id, v_from, p_to_state, 'MANUAL', auth.uid(), p_reason);
  SELECT * INTO r FROM constitutional_actions WHERE id = p_action_id;
  RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== RLS ==========
ALTER TABLE action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE constitutional_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE constitutional_action_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE constitutional_action_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE constitutional_action_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_meetup_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY action_types_select ON action_types FOR SELECT USING (true);
CREATE POLICY action_templates_select ON action_templates FOR SELECT USING (active = true OR is_admin());
CREATE POLICY action_templates_admin ON action_templates FOR ALL USING (is_admin());

CREATE POLICY actions_select ON constitutional_actions FOR SELECT USING (
  visibility = 'PUBLIC' OR is_action_signer(id) OR is_action_leader(id) OR is_admin()
);
CREATE POLICY actions_insert ON constitutional_actions FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY actions_update ON constitutional_actions FOR UPDATE USING (
  is_action_leader(id) OR is_admin()
);

CREATE POLICY action_roles_select ON constitutional_action_roles FOR SELECT USING (
  is_action_signer(action_id) OR is_action_leader(action_id) OR is_admin()
);
CREATE POLICY action_roles_insert ON constitutional_action_roles FOR INSERT WITH CHECK (
  is_action_leader(action_id) OR is_admin()
);

CREATE POLICY action_signatures_select ON constitutional_action_signatures FOR SELECT USING (
  signer_user_id = auth.uid() OR is_action_leader(action_id) OR is_admin()
);
CREATE POLICY action_signatures_insert ON constitutional_action_signatures FOR INSERT WITH CHECK (
  signer_user_id = auth.uid()
);

CREATE POLICY action_transitions_select ON constitutional_action_state_transitions FOR SELECT USING (
  is_action_signer(action_id) OR is_action_leader(action_id) OR is_admin()
);

CREATE POLICY action_chat_threads_policy ON action_chat_threads FOR ALL USING (
  can_access_action_community(action_id)
);
CREATE POLICY action_chat_messages_policy ON action_chat_messages FOR ALL USING (
  can_access_action_community(action_id)
);
CREATE POLICY action_events_select ON action_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM constitutional_actions a WHERE a.id = action_id AND a.visibility = 'PUBLIC')
  OR can_access_action_community(action_id)
);
CREATE POLICY action_events_insert ON action_events FOR INSERT WITH CHECK (
  can_access_action_community(action_id)
);

CREATE POLICY action_meetups_policy ON action_meetups FOR ALL USING (
  can_access_action_community(action_id)
);
CREATE POLICY action_meetup_attendance_policy ON action_meetup_attendance FOR ALL USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM action_meetups m WHERE m.id = meetup_id AND can_access_action_community(m.action_id)
  )
);

CREATE POLICY action_attachments_policy ON action_attachments FOR ALL USING (
  can_access_action_community(action_id)
);

GRANT SELECT ON constitutional_actions_public TO anon, authenticated;
