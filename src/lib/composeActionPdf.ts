import { PDFDocument, StandardFonts } from "pdf-lib";

export async function composeActionPdf(
  title: string,
  body: string
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const lines = [`${title}\n`, body].join("\n").slice(0, 4000);
  page.drawText(lines, { x: 50, y: 750, size: 11, font, maxWidth: 495 });
  const bytes = await doc.save();
  return Buffer.from(bytes);
}
