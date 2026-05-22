import { redirect } from "next/navigation";
import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import type { ActionState } from "@/core/types/actionState";
import { getCanonicalActionDashboardPath } from "@/lib/actionStateRoutes";

/** Redirige a la página del estado real si la ruta no corresponde al estado en BD. */
export function ensureActionStatePage(
  action: Pick<ConstitutionalAction, "id" | "state" | "content_mode">,
  expectedState: ActionState
): void {
  if (action.state !== expectedState) {
    redirect(getCanonicalActionDashboardPath(action));
  }
  if (expectedState === "EN_CREACION" && action.content_mode === "PDF") {
    redirect(getCanonicalActionDashboardPath(action));
  }
}
