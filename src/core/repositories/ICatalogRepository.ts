import type { ActionType, ActionTypeMilestone } from "@/core/entities/ActionType";

export interface ICatalogRepository {
  getActionTypes(): Promise<ActionType[]>;
  getActionType(id: string): Promise<ActionType | null>;
  getMilestones(actionTypeId: string): Promise<ActionTypeMilestone[]>;
}
