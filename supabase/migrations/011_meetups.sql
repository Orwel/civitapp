-- Eventos de iniciativa: marchas, movilizaciones, encuentros (fecha, hora, punto de encuentro, asistencia)

CREATE TYPE meetup_attendance_status AS ENUM (
  'GOING',      -- irá
  'WENT',       -- fue
  'DID_NOT_GO'  -- no fue
);

CREATE TABLE initiative_meetups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_date date NOT NULL,
  event_time time NOT NULL,
  meeting_point text,
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_initiative_meetups_initiative_id ON initiative_meetups(initiative_id);
CREATE INDEX idx_initiative_meetups_event_date ON initiative_meetups(event_date);

CREATE TABLE initiative_meetup_attendance (
  meetup_id uuid NOT NULL REFERENCES initiative_meetups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status meetup_attendance_status NOT NULL DEFAULT 'GOING',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (meetup_id, user_id)
);

CREATE INDEX idx_meetup_attendance_meetup_id ON initiative_meetup_attendance(meetup_id);
CREATE INDEX idx_meetup_attendance_user_id ON initiative_meetup_attendance(user_id);
CREATE INDEX idx_meetup_attendance_status ON initiative_meetup_attendance(status);

-- RLS
ALTER TABLE initiative_meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_meetup_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetups_select" ON initiative_meetups FOR SELECT USING (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "meetups_insert" ON initiative_meetups FOR INSERT WITH CHECK (
  is_initiative_member(initiative_id) AND created_by = auth.uid()
);
CREATE POLICY "meetups_update" ON initiative_meetups FOR UPDATE USING (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "meetups_delete" ON initiative_meetups FOR DELETE USING (
  is_initiative_member(initiative_id) OR is_admin()
);

CREATE POLICY "meetup_attendance_select" ON initiative_meetup_attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM initiative_meetups m
    WHERE m.id = meetup_id AND (is_initiative_member(m.initiative_id) OR is_admin())
  )
);
CREATE POLICY "meetup_attendance_insert" ON initiative_meetup_attendance FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM initiative_meetups m
    WHERE m.id = meetup_id AND is_initiative_member(m.initiative_id)
  )
);
CREATE POLICY "meetup_attendance_update" ON initiative_meetup_attendance FOR UPDATE USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM initiative_meetups m
    WHERE m.id = meetup_id AND (is_initiative_member(m.initiative_id) OR is_admin())
  )
);
CREATE POLICY "meetup_attendance_delete" ON initiative_meetup_attendance FOR DELETE USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM initiative_meetups m
    WHERE m.id = meetup_id AND (is_initiative_member(m.initiative_id) OR is_admin())
  )
);
