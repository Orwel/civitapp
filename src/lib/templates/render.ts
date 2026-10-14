// Build CJS empaquetado: evita `require.extensions` de la entrada Node (aviso de webpack).
import Handlebars from "handlebars/dist/cjs/handlebars";
import type { TemplateAnswers, TemplateDefinition } from "@/core/templates/types";
import { parseIsoDate } from "@/core/templates/evaluate";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const ORDINALES = [
  "PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO", "SEXTO", "SÉPTIMO",
  "OCTAVO", "NOVENO", "DÉCIMO", "UNDÉCIMO", "DUODÉCIMO",
];

const ORDINALES_DECENAS: Record<number, string> = { 1: "DÉCIMO", 2: "VIGÉSIMO", 3: "TRIGÉSIMO" };

/** 0 → PRIMERO … 29 → TRIGÉSIMO */
export function ordinal(index: number): string {
  const n = index + 1;
  if (n <= ORDINALES.length) return ORDINALES[n - 1];
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  const head = ORDINALES_DECENAS[tens] ?? String(n);
  return unit === 0 ? head : `${head} ${ORDINALES[unit - 1]}`;
}

export function fechaLarga(value: unknown): string {
  const d = parseIsoDate(value);
  if (!d) return "";
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function listaY(items: unknown): string {
  const arr = Array.isArray(items) ? items.map(String).filter(Boolean) : [];
  if (arr.length <= 1) return arr.join("");
  return `${arr.slice(0, -1).join(", ")} y ${arr[arr.length - 1]}`;
}

type CompiledTemplate = {
  body: HandlebarsTemplateDelegate;
  clauses: Map<string, HandlebarsTemplateDelegate>;
};

const cache = new Map<string, CompiledTemplate>();

function compile(def: TemplateDefinition): CompiledTemplate {
  const key = `${def.slug}@${def.version}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const hb = Handlebars.create();
  const clauses = new Map<string, HandlebarsTemplateDelegate>();

  hb.registerHelper("eq", (a: unknown, b: unknown) => a === b);
  hb.registerHelper("concat", (...args: unknown[]) => args.slice(0, -1).join(""));
  hb.registerHelper("mayus", (v: unknown) => String(v ?? "").toLocaleUpperCase("es-CO"));
  hb.registerHelper("capitalizar", (v: unknown) => {
    const t = String(v ?? "").trim();
    return t.charAt(0).toLocaleUpperCase("es-CO") + t.slice(1);
  });
  hb.registerHelper("inc", (i: unknown) => (Number(i) || 0) + 1);
  hb.registerHelper("ordinal", (i: unknown) => ordinal(Number(i) || 0));
  hb.registerHelper("fecha_larga", (v: unknown) => fechaLarga(v));
  hb.registerHelper("lista_y", (v: unknown) => listaY(v));
  /** Texto libre con saltos de línea → <br/>, escapado. */
  hb.registerHelper("multilinea", (v: unknown) => {
    const escaped = hb.Utils.escapeExpression(String(v ?? "").trim());
    return new hb.SafeString(escaped.replace(/\r?\n/g, "<br/>"));
  });
  /** Quita el punto final para encadenar texto ciudadano dentro de una frase. */
  hb.registerHelper("sin_punto", (v: unknown) => String(v ?? "").trim().replace(/[.;:]+$/, ""));
  hb.registerHelper("clausula", function (slug: unknown, options: Handlebars.HelperOptions) {
    const tpl = clauses.get(String(slug));
    if (!tpl) return "";
    return new hb.SafeString(tpl(options.data.root));
  });

  for (const clause of def.clauses) {
    clauses.set(clause.slug, hb.compile(clause.body, { strict: false }));
  }

  const compiled = { body: hb.compile(def.body, { strict: false }), clauses };
  cache.set(key, compiled);
  return compiled;
}

export function buildRenderContext(
  def: TemplateDefinition,
  answers: TemplateAnswers
): TemplateAnswers {
  return { ...answers, ...(def.derive?.(answers, def.clauses) ?? {}) };
}

/** Renderiza el escrito completo. Misma función en cliente (vista previa) y servidor. */
export function renderTemplate(def: TemplateDefinition, answers: TemplateAnswers): string {
  const { body } = compile(def);
  return body(buildRenderContext(def, answers))
    .replace(/\n\s*\n/g, "\n")
    .replace(/>\s+</g, "><")
    .trim();
}
