"use server";

import { createHash } from "crypto";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { createAction, transitionAction } from "@/application/actions";
import { uniqueSlug } from "@/lib/slugify";
import type { ActionContentMode } from "@/core/types/actionState";
import { revalidateAllActionPaths } from "@/lib/revalidateActionPaths";
import { getTemplateForActionType } from "@/lib/templates/catalog";
import { initialTemplateContent } from "@/application/actions/templates";

const MIN_DEADLINE_DAYS = 5;

export type WizardCreateInput = {
  action_type_id: string;
  title: string;
  summary?: string | null;
  minimum_required: number;
  draft_collaboration: "OPEN_AUTH" | "OPEN_INVITED";
  signature_close_rule: "DEADLINE_WINS" | "QUORUM_OR_DEADLINE" | "QUORUM_ONLY";
  firma_deadline_at?: string | null;
  legal_accepted: boolean;
  content_mode: ActionContentMode;
  client_request_id?: string | null;
};

function minDeadlineDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + MIN_DEADLINE_DAYS);
  d.setSeconds(0, 0);
  return d;
}

export async function createWizardActionAction(
  input: WizardCreateInput
): Promise<{ error: string | null; actionId: string | null }> {
  if (!input.legal_accepted) {
    return { error: "Debes aceptar el aviso de responsabilidad legal.", actionId: null };
  }

  if (!input.title.trim()) {
    return { error: "El título es obligatorio.", actionId: null };
  }

  if (input.signature_close_rule !== "QUORUM_ONLY") {
    if (!input.firma_deadline_at) {
      return { error: "Indica la fecha límite de firmas.", actionId: null };
    }
    const chosen = new Date(input.firma_deadline_at);
    if (chosen < minDeadlineDate()) {
      return {
        error: `La fecha límite debe ser al menos ${MIN_DEADLINE_DAYS} días después de hoy.`,
        actionId: null,
      };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Debes iniciar sesión para crear una acción.", actionId: null };
  }

  try {
    const repos = createRepositories(supabase);

    let content: { content_body: string | null; content_data: Record<string, unknown> } = {
      content_body: null,
      content_data: {},
    };
    let contentMode: ActionContentMode = input.content_mode === "PDF" ? "PDF" : "TEXT";
    if (input.content_mode === "TEMPLATE") {
      const types = await repos.catalog.getActionTypes();
      const typeSlug = types.find((t) => t.id === input.action_type_id)?.slug;
      const def = typeSlug ? getTemplateForActionType(typeSlug) : null;
      if (!def) {
        return { error: "Este tipo de acción aún no tiene plantilla guiada.", actionId: null };
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, cedula")
        .eq("id", user.id)
        .maybeSingle();
      content = initialTemplateContent(def, {
        fullName: profile?.full_name ?? null,
        cedula: profile?.cedula ?? null,
        email: user.email ?? null,
      });
      contentMode = "TEMPLATE";
    }

    const action = await createAction(repos, {
      action_type_id: input.action_type_id,
      title: input.title.trim(),
      summary: input.summary?.trim() || null,
      slug: uniqueSlug(input.title),
      content_mode: contentMode,
      content_body: content.content_body,
      content_data: content.content_data,
      minimum_required: Math.max(1, input.minimum_required),
      created_by: user.id,
      draft_collaboration: input.draft_collaboration,
      signature_close_rule: input.signature_close_rule,
      firma_deadline_at: input.firma_deadline_at ?? null,
      client_request_id: input.client_request_id ?? null,
    });
    return { error: null, actionId: action.id };
  } catch (err) {
    const supa =
      err && typeof err === "object"
        ? (err as { message?: string; code?: string; details?: string; hint?: string })
        : null;

    if (supa?.code === "23505" && input.client_request_id) {
      const repos = createRepositories(supabase);
      const existing = await repos.actions.findByCreatorRequest(
        user.id,
        input.client_request_id
      );
      if (existing) return { error: null, actionId: existing.id };
    }

    const message =
      supa?.message ??
      (err instanceof Error ? err.message : null) ??
      "No se pudo crear la acción. Intenta de nuevo.";

    return { error: message, actionId: null };
  }
}

function revalidateAction(actionId: string) {
  revalidateAllActionPaths(actionId);
}

export async function finalizeWizardPdfAction(
  actionId: string,
  storagePath: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };

  try {
    const repos = createRepositories(supabase);
    const action = await repos.actions.getById(actionId);
    if (!action) return { error: "Acción no encontrada" };
    if (action.created_by !== user.id) {
      return { error: "Solo el creador puede finalizar esta acción" };
    }

    const { data: pdfBlob, error: dlError } = await supabase.storage
      .from("action_documents")
      .download(storagePath);
    if (dlError || !pdfBlob) {
      return { error: dlError?.message ?? "No se pudo leer el PDF subido" };
    }
    const pdfBytes = Buffer.from(await pdfBlob.arrayBuffer());
    const hash = createHash("sha256").update(pdfBytes).digest("hex");

    await repos.actions.update(actionId, {
      content_mode: "PDF",
      content_pdf_storage_path: storagePath,
    });

    await supabase
      .from("constitutional_actions")
      .update({
        body_snapshot_sha256: hash,
        body_frozen_at: new Date().toISOString(),
      })
      .eq("id", actionId);

    if (action.state === "EN_CREACION") {
      await transitionAction(repos, actionId, "EN_FIRMA", {
        reason: "Publicación automática (PDF listo)",
      });
    }

    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al publicar el PDF",
    };
  }
}
