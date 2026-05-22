import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/infrastructure/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("constitutional_actions_public")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${siteUrl}/acciones/${slug}`;

  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="civitapp-${slug}-qr.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
