import { NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import {
  buildActionPdf,
  downloadFinalDocument,
  generateAndStoreFinalDocument,
} from "@/lib/actionFinalDocument";
import { isActionLeader } from "@/lib/actionLeader";

export const dynamic = "force-dynamic";
// Con miles de firmas el armado del PDF puede tardar.
export const maxDuration = 60;

/**
 * Documento con anexo de firmas. Solo líderes y admin: contiene nombres y cédulas de todos.
 * - EN_FIRMA: vista previa (marca de agua), se arma al vuelo.
 * - FIRMADO en adelante: el documento definitivo guardado (mismo archivo y hash que /verify).
 */
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

  const allowed =
    user.id === action.created_by ||
    (await isActionLeader(supabase, id, user.id)) ||
    (await repos.users.isAdmin(user.id));
  if (!allowed) {
    return NextResponse.json(
      { error: "Solo quienes lideran la acción pueden descargar el documento con firmas" },
      { status: 403 }
    );
  }

  if (action.state === "EN_CREACION") {
    return NextResponse.json(
      { error: "El documento firmado no está disponible en este estado" },
      { status: 403 }
    );
  }

  let pdf: Buffer | null;
  let suffix = "firmado";
  try {
    if (action.state === "EN_FIRMA") {
      pdf = await buildActionPdf(supabase, repos, action, { preview: true });
      suffix = "vista-previa";
    } else {
      pdf = await downloadFinalDocument(supabase, action);
      if (!pdf) pdf = (await generateAndStoreFinalDocument(supabase, repos, action)).bytes;
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo generar el documento" },
      { status: 500 }
    );
  }

  const safeTitle =
    action.title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "accion";

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeTitle}-${suffix}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
