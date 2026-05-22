-- Chat y eventos (bitácora)

CREATE TABLE initiative_chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  title text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_initiative_chat_threads_default
  ON initiative_chat_threads(initiative_id) WHERE is_default = true;
CREATE INDEX idx_initiative_chat_threads_initiative_id ON initiative_chat_threads(initiative_id);

CREATE TABLE initiative_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES initiative_chat_threads(id) ON DELETE CASCADE,
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  message text NOT NULL,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_thread_id ON initiative_chat_messages(thread_id);
CREATE INDEX idx_chat_messages_initiative_id ON initiative_chat_messages(initiative_id);
CREATE INDEX idx_chat_messages_created_at ON initiative_chat_messages(created_at);

-- Bitácora de eventos
CREATE TABLE initiative_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  instrument_id uuid REFERENCES initiative_instruments(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_initiative_events_initiative_id ON initiative_events(initiative_id);
CREATE INDEX idx_initiative_events_created_at ON initiative_events(created_at);
CREATE INDEX idx_initiative_events_event_type ON initiative_events(event_type);
