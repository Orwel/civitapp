import type { ActionMeetup } from "@/core/entities/Meetup";
import type {
  CreateMeetupInput,
  IMeetupRepository,
} from "@/core/repositories/IMeetupRepository";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseMeetupRepository implements IMeetupRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreateMeetupInput): Promise<ActionMeetup> {
    const { data: row, error } = await this.supabase
      .from("action_meetups")
      .insert({
        action_id: data.action_id,
        title: data.title,
        event_date: data.event_date,
        event_time: data.event_time,
        meeting_point: data.meeting_point ?? null,
        description: data.description ?? null,
        created_by: data.created_by,
        mode: data.mode ?? "PRESENCIAL",
        online_url: data.online_url ?? null,
        online_platform: data.online_platform ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return row as ActionMeetup;
  }

  async getByAction(actionId: string): Promise<ActionMeetup[]> {
    const { data, error } = await this.supabase
      .from("action_meetups")
      .select("*")
      .eq("action_id", actionId)
      .order("event_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ActionMeetup[];
  }

  async setAttendance(
    meetupId: string,
    userId: string,
    status: "GOING" | "WENT" | "DID_NOT_GO"
  ): Promise<void> {
    const { error } = await this.supabase.from("action_meetup_attendance").upsert({
      meetup_id: meetupId,
      user_id: userId,
      status,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}
