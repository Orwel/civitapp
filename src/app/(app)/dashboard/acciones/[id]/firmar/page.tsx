import { redirect } from "next/navigation";
import { getActionDashboardPath } from "@/lib/actionStateRoutes";

/** Ruta legada → página de estado en-firma */
export default async function FirmarLegacyRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(getActionDashboardPath(id, "EN_FIRMA"));
}
