export interface ActionMeetup {
  id: string;
  action_id: string;
  title: string;
  event_date: string;
  event_time: string;
  meeting_point: string | null;
  description: string | null;
  mode?: "PRESENCIAL" | "ONLINE" | "HIBRIDO";
  online_url?: string | null;
  online_platform?: string | null;
  address?: string | null;
  city?: string | null;
  timezone?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type MeetupAttendanceStatus = "GOING" | "WENT" | "DID_NOT_GO";

export interface ActionMeetupAttendance {
  meetup_id: string;
  user_id: string;
  status: MeetupAttendanceStatus;
  updated_at: string;
}
