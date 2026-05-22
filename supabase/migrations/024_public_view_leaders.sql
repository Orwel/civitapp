-- Vista pública con líderes (sin contenido sensible)
CREATE OR REPLACE VIEW constitutional_actions_public AS
SELECT
  a.id,
  a.slug,
  a.action_type_id,
  a.title,
  a.summary,
  a.state,
  a.radicado_milestone,
  a.finalizado_result,
  a.minimum_required,
  a.target_count,
  a.firma_deadline_at,
  a.visibility,
  a.created_at,
  a.body_snapshot_sha256,
  a.final_document_sha256,
  (SELECT count(*)::int FROM constitutional_action_signatures s WHERE s.action_id = a.id) AS signatures_count,
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object('full_name', p.full_name, 'role', r.role)
      ORDER BY
        CASE r.role
          WHEN 'CREADOR' THEN 1
          WHEN 'LIDER' THEN 2
          WHEN 'CO_LIDER' THEN 3
          ELSE 4
        END,
        p.full_name
    ), '[]'::jsonb)
    FROM (
      SELECT r.role, r.user_id
      FROM constitutional_action_roles r
      WHERE r.action_id = a.id AND r.role IN ('CREADOR', 'LIDER', 'CO_LIDER')
      LIMIT 5
    ) r
    JOIN profiles p ON p.id = r.user_id
  ) AS leaders
FROM constitutional_actions a
WHERE a.visibility = 'PUBLIC';

GRANT SELECT ON constitutional_actions_public TO anon, authenticated;

-- Anon solo lee via vista pública (no tabla completa)
REVOKE SELECT ON constitutional_actions FROM anon;
