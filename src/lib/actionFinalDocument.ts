import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import type { Repositories } from "@/infrastructure/repositories";
import { ACTION_DOCUMENTS_BUCKET, finalPdfStoragePath } from "@/lib/actionDocuments";
import { buildSignedPdf } from "@/lib/buildSignedPdf";
import { prepareSignaturesForPdf } from "@/lib/prepareSignaturesForPdf";
import { getSiteOrigin } from "@/lib/siteUrl";

/** Arma el PDF (escrito + anexo de firmas) con las firmas que el usuario puede ver por RLS. */
export async function buildActionPdf(
  supabase: SupabaseClient,
  repos: Repositories,
  action: ConstitutionalAction,
  opts?: { preview?: boolean }
): Promise<Buffer> {
  const rows = await repos.actions.listSignaturesForAction(action.id);
  const signatures = await prepareSignaturesForPdf(supabase, rows);

  let originalPdfBytes: Buffer | undefined;
  if (action.content_mode === "PDF" && action.content_pdf_storage_path) {
    const { data, error } = await supabase.storage
      .from(ACTION_DOCUMENTS_BUCKET)
      .download(action.content_pdf_storage_path);
    if (error || !data) throw new Error("No se pudo leer el PDF original");
    originalPdfBytes = Buffer.from(await data.arrayBuffer());
  }

  return buildSignedPdf({
    title: action.title,
    body: action.content_body ?? undefined,
    originalPdfBytes,
    signatures,
    documentHash: action.body_snapshot_sha256 ?? undefined,
    verifyUrl: `${getSiteOrigin()}/verify/${action.id}`,
    preview: opts?.preview,
  });
}

/**
 * Genera el documento definitivo y lo guarda en Storage con su hash. Solo el líder (ve todas las
 * firmas por RLS). Una vez radicado, la BD impide reemplazarlo.
 */
export async function generateAndStoreFinalDocument(
  supabase: SupabaseClient,
  repos: Repositories,
  action: ConstitutionalAction
): Promise<{ path: string; sha256: string; bytes: Buffer }> {
  const bytes = await buildActionPdf(supabase, repos, action);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const path = finalPdfStoragePath(action.id);
  const { error } = await supabase.storage
    .from(ACTION_DOCUMENTS_BUCKET)
    .upload(path, bytes, { upsert: true, contentType: "application/pdf" });
  if (error) throw new Error(`No se pudo guardar el documento final: ${error.message}`);
  await repos.actions.setFinalDocument(action.id, path, sha256);
  return { path, sha256, bytes };
}

export async function downloadFinalDocument(
  supabase: SupabaseClient,
  action: ConstitutionalAction
): Promise<Buffer | null> {
  if (!action.final_document_storage_path) return null;
  const { data, error } = await supabase.storage
    .from(ACTION_DOCUMENTS_BUCKET)
    .download(action.final_document_storage_path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
