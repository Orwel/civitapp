/**
 * Plantillas guiadas (content_mode = TEMPLATE).
 * Definidas en código (src/lib/templates/catalog). El texto jurídico vive en
 * `body` y `clauses` como Handlebars; las reglas son funciones puras.
 */

export type TemplateAnswers = Record<string, unknown>;

export type FieldOption = { value: string; label: string; help?: string };

type FieldBase = {
  /** Ruta con puntos dentro de las respuestas (p. ej. `accionado.nombre`). */
  key: string;
  label: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  visibleIf?: (answers: TemplateAnswers) => boolean;
};

export type TemplateField =
  | (FieldBase & { type: "text"; maxLength?: number })
  | (FieldBase & { type: "textarea"; maxLength?: number; rows?: number })
  | (FieldBase & { type: "date" })
  | (FieldBase & { type: "select" | "radio"; options: FieldOption[] })
  | (FieldBase & { type: "boolean"; checkboxLabel: string })
  | (FieldBase & { type: "clause_multi"; category: string; min?: number })
  | (FieldBase & {
      type: "repeatable";
      itemLabel: string;
      min?: number;
      max?: number;
      fields: TemplateField[];
      /** Botones de "agregar rápido" calculados según las respuestas. */
      quickAdd?: (answers: TemplateAnswers) => { label: string; item: TemplateAnswers }[];
    });

export interface TemplateStep {
  id: string;
  title: string;
  description?: string;
  fields: TemplateField[];
}

export interface TemplateClause {
  slug: string;
  category: string;
  /** Etiqueta en lenguaje ciudadano para la casilla. */
  label: string;
  /** Nombre jurídico corto (se usa en el encabezado del escrito). */
  legalName: string;
  help?: string;
  /** Parcial Handlebars; recibe el mismo contexto que el cuerpo. */
  body: string;
}

export type TemplateIssueLevel = "blocking" | "warning";

export interface TemplateRule {
  id: string;
  level: TemplateIssueLevel;
  /** Paso donde se corrige (para enlazar desde la vista previa). */
  step: string;
  message: string;
  /** `true` = hay problema. */
  when: (answers: TemplateAnswers) => boolean;
}

export interface TemplateIssue {
  id: string;
  level: TemplateIssueLevel;
  step: string;
  message: string;
}

export interface TemplatePrefill {
  fullName: string | null;
  cedula: string | null;
  email: string | null;
}

export interface TemplateDefinition {
  slug: string;
  version: number;
  actionTypeSlug: string;
  name: string;
  description: string;
  steps: TemplateStep[];
  clauses: TemplateClause[];
  rules: TemplateRule[];
  /** Cuerpo Handlebars (HTML compatible con Tiptap: p, h3, strong, ol, li, br). */
  body: string;
  /** Valores derivados que se agregan al contexto de render. */
  derive?: (answers: TemplateAnswers, clauses: TemplateClause[]) => TemplateAnswers;
  initialAnswers?: (prefill: TemplatePrefill) => TemplateAnswers;
}

/** Lo que se persiste en `constitutional_actions.content_data.template`. */
export interface StoredTemplateState {
  slug: string;
  version: number;
  answers: TemplateAnswers;
  /** true cuando el usuario editó `content_body` a mano en el editor. */
  body_edited: boolean;
  updated_at?: string;
}
