ALTER TABLE action_chat_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES action_chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS action_chat_reactions (
  message_id uuid NOT NULL REFERENCES action_chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

ALTER TABLE action_chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY action_chat_reactions_policy ON action_chat_reactions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM action_chat_messages m
    WHERE m.id = message_id AND can_access_action_community(m.action_id)
  )
);
