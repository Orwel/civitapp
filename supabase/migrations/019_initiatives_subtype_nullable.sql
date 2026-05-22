-- subtype y status son opcionales cuando se usa initiative_type_id y estado (nuevo modelo)
ALTER TABLE initiatives
  ALTER COLUMN subtype DROP NOT NULL;
