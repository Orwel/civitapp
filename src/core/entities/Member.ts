import type { MemberStatus, RoleInInitiative } from "@/core/enums/Roles";

export interface InitiativeMember {
  initiative_id: string;
  user_id: string;
  role_in_initiative: RoleInInitiative;
  member_status: MemberStatus;
  joined_at: string;
}

export interface InitiativeMemberWithProfile extends InitiativeMember {
  profile?: { full_name: string | null; photo_url: string | null };
}
