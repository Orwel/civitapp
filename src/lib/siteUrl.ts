/** Origen público estable (mismo valor en servidor y cliente para evitar hydration mismatch). */
export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function getPublicActionShareUrl(slug: string): string {
  return `${getSiteOrigin()}/acciones/${slug}`;
}
