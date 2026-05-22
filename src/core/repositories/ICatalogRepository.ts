import type { ActionType } from "@/core/entities/ActionType";

export interface ICatalogRepository {
  getActionTypes(): Promise<ActionType[]>;
}
