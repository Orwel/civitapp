/**
 * Convierte el HTML del editor (TipTap) en bloques de texto para el PDF.
 * No pretende ser un parser HTML completo: cubre párrafos, títulos, listas, saltos y tablas simples.
 */
export type TextBlock =
  | { kind: "heading"; level: number; text: string; bold?: boolean }
  | { kind: "paragraph"; text: string; bold?: boolean }
  | { kind: "listItem"; text: string; ordered: boolean; index: number; depth: number; bold?: boolean };

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  laquo: "«",
  raquo: "»",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  hellip: "…",
  ordm: "º",
  ordf: "ª",
  deg: "°",
  sect: "§",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

function inlineText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(td|th)>/gi, " | ")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

export function htmlToBlocks(html: string): TextBlock[] {
  const src = (html ?? "").trim();
  if (!src) return [];
  // Texto plano sin etiquetas: cada línea en blanco separa párrafos.
  if (!/<[a-z][\s\S]*>/i.test(src)) {
    return src
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((text) => ({ kind: "paragraph" as const, text }));
  }

  const blocks: TextBlock[] = [];
  const listStack: { ordered: boolean; index: number }[] = [];
  const tokenRe = /<(\/?)(h[1-6]|p|li|ul|ol|tr|blockquote|div)\b[^>]*>/gi;
  let last = 0;
  let current: { tag: string; start: number } | null = null;

  const flushLoose = (until: number) => {
    const loose = inlineText(src.slice(last, until));
    if (loose && !current) blocks.push({ kind: "paragraph", text: loose });
  };

  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(src))) {
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();

    if (tag === "ul" || tag === "ol") {
      flushLoose(m.index);
      if (closing) listStack.pop();
      else listStack.push({ ordered: tag === "ol", index: 0 });
      last = tokenRe.lastIndex;
      continue;
    }

    if (!closing) {
      if (current) {
        // Bloque anidado (p dentro de li): se cierra el texto acumulado del padre.
        const text = inlineText(src.slice(current.start, m.index));
        if (text) pushBlock(current.tag, text, src.slice(current.start, m.index));
      } else {
        flushLoose(m.index);
      }
      current = { tag, start: tokenRe.lastIndex };
      if (tag === "li" && listStack.length) listStack[listStack.length - 1].index += 1;
      last = tokenRe.lastIndex;
      continue;
    }

    if (current) {
      const inner = src.slice(current.start, m.index);
      const text = inlineText(inner);
      if (text) pushBlock(current.tag, text, inner);
      current = null;
    }
    last = tokenRe.lastIndex;
  }
  flushLoose(src.length);
  return blocks;

  function pushBlock(tag: string, text: string, inner: string) {
    const bold = /^\s*<(strong|b)>[\s\S]*<\/(strong|b)>\s*$/i.test(inner);
    if (/^h[1-6]$/.test(tag)) {
      blocks.push({ kind: "heading", level: Number(tag[1]), text });
    } else if (tag === "li" || (listStack.length && tag === "p")) {
      const top = listStack[listStack.length - 1];
      blocks.push({
        kind: "listItem",
        text,
        ordered: top?.ordered ?? false,
        index: top?.index ?? 1,
        depth: Math.max(0, listStack.length - 1),
        bold,
      });
    } else {
      blocks.push({ kind: "paragraph", text, bold });
    }
  }
}
