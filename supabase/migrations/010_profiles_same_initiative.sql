-- Permitir leer perfiles de usuarios que comparten iniciativa contigo (para listar miembros)
CREATE POLICY "profiles_select_same_initiative" ON profiles FOR SELECT USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM initiative_members im1
    JOIN initiative_members im2 ON im1.initiative_id = im2.initiative_id AND im2.user_id = profiles.id
    WHERE im1.user_id = auth.uid() AND im1.member_status = 'ACTIVE'
  )
);
