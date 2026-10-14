"use server";

import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { templateContent, templateForAction } from "@/application/actions/templates";
import type { TemplateAnswers } from "@/core/templates/types";
import { revalidateAllActionPaths } from "@/lib/revalidateActionPaths";

const MAX_ANSWERS_BYTES = 200_000;

/**
 * Guarda las respuestas del asistente. Si el texto no fue editado a mano (o se pide
 * `overwriteEdited`), re-renderiza `content_body`; si no, solo guarda respuestas.
 */
export async function saveTemplateAnswersAction(
  actionId: string,
  answers: TemplateAnswers,
  options?: { overwriteEdited?: boolean }
): Promise<{ error: string | null; bodyUpdated: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión", bodyUpdated: false };

  if (JSON.stringify(answers).length > MAX_ANSWERS_BYTES) {
    return { error: "El contenido es demasiado largo.", bodyUpdated: false };
  }

  try {
    const repos = createRepositories(supabase);
    const action = await repos.actions.getById(actionId);
    if (!action) return { error: "Acción no encontrada", bodyUpdated: false };
    if (action.state !== "EN_CREACION") {
      return { error: "La acción ya no está en creación.", bodyUpdated: false };
    }
    const t = templateForAction(action);
    if (!t) return { error: "Esta acción no tiene plantilla.", bodyUpdated: false };

    if (t.stored.body_edited && !options?.overwriteEdited) {
      await repos.actions.update(actionId, {
        content_data: {
          ...action.content_data,
          template: { ...t.stored, answers, updated_at: new Date().toISOString() },
        },
      });
      revalidateAllActionPaths(actionId);
      return { error: null, bodyUpdated: false };
    }

    const content = templateContent(t.def, answers);
    await repos.actions.update(actionId, {
      content_mode: "TEMPLATE",
      content_body: content.content_body,
      content_data: content.content_data,
    });
    revalidateAllActionPaths(actionId);
    return { error: null, bodyUpdated: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al guardar",
      bodyUpdated: false,
    };
  }
}
