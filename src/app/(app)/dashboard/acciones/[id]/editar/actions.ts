"use server";

import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { ACTION_DOCUMENTS_BUCKET } from "@/lib/actionDocuments";
import type { ActionContentMode } from "@/core/types/actionState";

import { revalidateAllActionPaths } from "@/lib/revalidateActionPaths";

function revalidateAction(actionId: string) {
  revalidateAllActionPaths(actionId);
}

export async function acquireEditLockAction(actionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("acquire_edit_lock", {
    p_action_id: actionId,
  });
  if (error) return { granted: false, holder_name: null as string | null };
  const result = data as {
    granted?: boolean;
    holder_name?: string;
    reason?: string;
  };
  return {
    granted: Boolean(result?.granted),
    holder_name: result?.holder_name ?? null,
  };
}

export async function heartbeatEditLockAction(actionId: string) {
  const supabase = await createClient();
  await supabase.rpc("heartbeat_edit_lock", { p_action_id: actionId });
}

export async function releaseEditLockAction(actionId: string) {
  const supabase = await createClient();
  await supabase.rpc("release_edit_lock", { p_action_id: actionId });
}

export async function getActionPdfSignedUrlAction(
  actionId: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();
  const repos = createRepositories(supabase);
  const action = await repos.actions.getById(actionId);
  if (!action?.content_pdf_storage_path) {
    return { url: null, error: null };
  }
  const { data, error } = await supabase.storage
    .from(ACTION_DOCUMENTS_BUCKET)
    .createSignedUrl(action.content_pdf_storage_path, 3600);
  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl, error: null };
}

export async function saveActionPdfDraftAction(
  actionId: string,
  storagePath: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };

  const repos = createRepositories(supabase);
  try {
    await repos.actions.update(actionId, {
      content_mode: "PDF",
      content_pdf_storage_path: storagePath,
    });
    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al guardar el PDF" };
  }
}

export async function setActionContentModeAction(
  actionId: string,
  mode: ActionContentMode
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };

  const repos = createRepositories(supabase);
  try {
    await repos.actions.update(actionId, {
      content_mode: mode,
      ...(mode === "TEXT" ? { content_pdf_storage_path: null } : {}),
    });
    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al cambiar formato" };
  }
}

export async function saveActionDraftAction(
  actionId: string,
  payload: {
    content_body: string;
    content_data: Record<string, unknown>;
    title?: string;
    summary?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };

  const repos = createRepositories(supabase);
  try {
    await repos.actions.update(actionId, {
      content_mode: "TEXT",
      content_body: payload.content_body,
      content_data: payload.content_data,
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.summary !== undefined ? { summary: payload.summary } : {}),
    });
    revalidateAction(actionId);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al guardar" };
  }
}
