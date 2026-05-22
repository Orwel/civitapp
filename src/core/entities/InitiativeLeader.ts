import type { LeaderType } from "@/core/enums/Roles";

export interface InitiativeLeader {
  initiative_id: string;
  user_id: string;
  leader_type: LeaderType;
  created_at: string;
}
