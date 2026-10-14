import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionSignatureRow } from "@/core/repositories/IConstitutionalActionRepository";
import type { SignatureForPdf } from "@/lib/buildSignedPdf";
import { downloadSignatureImageBytes } from "@/lib/signatureStorage";

const DOWNLOAD_CONCURRENCY = 8;

/** Descarga imágenes de firma solo cuando existen (firma SIMPLE no tiene imagen), en paralelo acotado. */
export async function prepareSignaturesForPdf(
  supabase: SupabaseClient,
  rows: ActionSignatureRow[]
): Promise<SignatureForPdf[]> {
  const result: SignatureForPdf[] = rows.map((row) => ({
    snapshot_full_name: row.snapshot_full_name,
    snapshot_cedula: row.snapshot_cedula,
    signed_at: row.signed_at,
    signed_at_co_pretty: row.signed_at_co_pretty,
    signature_hash: row.signature_hash,
    signature_image_path: row.snapshot_signature_storage_path,
    signature_image_bytes: null,
  }));

  let next = 0;
  async function worker() {
    while (next < result.length) {
      const i = next++;
      const path = result[i].signature_image_path;
      if (path) result[i].signature_image_bytes = await downloadSignatureImageBytes(supabase, path);
    }
  }
  await Promise.all(Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, result.length) }, worker));
  return result;
}
