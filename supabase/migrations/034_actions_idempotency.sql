ALTER TABLE constitutional_actions
  ADD COLUMN IF NOT EXISTS client_request_id text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_actions_creator_request
  ON constitutional_actions (created_by, client_request_id)
  WHERE client_request_id IS NOT NULL;
