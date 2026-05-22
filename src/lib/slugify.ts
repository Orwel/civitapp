export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uniqueSlug(base: string, suffix?: string): string {
  const s = slugify(base) || "accion";
  const tail = suffix ?? Math.random().toString(36).slice(2, 8);
  return `${s}-${tail}`;
}
