-- Reemplazar PDF borrador (upload con upsert)
DROP POLICY IF EXISTS action_docs_update ON storage.objects;
CREATE POLICY action_docs_update ON storage.objects FOR UPDATE
USING (
  bucket_id = 'action_documents'
  AND is_action_leader(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'action_documents'
  AND is_action_leader(((storage.foldername(name))[1])::uuid)
);
