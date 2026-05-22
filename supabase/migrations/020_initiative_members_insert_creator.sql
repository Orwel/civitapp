-- Permitir que el creador de una iniciativa se añada como miembro (antes la política exigía ser ya miembro).
-- Permite: (1) creador añadiéndose a sí mismo, (2) miembros existentes o admin añadiendo a otros.
DROP POLICY IF EXISTS "initiative_members_insert" ON initiative_members;
CREATE POLICY "initiative_members_insert" ON initiative_members FOR INSERT WITH CHECK (
  (
    user_id = auth.uid()
    AND (SELECT created_by FROM initiatives WHERE id = initiative_id) = auth.uid()
  )
  OR is_initiative_member(initiative_id)
  OR is_admin()
);
