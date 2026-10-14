"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { createClient } from "@/infrastructure/supabase/server";
import { generateAndStoreFinalDocument } from "@/lib/actionFinalDocument";
import { ACTION_DOCUMENTS_BUCKET } from "@/lib/actionDocuments";
import { createRepositories } from "@/infrastructure/repositories";
import {
  publishAction,
  closeSignatureCollection,
  transitionAction,
  signAction,
} from "@/application/actions";
import { profileForSigning } from "@/application/actions/signerProfile";
import type { SignerInput } from "@/application/actions/SignActionUseCase";
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
    await closeSignatureCollection(repos, actionId);
    const closed = await repos.actions.getById(actionId);
    if (closed) await generateAndStoreFinalDocument(supabase, repos, closed);
    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    revalidateAction(actionId);
    return { error: err instanceof Error ? err.message : "Error al cerrar firmas" };
  }
}

/** Vuelve a generar el documento final (p. ej. si el cierre fue automático). Solo antes de radicar. */
export async function regenerateFinalDocumentAction(actionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };
  try {
    const repos = createRepositories(supabase);
    const action = await repos.actions.getById(actionId);
    if (!action) return { error: "Acción no encontrada" };
    if (action.state !== "FIRMADO") {
      return { error: "El documento final solo se genera con la recolección cerrada y antes de radicar" };
    }
    await generateAndStoreFinalDocument(supabase, repos, action);
    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al generar el documento" };
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
    radicado_at?: string;
    milestone_code?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };
  try {
    const repos = createRepositories(supabase);
    if (toState === "RADICADO") {
      const action = await repos.actions.getById(actionId);
      if (action && !action.final_document_storage_path) {
        await generateAndStoreFinalDocument(supabase, repos, action);
      }
    }
    await transitionAction(repos, actionId, toState, options);
    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error en transición" };
  }
}

export async function setMilestoneAction(actionId: string, code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };
  try {
    const repos = createRepositories(supabase);
    await repos.actions.setMilestone(actionId, code);
    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al registrar el hito" };
  }
}

export async function signActionAction(
  actionId: string,
  input: SignerInput
): Promise<{ error: string | null; signatureNumber?: number | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a pedir el código." };
  const repos = createRepositories(supabase);
  const existing = await repos.users.getProfile(user.id);
  const profile = profileForSigning(user, existing);
  try {
    const h = await headers();
    const { signatureNumber } = await signAction(
      repos,
      actionId,
      user.id,
      profile,
      // El correo que cuenta es el verificado de la sesión, no el que se escriba en el formulario.
      { ...input, email: user.email ?? input.email ?? null },
      {
        client_ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        user_agent: h.get("user-agent"),
        signer_geo_country: h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "CO",
        signer_geo_city: decodeHeader(h.get("x-vercel-ip-city") ?? h.get("cf-ipcity")),
        signer_geo_region: h.get("x-vercel-ip-country-region") ?? h.get("cf-region"),
      }
    );
    revalidateAction(actionId);
    return { error: null, signatureNumber };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al firmar" };
  }
}

function decodeHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
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
