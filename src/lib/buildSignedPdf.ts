import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatSignedAtColombia } from "./formatColombiaTime";
import { htmlToPdfBlocks } from "./htmlToPdfBlocks";

export interface SignatureForPdf {
  snapshot_full_name: string;
  snapshot_cedula: string;
  signed_at: string;
  signed_at_co_pretty?: string | null;
  signer_geo_city?: string | null;
  signer_geo_region?: string | null;
  signer_geo_country?: string | null;
  signature_hash?: string | null;
  signature_image_path: string | null;
  signature_image_bytes?: Uint8Array | null;
  client_ip?: string | null;
  user_agent?: string | null;
}

export interface BuildSignedPdfInput {
  title: string;
  body?: string;
  originalPdfBytes?: Buffer;
  signatures: SignatureForPdf[];
  documentHash?: string;
}

const SIGNATURE_IMAGE_MAX_WIDTH = 120;
const SIGNATURE_IMAGE_MAX_HEIGHT = 40;

async function embedSignatureImage(
  doc: PDFDocument,
  bytes: Uint8Array
): Promise<Awaited<ReturnType<PDFDocument["embedPng"]>> | null> {
  try {
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      return await doc.embedJpg(bytes);
    }
    return await doc.embedPng(bytes);
  } catch {
    return null;
  }
}

async function appendSignaturePages(
  doc: PDFDocument,
  signatures: SignatureForPdf[],
  documentHash?: string
) {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let sigPage = doc.addPage([595, 842]);
  let y = 780;
  sigPage.drawText("Anexo de firmas — Civitapp", {
    x: 50,
    y,
    size: 14,
    font: fontBold,
  });
  y -= 36;

  for (const sig of signatures) {
    if (y < 140) {
      sigPage = doc.addPage([595, 842]);
      y = 780;
    }

    if (sig.signature_image_bytes?.length) {
      const img = await embedSignatureImage(doc, sig.signature_image_bytes);
      if (img) {
        const scale = Math.min(
          SIGNATURE_IMAGE_MAX_WIDTH / img.width,
          SIGNATURE_IMAGE_MAX_HEIGHT / img.height,
          1
        );
        const w = img.width * scale;
        const h = img.height * scale;
        sigPage.drawImage(img, { x: 50, y: y - h, width: w, height: h });
        y -= h + 8;
      }
    }

    const lugar =
      [sig.signer_geo_city, sig.signer_geo_region, sig.signer_geo_country]
        .filter(Boolean)
        .join(", ") || "Colombia";
    const fecha = sig.signed_at_co_pretty ?? formatSignedAtColombia(sig.signed_at);

    sigPage.drawText(sig.snapshot_full_name, { x: 50, y, size: 11, font: fontBold });
    y -= 14;
    sigPage.drawText(`C.C. ${sig.snapshot_cedula}`, { x: 50, y, size: 9, font });
    y -= 12;
    sigPage.drawText(`Firmado: ${fecha}`, { x: 50, y, size: 9, font });
    y -= 12;
    sigPage.drawText(`Lugar: ${lugar}`, { x: 50, y, size: 9, font });
    y -= 12;
    sigPage.drawText(`Registro UTC: ${sig.signed_at}`, {
      x: 50,
      y,
      size: 7,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
    y -= 12;
    if (sig.client_ip) {
      sigPage.drawText(`IP: ${sig.client_ip}`, { x: 50, y, size: 7, font });
      y -= 10;
    }
    if (sig.user_agent) {
      const ua = sig.user_agent.slice(0, 80);
      sigPage.drawText(`Agente: ${ua}${sig.user_agent.length > 80 ? "…" : ""}`, {
        x: 50,
        y,
        size: 7,
        font,
      });
      y -= 10;
    }
    if (sig.signature_hash) {
      sigPage.drawText(`Hash firma: ${sig.signature_hash}`, {
        x: 50,
        y,
        size: 7,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 14;
    }
    y -= 16;
  }

  const footer = documentHash
    ? `Documento firmado digitalmente — Civitapp — Hash documento: ${documentHash.slice(0, 32)}…`
    : "Documento firmado digitalmente — Civitapp";
  for (const p of doc.getPages()) {
    p.drawText(footer, { x: 50, y: 24, size: 7, font, color: rgb(0.35, 0.35, 0.35) });
  }
}

const PAGE: [number, number] = [595, 842];
const MARGIN_X = 60;
const MARGIN_TOP = 790;
const MARGIN_BOTTOM = 60;
const BODY_SIZE = 10.5;
const LINE_HEIGHT = 15;

type PdfFont = Awaited<ReturnType<PDFDocument["embedFont"]>>;
type Word = { text: string; bold: boolean };

/** Reemplaza caracteres que Helvetica (WinAnsi) no puede codificar. */
function makeSanitizer(font: PdfFont) {
  const cache = new Map<string, string>();
  return (text: string) =>
    Array.from(text)
      .map((ch) => {
        const hit = cache.get(ch);
        if (hit !== undefined) return hit;
        let out = ch;
        try {
          font.widthOfTextAtSize(ch, 10);
        } catch {
          out = /\s/.test(ch) ? " " : "?";
        }
        cache.set(ch, out);
        return out;
      })
      .join("");
}

/** Dibuja el cuerpo HTML con ajuste de línea, negritas y paginación. */
async function drawBodyPages(doc: PDFDocument, title: string, body: string) {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const clean = makeSanitizer(font);
  const maxWidth = PAGE[0] - MARGIN_X * 2;

  let page = doc.addPage(PAGE);
  let y = MARGIN_TOP;
  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN_BOTTOM) {
      page = doc.addPage(PAGE);
      y = MARGIN_TOP;
    }
  };

  page.drawText(clean(title.slice(0, 200)), { x: MARGIN_X, y, size: 14, font: fontBold, maxWidth });
  y -= 30;

  for (const block of htmlToPdfBlocks(body)) {
    const isHeading = block.kind === "heading";
    const size = isHeading ? 11.5 : BODY_SIZE;
    const indent = block.kind === "item" ? 18 : 0;
    const width = maxWidth - indent;
    if (isHeading) {
      y -= 6;
      ensureSpace(LINE_HEIGHT * 2);
    }

    let firstLine = true;
    const drawLine = (line: Word[]) => {
      while (line.length && !line[line.length - 1].text.trim()) line.pop();
      ensureSpace(LINE_HEIGHT);
      if (firstLine && block.marker) {
        page.drawText(block.marker, { x: MARGIN_X, y, size, font });
      }
      let x = MARGIN_X + indent;
      for (const w of line) {
        const f = w.bold ? fontBold : font;
        page.drawText(w.text, { x, y, size, font: f });
        x += f.widthOfTextAtSize(w.text, size);
      }
      y -= LINE_HEIGHT;
      firstLine = false;
    };

    for (const forced of block.lines) {
      const words: Word[] = [];
      for (const run of forced) {
        for (const part of clean(run.text).split(/(\s+)/)) {
          if (part) words.push({ text: part, bold: run.bold || isHeading });
        }
      }
      while (words.length && !words[0].text.trim()) words.shift();
      if (!words.length) continue;

      let line: Word[] = [];
      let lineWidth = 0;
      for (const w of words) {
        const f = w.bold ? fontBold : font;
        const ww = f.widthOfTextAtSize(w.text, size);
        const isSpace = !w.text.trim();
        if (isSpace && line.length === 0) continue;
        if (!isSpace && lineWidth + ww > width && line.length > 0) {
          drawLine(line);
          line = [];
          lineWidth = 0;
        }
        if (!isSpace && ww > width) {
          // Palabra más ancha que la línea (URLs, hashes): cortar por caracteres.
          let chunk = "";
          for (const ch of w.text) {
            if (chunk && f.widthOfTextAtSize(chunk + ch, size) > width) {
              drawLine([{ text: chunk, bold: w.bold }]);
              chunk = "";
            }
            chunk += ch;
          }
          line = [{ text: chunk, bold: w.bold }];
          lineWidth = f.widthOfTextAtSize(chunk, size);
          continue;
        }
        line.push(w);
        lineWidth += ww;
      }
      if (line.length) drawLine(line);
    }
    y -= isHeading ? 2 : 6;
  }
}

export async function buildSignedPdf(input: BuildSignedPdfInput): Promise<Buffer> {
  const { title, body, originalPdfBytes, signatures, documentHash } = input;

  let doc: PDFDocument;

  if (originalPdfBytes?.length) {
    const source = await PDFDocument.load(originalPdfBytes);
    doc = await PDFDocument.create();
    const copied = await doc.copyPages(source, source.getPageIndices());
    for (const page of copied) {
      doc.addPage(page);
    }
  } else {
    doc = await PDFDocument.create();
    await drawBodyPages(doc, title, body ?? "");
  }

  await appendSignaturePages(doc, signatures, documentHash);
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

/** @deprecated Use buildSignedPdf */
export async function buildSignedPdfFromText(
  title: string,
  body: string,
  signatures: SignatureForPdf[],
  documentHash?: string
): Promise<Buffer> {
  return buildSignedPdf({ title, body, signatures, documentHash });
}
