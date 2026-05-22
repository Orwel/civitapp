export type RoleGlobal = "ADMIN" | "USER" | "POLITICAL_VERIFIED";

export type RoleInInitiative =
  | "OWNER"
  | "LEADER"
  | "MEMBER"
  | "OBSERVER"
  | "POLITICAL_SPONSOR";

export type MemberStatus = "INVITED" | "ACTIVE" | "REMOVED" | "BANNED";

export type LeaderType = "GENERAL" | "LEGAL" | "COMMS" | "FIELD";

export type InitiativeVisibility = "PUBLIC" | "PRIVATE";

export type SignatureRequestStatus = "OPEN" | "CLOSED" | "CANCELED";

export type OfficeType =
  | "CONGRESISTA"
  | "SENADOR"
  | "REPRESENTANTE"
  | "CONCEJAL"
  | "OTRO";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";
