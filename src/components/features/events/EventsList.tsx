"use client";

import type { ActionEvent } from "@/core/entities/Event";
import { Card } from "@/components/ui/card";

interface EventsListProps {
  events: ActionEvent[];
}

export function EventsList({ events }: EventsListProps) {
  if (events.length === 0) {
    return (
      <Card className="p-8 text-center text-[var(--muted)]">
        Aún no hay eventos registrados.
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <li key={event.id}>
          <Card className="p-4 hover:shadow-card-hover transition-shadow" hover>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm text-[var(--foreground)]">{event.event_type}</span>
              <time className="text-xs text-[var(--muted)]">
                {new Date(event.created_at).toLocaleString()}
              </time>
            </div>
            {event.actor_id && (
              <p className="text-xs text-[var(--muted)] mt-1">
                Actor: {event.actor_id.slice(0, 8)}…
              </p>
            )}
            {Object.keys(event.payload ?? {}).length > 0 && (
              <pre className="text-xs bg-[var(--surface-hover)] p-3 rounded-card overflow-x-auto mt-2 border border-[var(--border)]">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
