import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionSignatureRow } from "@/core/repositories/IConstitutionalActionRepository";
import type { SignatureForPdf } from "@/lib/buildSignedPdf";
import { downloadSignatureImageBytes } from "@/lib/signatureStorage";

export async function prepareSignaturesForPdf(
  supabase: SupabaseClient,
  rows: ActionSignatureRow[]
): Promise<SignatureForPdf[]> {
  const result: SignatureForPdf[] = [];

  for (const row of rows) {
    const bytes = row.snapshot_signature_storage_path
      ? await downloadSignatureImageBytes(supabase, row.snapshot_signature_storage_path)
      : null;

    result.push({
      snapshot_full_name: row.snapshot_full_name,
      snapshot_cedula: row.snapshot_cedula,
      signed_at: row.signed_at,
      signed_at_co_pretty: row.signed_at_co_pretty,
      signer_geo_city: row.signer_geo_city,
      signer_geo_region: row.signer_geo_region,
      signer_geo_country: row.signer_geo_country,
      signature_hash: row.signature_hash,
      signature_image_path: row.snapshot_signature_storage_path,
      signature_image_bytes: bytes,
      client_ip: row.client_ip,
      user_agent: row.user_agent,
    });
  }

  return result;
}
