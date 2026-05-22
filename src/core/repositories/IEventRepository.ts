import type { ActionEvent } from "@/core/entities/Event";

export interface IEventRepository {
  getByAction(actionId: string, limit?: number): Promise<ActionEvent[]>;
}
