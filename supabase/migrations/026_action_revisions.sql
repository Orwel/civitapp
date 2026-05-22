CREATE TABLE IF NOT EXISTS constitutional_action_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES constitutional_actions(id) ON DELETE CASCADE,
  editor_id uuid NOT NULL REFERENCES auth.users(id),
  content_body_before text,
  content_body_after text,
  content_data_before jsonb,
  content_data_after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_revisions_action ON constitutional_action_revisions(action_id);

ALTER TABLE constitutional_action_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY action_revisions_select ON constitutional_action_revisions FOR SELECT
USING (
  is_action_signer(action_id) OR is_action_leader(action_id) OR is_admin()
);

CREATE OR REPLACE FUNCTION log_action_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.content_body IS DISTINCT FROM NEW.content_body
     OR OLD.content_data IS DISTINCT FROM NEW.content_data THEN
    INSERT INTO constitutional_action_revisions (
      action_id, editor_id,
      content_body_before, content_body_after,
      content_data_before, content_data_after
    ) VALUES (
      NEW.id, auth.uid(),
      OLD.content_body, NEW.content_body,
      OLD.content_data, NEW.content_data
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_action_revision ON constitutional_actions;
CREATE TRIGGER trg_log_action_revision
  AFTER UPDATE ON constitutional_actions
  FOR EACH ROW EXECUTE FUNCTION log_action_revision();
