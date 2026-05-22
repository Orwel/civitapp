import { redirect } from "next/navigation";
import { getActionDashboardPath } from "@/lib/actionStateRoutes";

/** Ruta legada → página de estado en-creacion */
export default async function EditarLegacyRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(getActionDashboardPath(id, "EN_CREACION"));
}
