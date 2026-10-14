/**
 * Genera el bloque INSERT de festivos para `co_holidays`.
 * Uso: npx tsx scripts/generate-co-holidays.ts 2025 2030
 */
import { colombianHolidays } from "../src/lib/businessDays";

const [from = "2025", to = "2030"] = process.argv.slice(2);
const rows: string[] = [];
for (let y = Number(from); y <= Number(to); y++) {
  const seen = new Set<string>();
  for (const h of colombianHolidays(y)) {
    if (seen.has(h.date)) continue;
    seen.add(h.date);
    rows.push(`  ('${h.date}', '${h.name.replace(/'/g, "''")}')`);
  }
}
console.log(`INSERT INTO co_holidays (holiday_date, name) VALUES\n${rows.join(",\n")}\nON CONFLICT (holiday_date) DO NOTHING;`);
