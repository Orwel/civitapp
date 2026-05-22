-- El creador debe poder asignar roles iniciales (antes no existía fila en constitutional_action_roles)

DROP POLICY IF EXISTS action_roles_insert ON constitutional_action_roles;

CREATE POLICY action_roles_insert ON constitutional_action_roles FOR INSERT
WITH CHECK (
  is_admin()
  OR is_action_leader(action_id)
  OR EXISTS (
    SELECT 1 FROM constitutional_actions a
    WHERE a.id = action_id
      AND a.created_by = auth.uid()
  )
);
