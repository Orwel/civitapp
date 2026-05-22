import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getAction, getPublicActionBySlug } from "@/application/actions";
import { ActionEditorClient } from "@/components/features/actions/ActionEditorClient";
import { ShareBar } from "@/components/features/actions/ShareBar";
import { ActionAuxLinks } from "@/components/features/actions/ActionAuxLinks";
import { ensureActionStatePage } from "@/lib/ensureActionStatePage";
import { getCanonicalActionDashboardPath } from "@/lib/actionStateRoutes";

export default async function EnCreacionPage({
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
    redirect(`/login?redirect=/dashboard/acciones/${id}/en-creacion`);
  }

  const repos = createRepositories(supabase);
  const action = await getAction(repos, id);
  if (!action) notFound();
  ensureActionStatePage(action, "EN_CREACION");

  const publicAction = await getPublicActionBySlug(repos, action.slug);

  return (
    <div className="flex-1 overflow-auto px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <ActionAuxLinks actionId={id} slug={action.slug} />
        <Link
          href={getCanonicalActionDashboardPath(action)}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] block"
        >
          ← En creación
        </Link>
        <h1 className="font-display text-xl font-bold">Editar: {action.title}</h1>
        <p className="text-xs text-[var(--muted)]">
          Borrador colaborativo · un editor a la vez · comparte el link mientras redactas
        </p>
        {publicAction && <ShareBar action={publicAction} />}
        <ActionEditorClient action={action} initialPdfPreviewUrl={null} />
      </div>
    </div>
  );
}
