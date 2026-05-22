-- Iniciativas, miembros y líderes

CREATE TABLE initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subtype initiative_subtype NOT NULL,
  title text NOT NULL,
  summary text,
  status initiative_status NOT NULL DEFAULT 'BORRADOR',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  visibility initiative_visibility NOT NULL DEFAULT 'PUBLIC',
  legal_metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_initiatives_created_by ON initiatives(created_by);
CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_subtype ON initiatives(subtype);
CREATE INDEX idx_initiatives_visibility ON initiatives(visibility);

-- Miembros de la iniciativa
CREATE TABLE initiative_members (
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_in_initiative role_in_initiative NOT NULL DEFAULT 'MEMBER',
  member_status member_status NOT NULL DEFAULT 'ACTIVE',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (initiative_id, user_id)
);

CREATE INDEX idx_initiative_members_user_id ON initiative_members(user_id);
CREATE INDEX idx_initiative_members_initiative_id ON initiative_members(initiative_id);
CREATE INDEX idx_initiative_members_status ON initiative_members(member_status);

-- Líderes de la iniciativa (adicional al rol)
CREATE TABLE initiative_leaders (
  initiative_id uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leader_type leader_type NOT NULL DEFAULT 'GENERAL',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (initiative_id, user_id)
);

CREATE INDEX idx_initiative_leaders_initiative_id ON initiative_leaders(initiative_id);
