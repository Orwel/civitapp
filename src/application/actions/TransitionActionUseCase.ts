import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import type { Repositories } from "@/infrastructure/repositories";
import type {
  ActionState,
  FinalizadoResult,
  RadicadoMilestone,
} from "@/core/types/actionState";

export async function publishAction(
  repos: Repositories,
  actionId: string
): Promise<ConstitutionalAction> {
  return repos.actions.transitionState(actionId, "EN_FIRMA", {
    reason: "Publicación manual",
  });
}

export async function closeSignatureCollection(
  repos: Repositories,
  actionId: string
): Promise<ConstitutionalAction> {
  return repos.actions.transitionState(actionId, "FIRMADO", {
    reason: "Cierre manual de recolección",
  });
}

export async function transitionAction(
  repos: Repositories,
  actionId: string,
  toState: ActionState,
  options?: {
    reason?: string;
    radicado_milestone?: RadicadoMilestone;
    finalizado_result?: FinalizadoResult;
    radicado_number?: string;
    radicado_entity_name?: string;
  }
): Promise<ConstitutionalAction> {
  return repos.actions.transitionState(actionId, toState, options);
}
