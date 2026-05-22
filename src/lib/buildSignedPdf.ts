import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatSignedAtColombia } from "./formatColombiaTime";

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
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([595, 842]);
    let y = 800;
    page.drawText(title.slice(0, 200), { x: 50, y, size: 14, font: fontBold });
    y -= 30;
    const lines = (body ?? "").slice(0, 8000).split("\n");
    for (const line of lines) {
      if (y < 80) break;
      page.drawText(line.slice(0, 90), { x: 50, y, size: 10, font, maxWidth: 495 });
      y -= 14;
    }
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
