ALTER TABLE constitutional_actions
  ADD COLUMN IF NOT EXISTS body_snapshot_sha256 text,
  ADD COLUMN IF NOT EXISTS body_frozen_at timestamptz;

INSERT INTO storage.buckets (id, name, public)
VALUES ('action_documents', 'action_documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS action_docs_read ON storage.objects;
CREATE POLICY action_docs_read ON storage.objects FOR SELECT
USING (
  bucket_id = 'action_documents'
  AND EXISTS (
    SELECT 1 FROM constitutional_actions a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND (
        a.visibility = 'PUBLIC'
        OR is_action_leader(a.id)
        OR is_action_signer(a.id)
        OR is_admin()
      )
  )
);

DROP POLICY IF EXISTS action_docs_write ON storage.objects;
CREATE POLICY action_docs_write ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'action_documents'
  AND is_action_leader(((storage.foldername(name))[1])::uuid)
);
