DO $$ BEGIN
  CREATE TYPE meetup_mode AS ENUM ('PRESENCIAL', 'ONLINE', 'HIBRIDO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE action_meetups
  ADD COLUMN IF NOT EXISTS mode meetup_mode NOT NULL DEFAULT 'PRESENCIAL',
  ADD COLUMN IF NOT EXISTS online_url text,
  ADD COLUMN IF NOT EXISTS online_platform text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Bogota';

ALTER TABLE action_meetups DROP CONSTRAINT IF EXISTS meetup_url_or_address;
ALTER TABLE action_meetups ADD CONSTRAINT meetup_url_or_address CHECK (
  (mode = 'PRESENCIAL' AND (address IS NOT NULL OR meeting_point IS NOT NULL))
  OR (mode = 'ONLINE' AND online_url IS NOT NULL)
  OR (mode = 'HIBRIDO' AND online_url IS NOT NULL AND (address IS NOT NULL OR meeting_point IS NOT NULL))
);
