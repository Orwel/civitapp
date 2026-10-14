import type { TemplateDefinition } from "@/core/templates/types";
import { tutelaTemplate } from "./tutela";

/** Plantillas publicadas. Una por tipo de acción (por ahora). */
const TEMPLATES: TemplateDefinition[] = [tutelaTemplate];

export function getTemplate(slug: string, version?: number): TemplateDefinition | null {
  return (
    TEMPLATES.find((t) => t.slug === slug && (version === undefined || t.version === version)) ??
    null
  );
}

export function getTemplateForActionType(actionTypeSlug: string): TemplateDefinition | null {
  return TEMPLATES.find((t) => t.actionTypeSlug === actionTypeSlug) ?? null;
}
