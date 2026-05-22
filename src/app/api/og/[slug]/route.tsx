import { ImageResponse } from "next/og";
import { createClient } from "@/infrastructure/supabase/server";
import { ACTION_STATE_LABELS } from "@/core/types/actionState";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: action } = await supabase
    .from("constitutional_actions_public")
    .select("title, state, signatures_count, minimum_required, target_count")
    .eq("slug", slug)
    .maybeSingle();

  const title = action?.title ?? "Acción constitucional";
  const state = action ? ACTION_STATE_LABELS[action.state as keyof typeof ACTION_STATE_LABELS] : "";
  const count = action?.signatures_count ?? 0;
  const goal = action?.target_count ?? action?.minimum_required ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 48,
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.8, marginBottom: 16 }}>Civitapp</div>
        <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.2, marginBottom: 24 }}>
          {title.length > 80 ? `${title.slice(0, 77)}…` : title}
        </div>
        {action && (
          <>
            <div style={{ fontSize: 24, opacity: 0.9 }}>{state}</div>
            {action.state === "EN_FIRMA" && (
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 16, color: "#60a5fa" }}>
                {count.toLocaleString("es-CO")} / {goal.toLocaleString("es-CO")} firmas
              </div>
            )}
          </>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
