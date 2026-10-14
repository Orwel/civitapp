import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatSignedAtColombia } from "./formatColombiaTime";
import QRCode from "qrcode";
import { htmlToBlocks, type TextBlock } from "./htmlToBlocks";

export interface SignatureForPdf {
  snapshot_full_name: string;
  snapshot_cedula: string;
  signed_at: string;
  signed_at_co_pretty?: string | null;
  signature_hash?: string | null;
  signature_image_path: string | null;
  signature_image_bytes?: Uint8Array | null;
}

export interface BuildSignedPdfInput {
  title: string;
  /** HTML del editor (modo TEXTO). Se ignora si hay PDF original. */
  body?: string;
  originalPdfBytes?: Buffer;
  signatures: SignatureForPdf[];
  documentHash?: string;
  /** URL pública de verificación (/verify/[id]). */
  verifyUrl?: string;
  /** Marca de agua de vista previa mientras la recolección sigue abierta. */
  preview?: boolean;
}

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 56;
const MARGIN_TOP = 64;
const MARGIN_BOTTOM = 64;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

/**
 * Las fuentes estándar solo codifican WinAnsi: cualquier otro carácter (emoji, ẽ, →) hace fallar
 * todo el PDF. Se reemplaza por su letra base o por "?".
 */
function makeSanitizer(font: PDFFont): (text: string) => string {
  const supported = new Set(font.getCharacterSet());
  const replacements: Record<string, string> = {
    "→": "->",
    "←": "<-",
    "≤": "<=",
    "≥": ">=",
    " ": " ",
    "​": "",
    "\t": "    ",
  };
  return (text: string) => {
    let out = "";
    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      if (supported.has(cp)) {
        out += ch;
        continue;
      }
      if (ch in replacements) {
        out += replacements[ch];
        continue;
      }
      if (ch === "\n") {
        out += ch;
        continue;
      }
      const base = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (base && [...base].every((c) => supported.has(c.codePointAt(0)!))) {
        out += base;
      } else {
        // Letras desconocidas se marcan; emojis y símbolos decorativos se omiten.
        out += /\p{L}|\p{N}/u.test(ch) ? "?" : "";
      }
    }
    return out;
  };
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/ +/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // Palabra más ancha que la línea (URLs, hashes): se parte por caracteres.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth) {
        let cut = rest.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

class Writer {
  page!: PDFPage;
  y = 0;

  constructor(private doc: PDFDocument) {
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN_TOP;
  }

  ensure(height: number) {
    if (this.y - height < MARGIN_BOTTOM) this.newPage();
  }

  lines(
    lines: string[],
    opts: { font: PDFFont; size: number; indent?: number; color?: ReturnType<typeof rgb> }
  ) {
    const lh = opts.size * 1.4;
    for (const line of lines) {
      this.ensure(lh);
      this.y -= lh;
      if (line) {
        this.page.drawText(line, {
          x: MARGIN_X + (opts.indent ?? 0),
          y: this.y,
          size: opts.size,
          font: opts.font,
          color: opts.color,
        });
      }
    }
  }
}

function writeBlocks(w: Writer, blocks: TextBlock[], font: PDFFont, bold: PDFFont, clean: (s: string) => string) {
  for (const block of blocks) {
    const isHeading = block.kind === "heading";
    const size = isHeading ? (block.level <= 2 ? 13 : 11.5) : 10.5;
    const f = isHeading || block.bold ? bold : font;
    const prefix = block.kind === "listItem" ? (block.ordered ? `${block.index}. ` : "•  ") : "";
    const indent = block.kind === "listItem" ? 14 + block.depth * 14 : 0;
    const text = clean(prefix + block.text);
    const lines = wrap(text, f, size, CONTENT_W - indent);
    if (isHeading) w.ensure(size * 1.4 * Math.min(lines.length + 2, 4));
    w.lines(lines, { font: f, size, indent });
    w.y -= isHeading ? 6 : block.kind === "listItem" ? 2 : 7;
  }
}

async function embedSignatureImage(doc: PDFDocument, bytes: Uint8Array) {
  try {
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await doc.embedJpg(bytes);
    return await doc.embedPng(bytes);
  } catch {
    return null;
  }
}

async function appendSignatureAnnex(
  doc: PDFDocument,
  signatures: SignatureForPdf[],
  font: PDFFont,
  bold: PDFFont,
  clean: (s: string) => string,
  verifyUrl?: string,
  qr?: EmbeddedImage | null
): Promise<Writer> {
  const w = new Writer(doc);
  if (qr) {
    const size = 84;
    w.page.drawImage(qr, { x: PAGE_W - MARGIN_X - size, y: w.y - size + 10, width: size, height: size });
    w.page.drawText("Escanea para verificar", {
      x: PAGE_W - MARGIN_X - size,
      y: w.y - size,
      size: 6.5,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }
  const introWidth = qr ? CONTENT_W - 96 : CONTENT_W;
  w.lines([clean("ANEXO DE FIRMAS")], { font: bold, size: 14 });
  w.y -= 4;
  const intro = [
    `Total de firmantes: ${signatures.length.toLocaleString("es-CO")}.`,
    "Método: firma electrónica simple. Cada firmante se identificó con nombre y número de cédula, autorizó el tratamiento de sus datos, aceptó el texto de este escrito y confirmó su correo electrónico con un código de un solo uso. La fecha y hora corresponden al registro del servidor (hora de Colombia).",
    verifyUrl ? `Verificación del documento: ${verifyUrl}` : "",
  ].filter(Boolean);
  for (const p of intro) {
    w.lines(wrap(clean(p), font, 9, introWidth), { font, size: 9, color: rgb(0.25, 0.25, 0.25) });
  }
  w.y = Math.min(w.y, PAGE_H - MARGIN_TOP - 96) - 10;

  const hasDrawn = signatures.some((s) => s.signature_image_bytes?.length);
  const cols = hasDrawn
    ? { n: 0, name: 30, cc: 230, date: 320, sig: 420 }
    : { n: 0, name: 34, cc: 300, date: 390, sig: -1 };
  const rowH = hasDrawn ? 34 : 15;
  const size = 8.5;

  const header = () => {
    w.ensure(rowH + 16);
    w.y -= 14;
    const hy = w.y;
    w.page.drawText("N.º", { x: MARGIN_X + cols.n, y: hy, size, font: bold });
    w.page.drawText("Nombre", { x: MARGIN_X + cols.name, y: hy, size, font: bold });
    w.page.drawText(clean("Cédula"), { x: MARGIN_X + cols.cc, y: hy, size, font: bold });
    w.page.drawText("Fecha de firma", { x: MARGIN_X + cols.date, y: hy, size, font: bold });
    if (cols.sig >= 0) w.page.drawText("Firma", { x: MARGIN_X + cols.sig, y: hy, size, font: bold });
    w.page.drawLine({
      start: { x: MARGIN_X, y: hy - 4 },
      end: { x: PAGE_W - MARGIN_X, y: hy - 4 },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });
    w.y -= 6;
  };

  header();
  for (let i = 0; i < signatures.length; i++) {
    const sig = signatures[i];
    if (w.y - rowH < MARGIN_BOTTOM) {
      w.newPage();
      header();
    }
    w.y -= rowH;
    const textY = w.y + (hasDrawn ? rowH / 2 - 3 : 3);
    const fecha = sig.signed_at_co_pretty ?? formatSignedAtColombia(sig.signed_at);
    const nameMax = cols.cc - cols.name - 8;
    const fullName = clean(sig.snapshot_full_name);
    let name = fullName;
    while (name.length > 3 && font.widthOfTextAtSize(`${name}...`, size) > nameMax) name = name.slice(0, -1);
    if (name !== fullName) name = `${name.trimEnd()}...`;

    w.page.drawText(String(i + 1), { x: MARGIN_X + cols.n, y: textY, size, font });
    w.page.drawText(name, { x: MARGIN_X + cols.name, y: textY, size, font });
    w.page.drawText(clean(sig.snapshot_cedula), { x: MARGIN_X + cols.cc, y: textY, size, font });
    w.page.drawText(clean(fecha).slice(0, 26), { x: MARGIN_X + cols.date, y: textY, size: 7.5, font });

    if (cols.sig >= 0 && sig.signature_image_bytes?.length) {
      const img = await embedSignatureImage(doc, sig.signature_image_bytes);
      if (img) {
        const scale = Math.min(100 / img.width, (rowH - 6) / img.height, 1);
        w.page.drawImage(img, {
          x: MARGIN_X + cols.sig,
          y: w.y + 3,
          width: img.width * scale,
          height: img.height * scale,
        });
      }
    }
  }
  return w;
}

type EmbeddedImage = Awaited<ReturnType<PDFDocument["embedPng"]>>;

function drawFooters(
  doc: PDFDocument,
  font: PDFFont,
  documentHash: string | undefined,
  preview: boolean,
  qr: EmbeddedImage | null
) {
  const pages = doc.getPages();
  const total = pages.length;
  const QR_SIZE = 46;
  pages.forEach((p, i) => {
    const { width } = p.getSize();
    const left = documentHash
      ? `Civitapp - Hash del texto firmado: ${documentHash.slice(0, 24)}...`
      : "Civitapp";
    p.drawText(left, { x: MARGIN_X, y: 28, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
    const right = `Página ${i + 1} de ${total}`;
    const rightX = width - MARGIN_X - (qr ? QR_SIZE + 8 : 0) - font.widthOfTextAtSize(right, 7);
    p.drawText(right, { x: rightX, y: 28, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
    if (qr) {
      p.drawImage(qr, { x: width - MARGIN_X - QR_SIZE, y: 12, width: QR_SIZE, height: QR_SIZE });
    }
    if (preview) {
      p.drawText("VISTA PREVIA - RECOLECCIÓN DE FIRMAS EN CURSO", {
        x: 70,
        y: 300,
        size: 22,
        font,
        color: rgb(0.85, 0.2, 0.2),
        opacity: 0.18,
        rotate: degrees(35),
      });
    }
  });
}

function appendIntegrityNote(w: Writer, font: PDFFont, bold: PDFFont, documentHash?: string) {
  if (!documentHash) return;
  w.ensure(110);
  w.y -= 18;
  w.lines(["INTEGRIDAD DEL DOCUMENTO"], { font: bold, size: 10 });
  w.lines(["Huella SHA-256 del texto que aceptaron los firmantes:"], { font, size: 8.5 });
  w.lines([documentHash], { font, size: 8, color: rgb(0.3, 0.3, 0.3) });
  w.y -= 4;
  w.lines(
    wrap(
      "Cualquier alteración posterior del texto invalida esta huella. La huella del PDF completo (escrito y anexo) queda registrada en la página de verificación.",
      font,
      8.5,
      CONTENT_W
    ),
    { font, size: 8.5 }
  );
}

export async function buildSignedPdf(input: BuildSignedPdfInput): Promise<Buffer> {
  const { title, body, originalPdfBytes, signatures, documentHash, verifyUrl, preview } = input;

  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setProducer("Civitapp");
  doc.setCreator("Civitapp");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const clean = makeSanitizer(font);

  if (originalPdfBytes?.length) {
    const source = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
    const copied = await doc.copyPages(source, source.getPageIndices());
    for (const page of copied) doc.addPage(page);
  } else {
    const w = new Writer(doc);
    const blocks = htmlToBlocks(body ?? "");
    const startsWithTitle =
      blocks[0]?.kind === "heading" && blocks[0].text.trim().toLowerCase() === title.trim().toLowerCase();
    if (!startsWithTitle) {
      w.lines(wrap(clean(title), bold, 14, CONTENT_W), { font: bold, size: 14 });
      w.y -= 10;
    }
    writeBlocks(w, blocks, font, bold, clean);
  }

  // QR a la verificación pública: desde el papel radicado se llega al registro y, si sigue abierta, a firmar.
  const qr = verifyUrl
    ? await doc.embedPng(
        await QRCode.toBuffer(verifyUrl, { type: "png", width: 256, margin: 1, errorCorrectionLevel: "M" })
      )
    : null;

  const annex = await appendSignatureAnnex(doc, signatures, font, bold, clean, verifyUrl, qr);
  appendIntegrityNote(annex, font, bold, documentHash);
  drawFooters(doc, font, documentHash, Boolean(preview), qr);
  return Buffer.from(await doc.save());
}
