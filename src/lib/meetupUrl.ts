export type MeetupMode = "PRESENCIAL" | "ONLINE" | "HIBRIDO";

export type OnlinePlatform = "zoom" | "meet" | "jitsi" | "teams" | null;

const PLATFORM_PATTERNS: { platform: OnlinePlatform; pattern: RegExp }[] = [
  { platform: "zoom", pattern: /^https?:\/\/([\w-]+\.)?zoom\.us\//i },
  { platform: "meet", pattern: /^https?:\/\/meet\.google\.com\//i },
  { platform: "jitsi", pattern: /^https?:\/\/([\w-]+\.)?meet\.jit\.si\//i },
  { platform: "teams", pattern: /^https?:\/\/([\w-]+\.)?(teams\.microsoft\.com|teams\.live\.com)\//i },
];

export function detectOnlinePlatform(url: string): OnlinePlatform {
  for (const { platform, pattern } of PLATFORM_PATTERNS) {
    if (pattern.test(url.trim())) return platform;
  }
  return null;
}

export function validateMeetupOnlineUrl(url: string): { ok: boolean; platform: OnlinePlatform; error?: string } {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, platform: null, error: "URL requerida" };
  try {
    new URL(trimmed);
  } catch {
    return { ok: false, platform: null, error: "URL inválida" };
  }
  const platform = detectOnlinePlatform(trimmed);
  if (!platform) {
    return {
      ok: false,
      platform: null,
      error: "Solo Zoom, Google Meet, Jitsi o Microsoft Teams",
    };
  }
  return { ok: true, platform };
}
