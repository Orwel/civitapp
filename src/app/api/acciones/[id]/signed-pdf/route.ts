import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { ACTION_DOCUMENTS_BUCKET } from "@/lib/actionDocuments";
import { buildSignedPdf } from "@/lib/buildSignedPdf";
import { prepareSignaturesForPdf } from "@/lib/prepareSignaturesForPdf";
import type { ActionState } from "@/core/types/actionState";

const ALLOWED_STATES: ActionState[] = [
  "EN_FIRMA",
  "FIRMADO",
  "RADICADO",
  "APELADO",
  "EN_ESPERA_DE_OTRO_PROCESO",
  "FINALIZADO",
];

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const repos = createRepositories(supabase);
  const action = await repos.actions.getById(id);
  if (!action) {
    return NextResponse.json({ error: "Acción no encontrada" }, { status: 404 });
  }

  if (!ALLOWED_STATES.includes(action.state)) {
    return NextResponse.json(
      { error: "El documento firmado no está disponible en este estado" },
      { status: 403 }
    );
  }


  const signatureRows = await repos.actions.listSignaturesForAction(id);
  const signatures = await prepareSignaturesForPdf(supabase, signatureRows);

  let originalPdfBytes: Buffer | undefined;
  if (action.content_mode === "PDF" && action.content_pdf_storage_path) {
    const { data, error } = await supabase.storage
      .from(ACTION_DOCUMENTS_BUCKET)
      .download(action.content_pdf_storage_path);
    if (error || !data) {
      return NextResponse.json({ error: "No se pudo leer el PDF original" }, { status: 500 });
    }
    originalPdfBytes = Buffer.from(await data.arrayBuffer());
  }

  const pdf = await buildSignedPdf({
    title: action.title,
    body: action.content_body ?? undefined,
    originalPdfBytes,
    signatures,
    documentHash: action.body_snapshot_sha256 ?? action.final_document_sha256 ?? undefined,
  });

  const safeTitle = action.title.replace(/[^\w\s-]/g, "").slice(0, 80) || "accion";
  const filename = `${safeTitle}-firmado.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
