"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import type { MeetupAttendanceStatus } from "@/core/entities/Meetup";
import { validateMeetupOnlineUrl } from "@/lib/meetupUrl";
import type { MeetupMode } from "@/lib/meetupUrl";

export async function createActionMeetupAction(
  actionId: string,
  form: {
    title: string;
    event_date: string;
    event_time: string;
    mode: MeetupMode;
    meeting_point?: string;
    address?: string;
    city?: string;
    online_url?: string;
    description?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };

  if (form.mode === "ONLINE" || form.mode === "HIBRIDO") {
    const url = form.online_url?.trim() ?? "";
    const v = validateMeetupOnlineUrl(url);
    if (!v.ok) return { error: v.error ?? "URL no válida" };
  }

  const repos = createRepositories(supabase);
  try {
    const online =
      form.mode === "ONLINE" || form.mode === "HIBRIDO"
        ? validateMeetupOnlineUrl(form.online_url!.trim())
        : null;

    await repos.meetups.create({
      action_id: actionId,
      title: form.title.trim(),
      event_date: form.event_date,
      event_time: form.event_time,
      meeting_point: form.meeting_point?.trim() || null,
      description: form.description?.trim() || null,
      created_by: user.id,
      mode: form.mode,
      online_url: form.online_url?.trim() || null,
      online_platform: online?.platform ?? null,
      address: form.address?.trim() || null,
      city: form.city?.trim() || null,
    });
    revalidatePath(`/dashboard/acciones/${actionId}/meetups`);
    const { revalidateAllActionPaths } = await import("@/lib/revalidateActionPaths");
    revalidateAllActionPaths(actionId);
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al crear evento",
    };
  }
}

export async function setActionMeetupAttendanceAction(
  actionId: string,
  meetupId: string,
  status: MeetupAttendanceStatus
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión" };

  const repos = createRepositories(supabase);
  try {
    await repos.meetups.setAttendance(meetupId, user.id, status);
    revalidatePath(`/dashboard/acciones/${actionId}/meetups`);
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al actualizar asistencia",
    };
  }
}
