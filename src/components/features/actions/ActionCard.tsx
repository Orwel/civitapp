import Link from "next/link";
import type { ConstitutionalActionPublic } from "@/core/entities/ConstitutionalAction";
import { ACTION_STATE_LABELS } from "@/core/types/actionState";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function ActionCard({ action }: { action: ConstitutionalActionPublic }) {
  const count = action.signatures_count;
  const goal = action.target_count ?? action.minimum_required;
  const pct = goal > 0 ? Math.min(100, Math.round((count / goal) * 100)) : 0;
  const days = daysUntil(action.firma_deadline_at);
  const isUrgent =
    action.state === "EN_FIRMA" && days !== null && days <= 3 && days >= 0;
  const isNew =
    action.state === "EN_FIRMA" &&
    count < Math.min(10, action.minimum_required);

  return (
    <Card className="p-5 space-y-4" hover>
      {isUrgent && (
        <span className="inline-block rounded-md bg-red-950/80 text-red-200 text-[10px] font-bold uppercase tracking-wider px-2 py-1">
          Urgente · vence en {days} día{days === 1 ? "" : "s"}
        </span>
      )}
      {isNew && !isUrgent && (
        <span className="inline-block rounded-md bg-blue-950/80 text-blue-200 text-[10px] font-bold uppercase tracking-wider px-2 py-1">
          Nueva · recién publicada
        </span>
      )}
      <h3 className="font-display text-lg font-bold text-[var(--foreground)] leading-snug">
        {action.title}
      </h3>
      {action.summary && (
        <p className="text-xs text-[var(--muted)] line-clamp-2">{action.summary}</p>
      )}
      {action.state === "EN_FIRMA" && (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
            <span className="text-2xl font-bold text-[var(--accent)] tabular-nums">
              {count.toLocaleString("es-CO")}
            </span>
            <span className="text-xs text-[var(--muted)]">
              de {goal.toLocaleString("es-CO")} firmas
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden">
            <div className="h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <p className="text-xs text-[var(--muted)]">{ACTION_STATE_LABELS[action.state]}</p>
      <Link
        href={`/acciones/${action.slug}${action.state === "EN_FIRMA" ? "?firmar=1" : ""}`}
        className={cn(
          "block w-full text-center rounded-lg py-3 text-sm font-bold transition",
          action.state === "EN_FIRMA"
            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
            : "border border-[var(--accent)] text-[var(--accent)]"
        )}
      >
        {action.state === "EN_FIRMA" ? "✍️ Firmar esta acción" : "Ver acción"}
      </Link>
    </Card>
  );
}
