import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getAction } from "@/application/actions";
import { templateForAction } from "@/application/actions/templates";
import { TemplateWizard } from "@/components/features/templates/TemplateWizard";
import { ensureActionStatePage } from "@/lib/ensureActionStatePage";
import { getActionDashboardPath } from "@/lib/actionStateRoutes";

export default async function PlantillaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/dashboard/acciones/${id}/plantilla`);
  }

  const repos = createRepositories(supabase);
  const action = await getAction(repos, id);
  if (!action) notFound();
  ensureActionStatePage(action, "EN_CREACION");

  const t = templateForAction(action);
  if (!t) redirect(getActionDashboardPath(id, "EN_CREACION"));

  return (
    <div className="flex-1 overflow-auto px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <Link
          href={getActionDashboardPath(id, "EN_CREACION")}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] block"
        >
          ← Editor del documento
        </Link>
        <TemplateWizard
          actionId={id}
          actionTitle={action.title}
          templateSlug={t.stored.slug}
          templateVersion={t.stored.version}
          initialAnswers={t.stored.answers}
          initialBodyEdited={t.stored.body_edited}
        />
      </div>
    </div>
  );
}
