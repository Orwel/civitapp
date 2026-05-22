import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getCanonicalActionDashboardPath } from "@/lib/actionStateRoutes";

export default async function ShortActionLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const repos = createRepositories(supabase);
    const action = await repos.actions.getBySlug(slug);
    if (action) {
      const { data: role } = await supabase
        .from("constitutional_action_roles")
        .select("role")
        .eq("action_id", action.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (role) {
        redirect(getCanonicalActionDashboardPath(action));
      }
    }
  }

  redirect(`/acciones/${slug}`);
}
