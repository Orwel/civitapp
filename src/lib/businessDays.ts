/**
 * Días hábiles en Colombia (Ley 51 de 1983, "Ley Emiliani").
 * Fuente única para la UI; la migración 036 siembra `co_holidays` con estas mismas fechas
 * (generadas con `scripts/generate-co-holidays.ts`).
 */

const MS_PER_DAY = 86_400_000;

/** Fecha civil (sin hora) como "YYYY-MM-DD". */
export type CivilDate = string;

function toCivil(d: Date): CivilDate {
  return d.toISOString().slice(0, 10);
}

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * MS_PER_DAY);
}

/** Domingo de Pascua (algoritmo anónimo gregoriano). */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month, day);
}

/** Traslada al lunes siguiente si no cae en lunes. */
function nextMonday(d: Date): Date {
  const dow = d.getUTCDay();
  return dow === 1 ? d : addDays(d, (8 - dow) % 7);
}

export function colombianHolidays(year: number): { date: CivilDate; name: string }[] {
  const easter = easterSunday(year);
  const list: { date: Date; name: string }[] = [
    { date: utcDate(year, 1, 1), name: "Año Nuevo" },
    { date: nextMonday(utcDate(year, 1, 6)), name: "Reyes Magos" },
    { date: nextMonday(utcDate(year, 3, 19)), name: "San José" },
    { date: addDays(easter, -3), name: "Jueves Santo" },
    { date: addDays(easter, -2), name: "Viernes Santo" },
    { date: utcDate(year, 5, 1), name: "Día del Trabajo" },
    { date: addDays(easter, 43), name: "Ascensión del Señor" },
    { date: addDays(easter, 64), name: "Corpus Christi" },
    { date: addDays(easter, 71), name: "Sagrado Corazón" },
    { date: nextMonday(utcDate(year, 6, 29)), name: "San Pedro y San Pablo" },
    { date: utcDate(year, 7, 20), name: "Independencia" },
    { date: utcDate(year, 8, 7), name: "Batalla de Boyacá" },
    { date: nextMonday(utcDate(year, 8, 15)), name: "Asunción de la Virgen" },
    { date: nextMonday(utcDate(year, 10, 12)), name: "Día de la Raza" },
    { date: nextMonday(utcDate(year, 11, 1)), name: "Todos los Santos" },
    { date: nextMonday(utcDate(year, 11, 11)), name: "Independencia de Cartagena" },
    { date: utcDate(year, 12, 8), name: "Inmaculada Concepción" },
    { date: utcDate(year, 12, 25), name: "Navidad" },
  ];
  return list
    .map((h) => ({ date: toCivil(h.date), name: h.name }))
    .sort((x, y) => x.date.localeCompare(y.date));
}

const holidayCache = new Map<number, Set<CivilDate>>();

function holidaySet(year: number): Set<CivilDate> {
  let set = holidayCache.get(year);
  if (!set) {
    set = new Set(colombianHolidays(year).map((h) => h.date));
    holidayCache.set(year, set);
  }
  return set;
}

export function isBusinessDay(civil: CivilDate): boolean {
  const d = new Date(`${civil}T00:00:00Z`);
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !holidaySet(d.getUTCFullYear()).has(civil);
}

/** Fecha civil en Bogotá (UTC-5, sin horario de verano). */
export function bogotaCivilDate(instant: Date | string): CivilDate {
  const t = typeof instant === "string" ? new Date(instant) : instant;
  return toCivil(new Date(t.getTime() - 5 * 3_600_000));
}

/**
 * Último día del término: el término empieza a contar el día hábil siguiente a la radicación
 * (art. 14 Ley 1437/2011 sustituido por Ley 1755/2015; art. 62 Ley 4/1913).
 */
export function addBusinessDays(fromCivil: CivilDate, days: number): CivilDate {
  let d = new Date(`${fromCivil}T00:00:00Z`);
  let remaining = days;
  while (remaining > 0) {
    d = addDays(d, 1);
    if (isBusinessDay(toCivil(d))) remaining -= 1;
  }
  return toCivil(d);
}

/** Días hábiles que faltan desde hoy (exclusivo) hasta el vencimiento (inclusivo). Negativo si venció. */
export function businessDaysUntil(todayCivil: CivilDate, dueCivil: CivilDate): number {
  if (todayCivil === dueCivil) return 0;
  const forward = todayCivil < dueCivil;
  let d = new Date(`${forward ? todayCivil : dueCivil}T00:00:00Z`);
  const end = forward ? dueCivil : todayCivil;
  let count = 0;
  while (toCivil(d) < end) {
    d = addDays(d, 1);
    if (isBusinessDay(toCivil(d))) count += 1;
  }
  return forward ? count : -count;
}
