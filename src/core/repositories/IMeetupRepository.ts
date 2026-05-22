import type { ActionMeetup, ActionMeetupAttendance } from "@/core/entities/Meetup";

export interface CreateMeetupInput {
  action_id: string;
  title: string;
  event_date: string;
  event_time: string;
  meeting_point?: string | null;
  description?: string | null;
  created_by: string;
  mode?: "PRESENCIAL" | "ONLINE" | "HIBRIDO";
  online_url?: string | null;
  online_platform?: string | null;
  address?: string | null;
  city?: string | null;
}

export interface IMeetupRepository {
  create(data: CreateMeetupInput): Promise<ActionMeetup>;
  getByAction(actionId: string): Promise<ActionMeetup[]>;
  setAttendance(
    meetupId: string,
    userId: string,
    status: ActionMeetupAttendance["status"]
  ): Promise<void>;
}
