import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import type { ActionState } from "@/core/types/actionState";

/** Segmento de URL por estado (estado = página). */
export const ACTION_STATE_SEGMENT: Record<ActionState, string> = {
  EN_CREACION: "en-creacion",
  EN_FIRMA: "en-firma",
  FIRMADO: "firmado",
  RADICADO: "radicado",
  APELADO: "apelado",
  EN_ESPERA_DE_OTRO_PROCESO: "en-espera",
  FINALIZADO: "finalizado",
};

const SEGMENT_TO_STATE = Object.fromEntries(
  Object.entries(ACTION_STATE_SEGMENT).map(([state, segment]) => [segment, state])
) as Record<string, ActionState>;

export function getActionStateSegment(state: ActionState): string {
  return ACTION_STATE_SEGMENT[state];
}

export function stateFromSegment(segment: string): ActionState | null {
  return SEGMENT_TO_STATE[segment] ?? null;
}

export function getActionDashboardPath(actionId: string, state: ActionState): string {
  return `/dashboard/acciones/${actionId}/${getActionStateSegment(state)}`;
}

/** Ruta canónica según estado actual en BD (idempotente al entrar a la acción). */
export function getCanonicalActionDashboardPath(
  action: Pick<ConstitutionalAction, "id" | "state" | "content_mode">
): string {
  let state = action.state;
  if (state === "EN_CREACION" && action.content_mode === "PDF") {
    state = "EN_FIRMA";
  }
  return getActionDashboardPath(action.id, state);
}

export const LEGACY_ACTION_PATH_REDIRECTS: Record<string, ActionState> = {
  editar: "EN_CREACION",
  firmar: "EN_FIRMA",
};
