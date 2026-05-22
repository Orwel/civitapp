import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";

export const runtime = "nodejs";

export default async function DashboardAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  return <>{children}</>;
}
