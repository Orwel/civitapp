import { Clock } from "lucide-react";
import { bogotaCivilDate, businessDaysUntil } from "@/lib/businessDays";

const CLOSED_MILESTONES = new Set(["RESPUESTA_DE_FONDO", "RESPONDIDA", "ARCHIVADA", "SENTENCIA"]);

function formatCivil(civil: string): string {
  return new Date(`${civil}T12:00:00Z`).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Término de respuesta en días hábiles desde la radicación. */
export function ResponseDeadline({
  dueOn,
  milestoneCode,
  businessDays,
}: {
  dueOn: string | null | undefined;
  milestoneCode?: string | null;
  businessDays?: number | null;
}) {
  if (!dueOn) return null;
  const answered = milestoneCode ? CLOSED_MILESTONES.has(milestoneCode) : false;
  const left = businessDaysUntil(bogotaCivilDate(new Date()), dueOn);
  const overdue = left < 0;

  const tone = answered
    ? "border-[var(--border)] bg-[var(--surface)]"
    : overdue
      ? "border-red-600/50 bg-red-500/10"
      : left <= 3
        ? "border-amber-500/60 bg-amber-500/10"
        : "border-[var(--accent)]/40 bg-[var(--accent)]/5";

  return (
    <div className={`rounded-card border p-4 flex gap-3 items-start ${tone}`}>
      <Clock className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold">
          {answered
            ? "La entidad ya respondió"
            : overdue
              ? `Plazo vencido hace ${Math.abs(left)} día${Math.abs(left) === 1 ? "" : "s"} hábil${Math.abs(left) === 1 ? "" : "es"}`
              : left === 0
                ? "Hoy vence el plazo de respuesta"
                : `Faltan ${left} día${left === 1 ? "" : "s"} hábil${left === 1 ? "" : "es"} para la respuesta`}
        </p>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          {businessDays ? `Término de ${businessDays} días hábiles. ` : ""}
          Vence el {formatCivil(dueOn)}.
        </p>
      </div>
    </div>
  );
}
