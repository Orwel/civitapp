"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import type { FinalizadoResult } from "@/core/types/actionState";
import { FINALIZADO_RESULT_LABELS } from "@/core/types/actionState";
import type { ActionTypeMilestone } from "@/core/entities/ActionType";
import {
  publishActionAction,
  closeSignaturesAction,
  regenerateFinalDocumentAction,
  setMilestoneAction,
  transitionActionAction,
} from "@/app/(app)/dashboard/acciones/[id]/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LegalDisclaimerBanner } from "@/components/legal/LegalDisclaimerBanner";
import { getActionDashboardPath } from "@/lib/actionStateRoutes";
import type { ActionState } from "@/core/types/actionState";

function todayBogota(): string {
  return new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10);
}

export function ActionLeaderPanel({
  action,
  milestones = [],
}: {
  action: ConstitutionalAction;
  milestones?: ActionTypeMilestone[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [showRadicado, setShowRadicado] = useState(false);
  const [radicadoNumber, setRadicadoNumber] = useState("");
  const [radicadoEntity, setRadicadoEntity] = useState("");
  const [radicadoDate, setRadicadoDate] = useState(todayBogota());
  const currentMilestone = action.milestone_code ?? action.radicado_milestone ?? null;
  const [legalPublish, setLegalPublish] = useState(false);

  async function run(
    key: string,
    fn: () => Promise<{ error: string | null }>,
    nextState?: ActionState
  ) {
    setError(null);
    setLoading(key);
    const res = await fn();
    setLoading(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (nextState) {
      router.push(getActionDashboardPath(action.id, nextState));
      router.refresh();
      return;
    }
    router.refresh();
  }

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Acciones de líder</h3>
      {(action.state === "EN_CREACION" || action.state === "EN_FIRMA") && (
        <LegalDisclaimerBanner compact />
      )}

      {action.state === "EN_CREACION" && (
        <div className="space-y-2">
          <label className="flex gap-2 text-xs">
            <input
              type="checkbox"
              checked={legalPublish}
              onChange={(e) => setLegalPublish(e.target.checked)}
            />
            Confirmo revisión legal recomendada antes de publicar
          </label>
          <Button
            type="button"
            variant="accent"
            size="sm"
            disabled={loading !== null || !legalPublish}
            onClick={() =>
              run("publish", () => publishActionAction(action.id), "EN_FIRMA")
            }
          >
            {loading === "publish" ? "…" : "Publicar (abrir firmas)"}
          </Button>
        </div>
      )}

      {action.state === "EN_FIRMA" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() =>
            run("close", () => closeSignaturesAction(action.id), "FIRMADO")
          }
        >
          {loading === "close" ? "…" : "Cerrar recolección"}
        </Button>
      )}

      {action.state === "FIRMADO" && (
        <div className="space-y-2 rounded-lg border border-[var(--border)] p-3">
          <p className="text-xs font-semibold">Documento definitivo</p>
          {action.final_document_sha256 ? (
            <p className="text-[10px] font-mono text-[var(--muted)] break-all">
              SHA-256: {action.final_document_sha256}
            </p>
          ) : (
            <p className="text-xs text-[var(--muted)]">Aún no se ha generado.</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading !== null}
            onClick={() => run("regen", () => regenerateFinalDocumentAction(action.id))}
          >
            {loading === "regen" ? "Generando…" : action.final_document_sha256 ? "Regenerar documento" : "Generar documento"}
          </Button>
        </div>
      )}

      {action.state === "FIRMADO" && !showRadicado && (
        <Button type="button" variant="accent" size="sm" onClick={() => setShowRadicado(true)}>
          Registrar radicación
        </Button>
      )}

      {action.state === "FIRMADO" && showRadicado && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              "radicar",
              () =>
                transitionActionAction(action.id, "RADICADO", {
                  reason: "Radicación registrada",
                  radicado_number: radicadoNumber.trim() || undefined,
                  radicado_entity_name: radicadoEntity.trim() || undefined,
                  // Mediodía en Bogotá para que la fecha civil no cambie por zona horaria.
                  radicado_at: radicadoDate ? `${radicadoDate}T12:00:00-05:00` : undefined,
                }),
              "RADICADO"
            );
          }}
        >
          <input
            placeholder="Número de radicado"
            value={radicadoNumber}
            onChange={(e) => setRadicadoNumber(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            placeholder="Entidad (juzgado, autoridad, empresa…)"
            value={radicadoEntity}
            onChange={(e) => setRadicadoEntity(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <label className="block text-xs space-y-1">
            <span className="font-semibold">Fecha de radicación (cuenta el plazo desde el día hábil siguiente)</span>
            <input
              type="date"
              value={radicadoDate}
              max={todayBogota()}
              onChange={(e) => setRadicadoDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
          </label>
          <Button type="submit" size="sm" variant="accent" disabled={loading !== null}>
            {loading === "radicar" ? "…" : "Marcar radicada"}
          </Button>
        </form>
      )}

      {(action.state === "RADICADO" || action.state === "APELADO") && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--muted)]">Hitos del proceso</p>
          <p className="text-sm">
            Actual:{" "}
            {milestones.find((m) => m.code === currentMilestone)?.label ?? currentMilestone ?? "—"}
          </p>
          <div className="flex flex-wrap gap-1">
            {milestones.map((m) => (
              <button
                key={m.code}
                type="button"
                disabled={loading !== null || m.code === currentMilestone}
                onClick={() =>
                  run(`milestone-${m.code}`, () => setMilestoneAction(action.id, m.code))
                }
                className={`text-[10px] rounded border px-2 py-1 hover:bg-[var(--surface-hover)] ${
                  m.code === currentMilestone ? "border-[var(--accent)] font-semibold" : ""
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="accent"
            size="sm"
            disabled={loading !== null}
            onClick={() =>
              run(
                "finalize",
                () =>
                  transitionActionAction(action.id, "FINALIZADO", {
                    reason: "Cierre del proceso",
                    finalizado_result: "ARCHIVADA_SIN_DECISION" as FinalizadoResult,
                  }),
                "FINALIZADO"
              )
            }
          >
            {loading === "finalize" ? "…" : "Finalizar acción"}
          </Button>
          <details className="text-xs">
            <summary className="cursor-pointer text-[var(--muted)]">Resultado final específico</summary>
            <div className="flex flex-wrap gap-1 mt-2">
              {(Object.keys(FINALIZADO_RESULT_LABELS) as FinalizadoResult[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className="rounded border px-2 py-0.5"
                  onClick={() =>
                    run(
                      `fin-${r}`,
                      () =>
                        transitionActionAction(action.id, "FINALIZADO", {
                          finalizado_result: r,
                        }),
                      "FINALIZADO"
                    )
                  }
                >
                  {FINALIZADO_RESULT_LABELS[r]}
                </button>
              ))}
            </div>
          </details>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </Card>
  );
}
