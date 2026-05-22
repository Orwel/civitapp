-- Bucket para adjuntos de iniciativas (convención: initiative/{id}/instrument/{id|none}/{uuid}-{filename})
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachements_iniciatives',
  'attachements_iniciatives',
  false,
  52428800,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Políticas: miembros de la iniciativa pueden subir y leer (path: initiative/{uuid}/...)
CREATE POLICY "attachments_upload_members"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachements_iniciatives'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM initiative_members im
    WHERE im.initiative_id = (split_part(name, '/', 2))::uuid
      AND im.user_id = auth.uid()
      AND im.member_status = 'ACTIVE'
  )
);

CREATE POLICY "attachments_read_members_or_admin"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachements_iniciatives'
  AND (
    EXISTS (
      SELECT 1 FROM initiative_members im
      WHERE im.initiative_id = (split_part(name, '/', 2))::uuid
        AND im.user_id = auth.uid()
        AND im.member_status = 'ACTIVE'
    )
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'ADMIN')
  )
);
