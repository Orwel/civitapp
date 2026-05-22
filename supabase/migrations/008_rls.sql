-- RLS: acceso por miembro activo, ADMIN, o iniciativa pública

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE political_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_signatures ENABLE ROW LEVEL SECURITY;

-- Helper: es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: es miembro activo de la iniciativa
CREATE OR REPLACE FUNCTION is_initiative_member(init_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM initiative_members
    WHERE initiative_id = init_id AND user_id = auth.uid() AND member_status = 'ACTIVE'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: leer propio perfil; actualizar propio
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (is_admin());

-- User roles: admin ve todo; usuario ve los suyos
CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_roles_admin_all" ON user_roles FOR ALL USING (is_admin());

-- Political profiles: leer propio; admin todo
CREATE POLICY "political_profiles_select_own" ON political_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "political_profiles_admin_all" ON political_profiles FOR ALL USING (is_admin());

-- Initiatives: ver si público, miembro activo o admin
CREATE POLICY "initiatives_select" ON initiatives FOR SELECT USING (
  visibility = 'PUBLIC' OR is_initiative_member(id) OR is_admin()
);
CREATE POLICY "initiatives_insert" ON initiatives FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "initiatives_update" ON initiatives FOR UPDATE USING (
  is_initiative_member(id) OR is_admin()
);
CREATE POLICY "initiatives_delete" ON initiatives FOR DELETE USING (
  is_initiative_member(id) OR is_admin()
);

-- Initiative members: ver si miembro de la iniciativa o admin
CREATE POLICY "initiative_members_select" ON initiative_members FOR SELECT USING (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "initiative_members_insert" ON initiative_members FOR INSERT WITH CHECK (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "initiative_members_update" ON initiative_members FOR UPDATE USING (
  is_initiative_member(initiative_id) OR is_admin()
);

-- Initiative leaders
CREATE POLICY "initiative_leaders_select" ON initiative_leaders FOR SELECT USING (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "initiative_leaders_insert" ON initiative_leaders FOR INSERT WITH CHECK (
  is_initiative_member(initiative_id) OR is_admin()
);

-- Instrument catalog: lectura pública (seed)
CREATE POLICY "instrument_catalog_select" ON instrument_catalog FOR SELECT USING (true);

-- Initiative instruments: ver si miembro o admin
CREATE POLICY "initiative_instruments_select" ON initiative_instruments FOR SELECT USING (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "initiative_instruments_insert" ON initiative_instruments FOR INSERT WITH CHECK (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "initiative_instruments_update" ON initiative_instruments FOR UPDATE USING (
  is_initiative_member(initiative_id) OR is_admin()
);

-- Instrument leaders
CREATE POLICY "instrument_leaders_select" ON instrument_leaders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM initiative_instruments ii
    WHERE ii.id = instrument_id AND (is_initiative_member(ii.initiative_id) OR is_admin())
  )
);
CREATE POLICY "instrument_leaders_insert" ON instrument_leaders FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM initiative_instruments ii
    WHERE ii.id = instrument_id AND (is_initiative_member(ii.initiative_id) OR is_admin())
  )
);

-- Chat threads
CREATE POLICY "chat_threads_select" ON initiative_chat_threads FOR SELECT USING (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "chat_threads_insert" ON initiative_chat_threads FOR INSERT WITH CHECK (
  is_initiative_member(initiative_id) OR is_admin()
);

-- Chat messages
CREATE POLICY "chat_messages_select" ON initiative_chat_messages FOR SELECT USING (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "chat_messages_insert" ON initiative_chat_messages FOR INSERT WITH CHECK (
  is_initiative_member(initiative_id) AND sender_id = auth.uid()
);

-- Events
CREATE POLICY "initiative_events_select" ON initiative_events FOR SELECT USING (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "initiative_events_insert" ON initiative_events FOR INSERT WITH CHECK (
  is_initiative_member(initiative_id) OR is_admin()
);

-- Attachments: insert solo miembros; read miembros o admin
CREATE POLICY "attachments_select" ON initiative_attachments FOR SELECT USING (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "attachments_insert" ON initiative_attachments FOR INSERT WITH CHECK (
  is_initiative_member(initiative_id) AND uploaded_by = auth.uid()
);

-- Signature requests
CREATE POLICY "signature_requests_select" ON instrument_signature_requests FOR SELECT USING (
  is_initiative_member(initiative_id) OR is_admin()
);
CREATE POLICY "signature_requests_insert" ON instrument_signature_requests FOR INSERT WITH CHECK (
  is_initiative_member(initiative_id) AND created_by = auth.uid()
);
CREATE POLICY "signature_requests_update" ON instrument_signature_requests FOR UPDATE USING (
  is_initiative_member(initiative_id) OR is_admin()
);

-- Signatures: initiative_id vía request; insert solo si miembro y request OPEN
CREATE POLICY "signatures_select" ON instrument_signatures FOR SELECT USING (
  is_initiative_member((
    SELECT initiative_id FROM instrument_signature_requests WHERE id = signature_request_id
  )) OR is_admin()
);
CREATE POLICY "signatures_insert" ON instrument_signatures FOR INSERT WITH CHECK (
  is_initiative_member((
    SELECT initiative_id FROM instrument_signature_requests WHERE id = signature_request_id
  ))
  AND signer_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM instrument_signature_requests isr
    WHERE isr.id = signature_request_id AND isr.status = 'OPEN'
  )
);
