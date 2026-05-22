import type { InitiativeMember, InitiativeMemberWithProfile } from "@/core/entities/Member";
import type { RoleInInitiative } from "@/core/enums/Roles";

export interface IInitiativeMemberRepository {
  add(initiativeId: string, userId: string, role: RoleInInitiative): Promise<InitiativeMember>;
  getByInitiative(initiativeId: string): Promise<InitiativeMemberWithProfile[]>;
  getByUser(userId: string): Promise<InitiativeMember[]>;
  getMember(initiativeId: string, userId: string): Promise<InitiativeMember | null>;
  isActiveMember(initiativeId: string, userId: string): Promise<boolean>;
}
