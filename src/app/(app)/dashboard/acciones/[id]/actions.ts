"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { createClient } from "@/infrastructure/supabase/server";
import { buildSignedPdf } from "@/lib/buildSignedPdf";
import { prepareSignaturesForPdf } from "@/lib/prepareSignaturesForPdf";
import { ACTION_DOCUMENTS_BUCKET } from "@/lib/actionDocuments";
import { createRepositories } from "@/infrastructure/repositories";
import {
  publishAction,
  closeSignatureCollection,
  transitionAction,
  signAction,
} from "@/application/actions";
import { profileForSigning } from "@/application/actions/signerProfile";
import { templateBlockingIssues } from "@/application/actions/templates";
import type {
  ActionState,
  FinalizadoResult,
  RadicadoMilestone,
} from "@/core/types/actionState";

import { revalidateAllActionPaths } from "@/lib/revalidateActionPaths";

function revalidateAction(actionId: string) {
  revalidateAllActionPaths(actionId);
}

export async function publishActionAction(actionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };
  try {
    const repos = createRepositories(supabase);
    const action = await repos.actions.getById(actionId);
    if (action) {
      const issues = templateBlockingIssues(action);
      if (issues.length > 0) {
        return {
          error: `Completa la plantilla antes de publicar: ${issues
            .slice(0, 3)
            .map((i) => i.message)
            .join(" ")}${issues.length > 3 ? ` (y ${issues.length - 3} más)` : ""}`,
        };
      }
      let hash: string | null = null;
      if (action.content_mode === "PDF" && action.content_pdf_storage_path) {
        const { data: pdfBlob } = await supabase.storage
          .from(ACTION_DOCUMENTS_BUCKET)
          .download(action.content_pdf_storage_path);
        if (pdfBlob) {
          const bytes = Buffer.from(await pdfBlob.arrayBuffer());
          hash = createHash("sha256").update(bytes).digest("hex");
        }
      } else if (action.content_body) {
        hash = createHash("sha256").update(action.content_body).digest("hex");
        await repos.actions.update(actionId, {
          content_body: action.content_body,
        });
      }
      if (hash) {
        await supabase
          .from("constitutional_actions")
          .update({
            body_snapshot_sha256: hash,
            body_frozen_at: new Date().toISOString(),
          })
          .eq("id", actionId);
      }
    }
    await publishAction(repos, actionId);
    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al publicar" };
  }
}

export async function closeSignaturesAction(actionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };
  try {
    const repos = createRepositories(supabase);
    const action = await repos.actions.getById(actionId);
    const signatureRows = await repos.actions.listSignaturesForAction(actionId);
    if (action) {
      const signatures = await prepareSignaturesForPdf(supabase, signatureRows);
      let originalPdfBytes: Buffer | undefined;
      if (action.content_mode === "PDF" && action.content_pdf_storage_path) {
        const { data: pdfBlob } = await supabase.storage
          .from(ACTION_DOCUMENTS_BUCKET)
          .download(action.content_pdf_storage_path);
        if (pdfBlob) {
          originalPdfBytes = Buffer.from(await pdfBlob.arrayBuffer());
        }
      }
      const pdf = await buildSignedPdf({
        title: action.title,
        body: action.content_body ?? undefined,
        originalPdfBytes,
        signatures,
        documentHash: action.body_snapshot_sha256 ?? undefined,
      });
      const finalHash = createHash("sha256").update(pdf).digest("hex");
      await supabase
        .from("constitutional_actions")
        .update({
          final_document_sha256: finalHash,
        })
        .eq("id", actionId);
    }
    await closeSignatureCollection(repos, actionId);
    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al cerrar firmas" };
  }
}

export async function transitionActionAction(
  actionId: string,
  toState: ActionState,
  options?: {
    reason?: string;
    radicado_milestone?: RadicadoMilestone;
    finalizado_result?: FinalizadoResult;
    radicado_number?: string;
    radicado_entity_name?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };
  try {
    const repos = createRepositories(supabase);
    await transitionAction(repos, actionId, toState, options);
    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error en transición" };
  }
}

export async function signActionAction(actionId: string) {
  return signActionWithPadAction(actionId, null);
}

export async function signActionWithPadAction(
  actionId: string,
  signatureStoragePath: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };
  const repos = createRepositories(supabase);
  const existing = await repos.users.getProfile(user.id);
  const profile = profileForSigning(user, existing);
  try {
    const h = await headers();
    await signAction(repos, actionId, user.id, profile, {
      client_ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: h.get("user-agent"),
      signer_geo_country: h.get("cf-ipcountry") ?? "CO",
      signer_geo_city: h.get("cf-ipcity"),
      signer_geo_region: h.get("cf-region"),
      signature_storage_path: signatureStoragePath,
      signer_email: user.email,
    });
    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al firmar" };
  }
}

export async function updateSignableIdentityAction(
  input: {
    cedula: string;
    cedula_front_path: string;
    cedula_back_path?: string;
    selfie_path?: string;
    signature_image_path: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };
  try {
    const repos = createRepositories(supabase);
    await repos.users.updateSignableIdentity(user.id, input);
    revalidatePath("/dashboard/profile");
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al guardar identidad" };
  }
}
