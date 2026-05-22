import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { ActionMeetup } from "@/core/entities/Meetup";

export function ActionMeetupsPreview({
  actionId,
  meetups,
}: {
  actionId: string;
  meetups: ActionMeetup[];
}) {
  const upcoming = meetups
    .filter((m) => new Date(`${m.event_date}T${m.event_time}`) >= new Date())
    .slice(0, 3);

  return (
    <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold">Eventos y reuniones</h3>
        </div>
        <Link
          href={`/dashboard/acciones/${actionId}/meetups`}
          className="text-xs font-semibold text-[var(--accent)] hover:underline"
        >
          Ver todos →
        </Link>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Registra encuentros presenciales u online (Zoom, Meet, Jitsi, Teams). Civitapp documenta la
        convocatoria; la reunión es responsabilidad del organizador.
      </p>
      {upcoming.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No hay eventos próximos programados.</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((m) => (
            <li
              key={m.id}
              className="text-sm rounded-lg border border-[var(--border)] px-3 py-2"
            >
              <span className="font-medium">{m.title}</span>
              <span className="text-[var(--muted)] ml-2 text-xs">
                {m.event_date} · {m.event_time.slice(0, 5)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
