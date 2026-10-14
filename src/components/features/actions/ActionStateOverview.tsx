import Link from "next/link";
import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import {
  ACTION_STATE_LABELS,
  FINALIZADO_RESULT_LABELS,
  RADICADO_MILESTONE_LABELS,
  type RadicadoMilestone,
} from "@/core/types/actionState";
import type { ActionType, ActionTypeMilestone } from "@/core/entities/ActionType";
import { ResponseDeadline } from "@/components/features/actions/ResponseDeadline";
import { ActionLeaderPanel } from "@/components/features/actions/ActionLeaderPanel";
import { LegalDisclaimerBanner } from "@/components/legal/LegalDisclaimerBanner";
import { ShareBar } from "@/components/features/actions/ShareBar";
import { SignaturesListPanel } from "@/components/features/actions/SignaturesListPanel";
import type { ActionSignatureRow } from "@/core/repositories/IConstitutionalActionRepository";
import { ActionAuxLinks } from "@/components/features/actions/ActionAuxLinks";
import type { ConstitutionalActionPublic } from "@/core/entities/ConstitutionalAction";
export function ActionStateOverview({
  action,
  publicAction,
  isLeader,
  signatures,
  actionType,
  milestones = [],
  children,
}: {
  action: ConstitutionalAction;
  publicAction: ConstitutionalActionPublic | null;
  isLeader: boolean;
  signatures: ActionSignatureRow[];
  actionType?: ActionType | null;
  milestones?: ActionTypeMilestone[];
  children?: React.ReactNode;
}) {
  const milestoneCode = action.milestone_code ?? action.radicado_milestone ?? null;
  const milestoneLabel = milestoneCode
    ? milestones.find((m) => m.code === milestoneCode)?.label ??
      RADICADO_MILESTONE_LABELS[milestoneCode as RadicadoMilestone] ??
      milestoneCode
    : null;
  const count = action.signatures_count ?? signatures.length;
  const goal = action.target_count ?? action.minimum_required;
  const showShare =
    publicAction &&
    (action.state === "EN_FIRMA" || action.state === "EN_CREACION");
  const showLegal =
    action.state === "EN_CREACION" || action.state === "EN_FIRMA";
  const canDownloadSignedPdf =
    isLeader &&
    (action.state === "EN_FIRMA" ||
    action.state === "FIRMADO" ||
    action.state === "RADICADO" ||
    action.state === "APELADO" ||
    action.state === "EN_ESPERA_DE_OTRO_PROCESO" ||
    action.state === "FINALIZADO");

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-auto space-y-6 max-w-3xl">
      <div>
        <p className="text-sm text-[var(--muted)]">{ACTION_STATE_LABELS[action.state]}</p>
        {action.action_type && (
          <span className="ml-2 rounded-md bg-[var(--surface-hover)] px-2 py-1 text-xs font-medium">
            {action.action_type.name}
          </span>
        )}
        <span className="ml-2 rounded-md bg-[var(--surface-hover)] px-2 py-1 text-xs">
          {ACTION_STATE_LABELS[action.state]}
        </span>
        <h1 className="text-xl font-bold mt-2">{action.title}</h1>
        {action.summary && (
          <p className="text-sm text-[var(--muted)] mt-1">{action.summary}</p>
        )}
        {(action.state === "EN_FIRMA" || action.state === "FIRMADO") && (
          <p className="text-sm mt-2">
            <span className="font-bold text-[var(--accent)]">{count}</span>
            <span className="text-[var(--muted)]"> / {goal} firmas</span>
          </p>
        )}
        {milestoneLabel && (
          <p className="text-sm mt-2 text-[var(--muted)]">
            Hito: {milestoneLabel}
            {action.radicado_number ? ` · ${action.radicado_number}` : ""}
            {action.radicado_entity_name ? ` · ${action.radicado_entity_name}` : ""}
          </p>
        )}
        {action.finalizado_result && (
          <p className="text-sm mt-2 text-[var(--muted)]">
            Resultado: {FINALIZADO_RESULT_LABELS[action.finalizado_result]}
          </p>
        )}
      </div>

      {(action.state === "RADICADO" || action.state === "EN_ESPERA_DE_OTRO_PROCESO") && (
        <ResponseDeadline
          dueOn={action.response_due_on}
          milestoneCode={milestoneCode}
          businessDays={actionType?.response_business_days}
        />
      )}
      {showLegal && <LegalDisclaimerBanner />}
      {showShare && publicAction && <ShareBar action={publicAction} />}
      {isLeader && <ActionLeaderPanel action={action} milestones={milestones} />}
      {children}
      {canDownloadSignedPdf && (
        <a
          href={`/api/acciones/${action.id}/signed-pdf`}
          download
          className="inline-flex rounded-lg border border-[var(--accent)] text-[var(--accent)] px-4 py-2 text-sm font-semibold hover:bg-[var(--accent)]/10"
        >
          {action.state === "EN_FIRMA" ? "Descargar vista previa con firmas" : "Descargar documento firmado"}
        </a>
      )}
      {signatures.length > 0 && <SignaturesListPanel signatures={signatures} />}
      <ActionAuxLinks actionId={action.id} slug={action.slug} />
    </div>
  );
}
