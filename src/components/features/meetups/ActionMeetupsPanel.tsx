"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionMeetup } from "@/core/entities/Meetup";
import type { MeetupAttendanceStatus } from "@/core/entities/Meetup";
import {
  createActionMeetupAction,
  setActionMeetupAttendanceAction,
} from "@/app/(app)/dashboard/acciones/[id]/meetups/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MeetupMode } from "@/lib/meetupUrl";

const STATUS_LABELS: Record<MeetupAttendanceStatus, string> = {
  GOING: "Iré",
  WENT: "Fui",
  DID_NOT_GO: "No fui",
};

const MODE_LABELS: Record<MeetupMode, string> = {
  PRESENCIAL: "Presencial",
  ONLINE: "Online",
  HIBRIDO: "Híbrido",
};

export function ActionMeetupsPanel({
  actionId,
  meetups,
}: {
  actionId: string;
  meetups: ActionMeetup[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<MeetupMode>("PRESENCIAL");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createActionMeetupAction(actionId, {
      title: (fd.get("title") as string)?.trim() ?? "",
      event_date: fd.get("event_date") as string,
      event_time: fd.get("event_time") as string,
      mode,
      meeting_point: (fd.get("meeting_point") as string) || undefined,
      address: (fd.get("address") as string) || undefined,
      city: (fd.get("city") as string) || undefined,
      online_url: (fd.get("online_url") as string) || undefined,
      description: (fd.get("description") as string) || undefined,
    });
    if (res.error) {
      setError(res.error);
      return;
    }
    e.currentTarget.reset();
    setCreating(false);
    router.refresh();
  }

  async function setAttendance(meetupId: string, status: MeetupAttendanceStatus) {
    const res = await setActionMeetupAttendanceAction(actionId, meetupId, status);
    if (res.error) setError(res.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--muted)] rounded-lg border border-[var(--border)] p-3 bg-[var(--surface-hover)]/30">
        Civitapp solo registra el evento. La videollamada o el lugar son responsabilidad del
        organizador. Enlaces permitidos: Zoom, Google Meet, Jitsi, Microsoft Teams.
      </p>

      {creating ? (
        <Card className="p-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <input name="title" required placeholder="Título" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as MeetupMode)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              {(Object.keys(MODE_LABELS) as MeetupMode[]).map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m]}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input name="event_date" type="date" required className="flex-1 rounded-lg border px-3 py-2 text-sm" />
              <input name="event_time" type="time" required className="flex-1 rounded-lg border px-3 py-2 text-sm" />
            </div>
            {(mode === "PRESENCIAL" || mode === "HIBRIDO") && (
              <>
                <input name="address" placeholder="Dirección" className="w-full rounded-lg border px-3 py-2 text-sm" />
                <input name="city" placeholder="Ciudad" className="w-full rounded-lg border px-3 py-2 text-sm" />
                <input name="meeting_point" placeholder="Punto de encuentro" className="w-full rounded-lg border px-3 py-2 text-sm" />
              </>
            )}
            {(mode === "ONLINE" || mode === "HIBRIDO") && (
              <input
                name="online_url"
                type="url"
                placeholder="https://meet.google.com/..."
                required={mode === "ONLINE"}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            )}
            <textarea name="description" rows={2} placeholder="Descripción" className="w-full rounded-lg border px-3 py-2 text-sm" />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" variant="accent">
                Guardar
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>
          Nuevo evento
        </Button>
      )}

      {meetups.length === 0 ? (
        <Card className="p-6 text-center text-[var(--muted)] text-sm">No hay eventos programados.</Card>
      ) : (
        <ul className="space-y-3">
          {meetups.map((m) => (
            <li key={m.id}>
              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{m.title}</h3>
                  {m.mode && (
                    <span className="text-[10px] uppercase font-bold text-[var(--accent)]">
                      {MODE_LABELS[m.mode]}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {m.event_date} · {m.event_time?.slice(0, 5)}
                  {m.city ? ` · ${m.city}` : ""}
                  {m.meeting_point ? ` · ${m.meeting_point}` : ""}
                </p>
                {m.online_url && (
                  <a
                    href={m.online_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent-foreground)]"
                  >
                    Unirse ahora ({m.online_platform ?? "online"})
                  </a>
                )}
                {m.description && <p className="text-sm">{m.description}</p>}
                <div className="flex flex-wrap gap-2 pt-2">
                  {(["GOING", "WENT", "DID_NOT_GO"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setAttendance(m.id, s)}
                      className="text-xs rounded-lg border border-[var(--border)] px-2 py-1 hover:bg-[var(--surface-hover)]"
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
