import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_BUCKETS = ["identity_documents", "profiles", "action_documents"] as const;

/** Parsea "bucket/path/to/file" o usa el path completo en buckets conocidos. */
export function parseStoragePath(storagePath: string): { bucket: string; path: string } | null {
  const trimmed = storagePath.trim();
  if (!trimmed) return null;
  const slash = trimmed.indexOf("/");
  if (slash > 0) {
    const bucket = trimmed.slice(0, slash);
    const path = trimmed.slice(slash + 1);
    if (bucket && path) return { bucket, path };
  }
  return null;
}

export async function downloadSignatureImageBytes(
  supabase: SupabaseClient,
  storagePath: string
): Promise<Uint8Array | null> {
  const parsed = parseStoragePath(storagePath);
  const attempts: { bucket: string; path: string }[] = [];

  if (parsed) {
    attempts.push(parsed);
  } else {
    for (const bucket of DEFAULT_BUCKETS) {
      attempts.push({ bucket, path: storagePath });
    }
  }

  for (const { bucket, path } of attempts) {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (!error && data) {
      const buf = await data.arrayBuffer();
      return new Uint8Array(buf);
    }
  }

  return null;
}
