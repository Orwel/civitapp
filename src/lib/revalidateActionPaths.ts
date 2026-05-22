import { revalidatePath } from "next/cache";
import { ACTION_STATE_SEGMENT } from "@/lib/actionStateRoutes";
import type { ActionState } from "@/core/types/actionState";

export function revalidateAllActionPaths(actionId: string) {
  revalidatePath(`/dashboard/acciones/${actionId}`);
  for (const segment of Object.values(ACTION_STATE_SEGMENT)) {
    revalidatePath(`/dashboard/acciones/${actionId}/${segment}`);
  }
  revalidatePath(`/dashboard/acciones/${actionId}/editar`);
  revalidatePath(`/dashboard/acciones/${actionId}/firmar`);
  revalidatePath(`/dashboard/acciones/${actionId}/chat`);
  revalidatePath("/dashboard");
  revalidatePath("/acciones");
}

export function revalidateActionStatePath(actionId: string, state: ActionState) {
  revalidateAllActionPaths(actionId);
}
