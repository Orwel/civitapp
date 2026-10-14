/**
 * Convierte el HTML del editor (Tiptap / plantillas) en bloques simples para pdf-lib.
 * Soporta: p, h1–h6, ol/ul > li, br, strong/b. El resto de etiquetas se ignora.
 */

export interface PdfRun {
  text: string;
  bold: boolean;
}

export interface PdfBlock {
  kind: "heading" | "paragraph" | "item";
  /** Prefijo de viñeta/número para `item`. */
  marker?: string;
  /** Líneas forzadas (por <br/>), cada una con sus fragmentos. */
  lines: PdfRun[][];
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
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

export function htmlToPdfBlocks(html: string): PdfBlock[] {
  // Texto plano (sin etiquetas): un párrafo por línea.
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => ({ kind: "paragraph" as const, lines: [[{ text: l, bold: false }]] }));
  }

  const blocks: PdfBlock[] = [];
  const listStack: { ordered: boolean; n: number }[] = [];
  let current: PdfBlock | null = null;
  let boldDepth = 0;
  let headingDepth = 0;

  const open = (kind: PdfBlock["kind"], marker?: string) => {
    flush();
    current = { kind, marker, lines: [[]] };
  };
  const flush = () => {
    if (current && current.lines.some((l) => l.some((r) => r.text.trim()))) {
      blocks.push(current);
    }
    current = null;
  };
  const pushText = (raw: string) => {
    const text = decodeEntities(raw).replace(/\s+/g, " ");
    if (!text.trim() && !current) return;
    if (!current) current = { kind: "paragraph", lines: [[]] };
    const block = current as PdfBlock;
    block.lines[block.lines.length - 1].push({
      text,
      bold: boldDepth > 0 || headingDepth > 0,
    });
  };

  const re = /<\/?([a-z0-9]+)[^>]*>|([^<]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[2] !== undefined) {
      pushText(m[2]);
      continue;
    }
    const tag = m[1].toLowerCase();
    const closing = m[0].startsWith("</");
    const selfClosing = m[0].endsWith("/>");

    switch (tag) {
      case "p":
        if (closing) flush();
        else if (!listStack.length || !current) open("paragraph");
        break;
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
        if (closing) {
          headingDepth = Math.max(0, headingDepth - 1);
          flush();
        } else {
          open("heading");
          headingDepth++;
        }
        break;
      case "ol": case "ul":
        if (closing) {
          flush();
          listStack.pop();
        } else {
          flush();
          listStack.push({ ordered: tag === "ol", n: 0 });
        }
        break;
      case "li":
        if (closing) flush();
        else {
          const list = listStack[listStack.length - 1];
          const marker = list?.ordered ? `${++list.n}.` : "•";
          open("item", marker);
        }
        break;
      case "br":
        if (current) (current as PdfBlock).lines.push([]);
        break;
      case "strong": case "b":
        if (selfClosing) break;
        boldDepth = Math.max(0, boldDepth + (closing ? -1 : 1));
        break;
      default:
        break;
    }
  }
  flush();
  return blocks;
}
