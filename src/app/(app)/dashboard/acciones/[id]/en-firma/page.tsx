import { notFound, redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";
import { getAction, getPublicActionBySlug } from "@/application/actions";
import { SignaturesListPanel } from "@/components/features/actions/SignaturesListPanel";
import { EnFirmaSignPanel } from "@/components/features/actions/EnFirmaSignPanel";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { getActionPdfSignedUrlAction } from "../editar/actions";
import { ensureActionStatePage } from "@/lib/ensureActionStatePage";
import { ActionLeaderPanel } from "@/components/features/actions/ActionLeaderPanel";
import { LegalDisclaimerBanner } from "@/components/legal/LegalDisclaimerBanner";
import { ShareBar } from "@/components/features/actions/ShareBar";
import { ActionAuxLinks } from "@/components/features/actions/ActionAuxLinks";

export default async function EnFirmaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/dashboard/acciones/${id}/en-firma`);

  const repos = createRepositories(supabase);
  const action = await getAction(repos, id);
  if (!action) notFound();
  ensureActionStatePage(action, "EN_FIRMA");

  const publicAction = await getPublicActionBySlug(repos, action.slug);
  const hasSigned = await repos.actions.hasSigned(id, user.id);
  const signatures = await repos.actions.listSignaturesForAction(id);
  const isLeader = user.id === action.created_by;

  const mySignature = hasSigned
    ? signatures.find((s) => s.signer_user_id === user.id) ?? null
    : null;

  const pdfPreview =
    action.content_mode === "PDF"
      ? await getActionPdfSignedUrlAction(id)
      : { url: null, error: null };

  const count = action.signatures_count ?? signatures.length;
  const goal = action.target_count ?? action.minimum_required;
  const pct = goal > 0 ? Math.min(100, Math.round((count / goal) * 100)) : 0;

  return (
    <div className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-3xl mx-auto px-4 py-6 lg:px-8 space-y-6">
        <header className="space-y-2 w-full">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            En firma
          </p>
          <h1 className="text-xl font-bold">{action.title}</h1>
          <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 w-full">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold text-[var(--accent)] tabular-nums">{count}</span>
              <span className="text-sm text-[var(--muted)]">de {goal} firmas</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden w-full">
              <div
                className="h-full bg-[var(--accent)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </header>

        <EnFirmaSignPanel
          actionId={id}
          hasSigned={hasSigned}
          mySignature={mySignature}
        />

        <section className="space-y-2 w-full">
          <h2 className="text-sm font-semibold">Documento</h2>
          {action.content_mode === "PDF" && pdfPreview.url ? (
            <PdfViewer url={pdfPreview.url} />
          ) : action.content_mode === "PDF" ? (
            <p className="text-sm text-[var(--muted)]">No hay PDF disponible.</p>
          ) : action.content_body ? (
            <div
              className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 max-h-[28rem] overflow-auto prose prose-sm dark:prose-invert max-w-none w-full"
              dangerouslySetInnerHTML={{ __html: action.content_body }}
            />
          ) : (
            <p className="text-sm text-[var(--muted)]">Sin contenido para mostrar.</p>
          )}
          {action.body_snapshot_sha256 && (
            <p className="text-[10px] font-mono text-[var(--muted)] break-all">
              Hash: {action.body_snapshot_sha256.slice(0, 32)}…
            </p>
          )}
        </section>

        <SignaturesListPanel signatures={signatures} highlightUserId={user.id} />

        <a
          href={`/api/acciones/${id}/signed-pdf`}
          download
          className="inline-flex rounded-lg border border-[var(--accent)] text-[var(--accent)] px-4 py-2 text-sm font-semibold hover:bg-[var(--accent)]/10"
        >
          Descargar PDF firmado
        </a>

        <details className="rounded-card border border-[var(--border)] p-4 w-full">
          <summary className="text-sm font-semibold cursor-pointer">Más opciones</summary>
          <div className="mt-4 space-y-4">
            <ActionAuxLinks actionId={id} slug={action.slug} />
            <LegalDisclaimerBanner compact />
            {publicAction && <ShareBar action={publicAction} />}
            {isLeader && <ActionLeaderPanel action={action} />}
          </div>
        </details>
      </div>
    </div>
  );
}
