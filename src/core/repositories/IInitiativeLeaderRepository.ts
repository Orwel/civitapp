import type { InitiativeLeader } from "@/core/entities/InitiativeLeader";
import type { LeaderType } from "@/core/enums/Roles";

export interface IInitiativeLeaderRepository {
  add(
    initiativeId: string,
    userId: string,
    leaderType: LeaderType
  ): Promise<InitiativeLeader>;
}
