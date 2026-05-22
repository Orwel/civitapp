-- Firmantes pueden subir su imagen de firma: {actionId}/signatures/{userId}.png
DROP POLICY IF EXISTS action_docs_signer_insert ON storage.objects;
CREATE POLICY action_docs_signer_insert ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'action_documents'
  AND (storage.foldername(name))[2] = 'signatures'
  AND auth.uid() IS NOT NULL
  AND (
    is_action_leader(((storage.foldername(name))[1])::uuid)
    OR (
      EXISTS (
        SELECT 1 FROM constitutional_actions a
        WHERE a.id = ((storage.foldername(name))[1])::uuid
          AND a.state = 'EN_FIRMA'
      )
      AND (storage.foldername(name))[3] LIKE auth.uid()::text || '%'
    )
  )
);
