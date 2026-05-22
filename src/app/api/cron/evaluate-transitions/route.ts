import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRepositories } from "@/infrastructure/repositories";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 });
  }

  const supabase = createClient(url, key);
  const repos = createRepositories(supabase);

  const { data: scheduled, error: e1 } = await supabase
    .from("constitutional_actions")
    .select("id")
    .eq("state", "EN_CREACION")
    .eq("publicacion_mode", "SCHEDULED")
    .not("publicacion_programada_at", "is", null);
  if (e1) {
    return NextResponse.json({ error: e1.message }, { status: 500 });
  }

  const { data: signing, error: e2 } = await supabase
    .from("constitutional_actions")
    .select("id")
    .eq("state", "EN_FIRMA")
    .not("firma_deadline_at", "is", null);
  if (e2) {
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  const ids = new Set([
    ...(scheduled ?? []).map((a) => a.id),
    ...(signing ?? []).map((a) => a.id),
  ]);

  for (const id of ids) {
    await repos.actions.evaluateTransitions(id);
  }

  return NextResponse.json({ evaluated: ids.size, action_ids: [...ids] });
}
