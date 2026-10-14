import type {
  StoredTemplateState,
  TemplateAnswers,
  TemplateDefinition,
  TemplateField,
  TemplateIssue,
} from "./types";

export function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const part of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/** Copia inmutable con `path` asignado. */
export function setPath(obj: TemplateAnswers, path: string, value: unknown): TemplateAnswers {
  const [head, ...rest] = path.split(".");
  if (rest.length === 0) return { ...obj, [head]: value };
  const child = obj[head];
  const base =
    child && typeof child === "object" && !Array.isArray(child)
      ? (child as TemplateAnswers)
      : {};
  return { ...obj, [head]: setPath(base, rest.join("."), value) };
}

export function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function list<T = TemplateAnswers>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function isFieldVisible(field: TemplateField, answers: TemplateAnswers): boolean {
  return field.visibleIf ? field.visibleIf(answers) : true;
}

function isEmpty(field: TemplateField, value: unknown): boolean {
  switch (field.type) {
    case "boolean":
      return value !== true;
    case "clause_multi":
    case "repeatable":
      return !Array.isArray(value) || value.length === 0;
    default:
      return str(value) === "";
  }
}

/** Valida obligatorios y mínimos de un conjunto de campos (recursivo en repetibles). */
function fieldIssues(
  fields: TemplateField[],
  scope: TemplateAnswers,
  root: TemplateAnswers,
  stepId: string,
  prefix: string
): TemplateIssue[] {
  const issues: TemplateIssue[] = [];
  for (const field of fields) {
    if (!isFieldVisible(field, root)) continue;
    const value = getPath(scope, field.key);
    const id = `${stepId}:${prefix}${field.key}`;

    if (field.required && isEmpty(field, value)) {
      issues.push({
        id,
        level: "blocking",
        step: stepId,
        message: `${prefix ? `${prefix.replace(/\.$/, "")} — ` : ""}${field.label}: obligatorio.`,
      });
      continue;
    }

    if (field.type === "clause_multi" && field.min && list(value).length < field.min) {
      issues.push({
        id,
        level: "blocking",
        step: stepId,
        message: `${field.label}: elige al menos ${field.min}.`,
      });
    }

    if (field.type === "repeatable") {
      const items = list(value);
      if (field.min && items.length < field.min) {
        issues.push({
          id,
          level: "blocking",
          step: stepId,
          message: `${field.label}: agrega al menos ${field.min}.`,
        });
      }
      items.forEach((item, i) => {
        issues.push(
          ...fieldIssues(field.fields, item, root, stepId, `${field.itemLabel} ${i + 1}.`)
        );
      });
    }

    if (
      (field.type === "text" || field.type === "textarea") &&
      field.maxLength &&
      str(value).length > field.maxLength
    ) {
      issues.push({
        id: `${id}:max`,
        level: "blocking",
        step: stepId,
        message: `${field.label}: máximo ${field.maxLength} caracteres.`,
      });
    }
  }
  return issues;
}

export function validateTemplate(
  def: TemplateDefinition,
  answers: TemplateAnswers
): TemplateIssue[] {
  const issues: TemplateIssue[] = [];
  for (const step of def.steps) {
    issues.push(...fieldIssues(step.fields, answers, answers, step.id, ""));
  }
  for (const rule of def.rules) {
    let hit = false;
    try {
      hit = rule.when(answers);
    } catch {
      hit = false;
    }
    if (hit) {
      issues.push({ id: rule.id, level: rule.level, step: rule.step, message: rule.message });
    }
  }
  return issues;
}

export function hasBlockingIssues(issues: TemplateIssue[]): boolean {
  return issues.some((i) => i.level === "blocking");
}

/** Fecha `YYYY-MM-DD` → Date local a medianoche (evita corrimientos de zona). */
export function parseIsoDate(value: unknown): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(value));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysSince(date: Date, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today.getTime() - date.getTime()) / 86_400_000);
}

/** Días hábiles (lun–vie) transcurridos desde `date`. No descuenta festivos. */
export function businessDaysSince(date: Date, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let count = 0;
  const cur = new Date(date);
  while (cur < today) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export function readStoredTemplate(
  contentData: Record<string, unknown> | null | undefined
): StoredTemplateState | null {
  const raw = contentData?.template;
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Partial<StoredTemplateState>;
  if (typeof t.slug !== "string" || typeof t.version !== "number") return null;
  return {
    slug: t.slug,
    version: t.version,
    answers: (t.answers as TemplateAnswers) ?? {},
    body_edited: Boolean(t.body_edited),
    updated_at: t.updated_at,
  };
}
