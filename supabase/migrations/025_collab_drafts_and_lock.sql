ALTER TABLE constitutional_actions
  ADD COLUMN IF NOT EXISTS draft_collaboration text NOT NULL DEFAULT 'OPEN_INVITED'
    CHECK (draft_collaboration IN ('OPEN_AUTH', 'OPEN_INVITED')),
  ADD COLUMN IF NOT EXISTS editor_lock_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS editor_lock_acquired_at timestamptz,
  ADD COLUMN IF NOT EXISTS editor_lock_heartbeat_at timestamptz;

CREATE OR REPLACE FUNCTION acquire_edit_lock(p_action_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r constitutional_actions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO r FROM constitutional_actions WHERE id = p_action_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'NOT_FOUND');
  END IF;

  IF r.state <> 'EN_CREACION' THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'NOT_DRAFT');
  END IF;

  IF NOT (
    is_action_leader(p_action_id)
    OR is_admin()
    OR (
      r.draft_collaboration = 'OPEN_AUTH'
      AND auth.uid() IS NOT NULL
    )
    OR (
      r.draft_collaboration = 'OPEN_INVITED'
      AND EXISTS (
        SELECT 1 FROM constitutional_action_roles
        WHERE action_id = p_action_id AND user_id = auth.uid()
      )
    )
  ) THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'NOT_ALLOWED');
  END IF;

  IF r.editor_lock_user_id IS NULL
     OR r.editor_lock_user_id = auth.uid()
     OR r.editor_lock_heartbeat_at IS NULL
     OR now() - r.editor_lock_heartbeat_at > interval '30 seconds' THEN
    UPDATE constitutional_actions SET
      editor_lock_user_id = auth.uid(),
      editor_lock_acquired_at = COALESCE(editor_lock_acquired_at, now()),
      editor_lock_heartbeat_at = now(),
      updated_at = now()
    WHERE id = p_action_id;
    RETURN jsonb_build_object('granted', true);
  END IF;

  RETURN jsonb_build_object(
    'granted', false,
    'reason', 'LOCKED',
    'holder_id', r.editor_lock_user_id,
    'holder_name', (SELECT full_name FROM profiles WHERE id = r.editor_lock_user_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION heartbeat_edit_lock(p_action_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE constitutional_actions SET
    editor_lock_heartbeat_at = now(),
    updated_at = now()
  WHERE id = p_action_id
    AND editor_lock_user_id = auth.uid()
    AND state = 'EN_CREACION';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION release_edit_lock(p_action_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE constitutional_actions SET
    editor_lock_user_id = NULL,
    editor_lock_acquired_at = NULL,
    editor_lock_heartbeat_at = NULL,
    updated_at = now()
  WHERE id = p_action_id
    AND (editor_lock_user_id = auth.uid() OR is_admin());
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION protect_action_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_action_leader(OLD.id) AND NOT is_admin() THEN
    NEW.state := OLD.state;
    NEW.visibility := OLD.visibility;
    NEW.minimum_required := OLD.minimum_required;
    NEW.firma_deadline_at := OLD.firma_deadline_at;
    NEW.action_type_id := OLD.action_type_id;
    NEW.draft_collaboration := OLD.draft_collaboration;
    NEW.created_by := OLD.created_by;
    NEW.content_pdf_storage_path := OLD.content_pdf_storage_path;
  END IF;

  IF OLD.state <> 'EN_CREACION' THEN
    NEW.content_body := OLD.content_body;
    NEW.content_data := OLD.content_data;
    NEW.content_pdf_storage_path := OLD.content_pdf_storage_path;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_action_fields ON constitutional_actions;
CREATE TRIGGER trg_protect_action_fields
  BEFORE UPDATE ON constitutional_actions
  FOR EACH ROW EXECUTE FUNCTION protect_action_fields();

DROP POLICY IF EXISTS actions_update ON constitutional_actions;
CREATE POLICY actions_update ON constitutional_actions FOR UPDATE
USING (
  is_admin()
  OR is_action_leader(id)
  OR (
    state = 'EN_CREACION'
    AND editor_lock_user_id = auth.uid()
    AND editor_lock_heartbeat_at IS NOT NULL
    AND now() - editor_lock_heartbeat_at < interval '30 seconds'
  )
);
