import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import type {
  StoredTemplateState,
  TemplateAnswers,
  TemplateDefinition,
  TemplateIssue,
  TemplatePrefill,
} from "@/core/templates/types";
import { readStoredTemplate, validateTemplate } from "@/core/templates/evaluate";
import { getTemplate } from "@/lib/templates/catalog";
import { renderTemplate } from "@/lib/templates/render";

/** Contenido inicial de una acción creada desde plantilla. */
export function initialTemplateContent(
  def: TemplateDefinition,
  prefill: TemplatePrefill
): { content_body: string; content_data: Record<string, unknown> } {
  const answers = def.initialAnswers?.(prefill) ?? {};
  return templateContent(def, answers);
}

/** Respuestas → cuerpo renderizado + estado persistible. Reinicia `body_edited`. */
export function templateContent(
  def: TemplateDefinition,
  answers: TemplateAnswers
): { content_body: string; content_data: Record<string, unknown> } {
  const template: StoredTemplateState = {
    slug: def.slug,
    version: def.version,
    answers,
    body_edited: false,
    updated_at: new Date().toISOString(),
  };
  return { content_body: renderTemplate(def, answers), content_data: { template } };
}

export function templateForAction(
  action: Pick<ConstitutionalAction, "content_data">
): { def: TemplateDefinition; stored: StoredTemplateState } | null {
  const stored = readStoredTemplate(action.content_data);
  if (!stored) return null;
  const def = getTemplate(stored.slug, stored.version);
  return def ? { def, stored } : null;
}

/** Problemas bloqueantes que impiden publicar para firmas. Vacío si la acción no está en modo plantilla. */
export function templateBlockingIssues(
  action: Pick<ConstitutionalAction, "content_data" | "content_mode">
): TemplateIssue[] {
  if (action.content_mode !== "TEMPLATE") return [];
  const t = templateForAction(action);
  if (!t) return [];
  return validateTemplate(t.def, t.stored.answers).filter((i) => i.level === "blocking");
}
