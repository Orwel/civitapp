export const MIN_FIRMA_DEADLINE_DAYS = 5;

/** Valor mínimo para input datetime-local (ahora + N días). */
export function minDeadlineLocalInput(): string {
  const d = new Date();
  d.setDate(d.getDate() + MIN_FIRMA_DEADLINE_DAYS);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isDeadlineAtLeastMinDays(isoOrLocal: string): boolean {
  const chosen = new Date(isoOrLocal);
  const min = new Date();
  min.setDate(min.getDate() + MIN_FIRMA_DEADLINE_DAYS);
  min.setSeconds(0, 0);
  return chosen >= min;
}
