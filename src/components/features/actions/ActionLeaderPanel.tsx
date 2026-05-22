"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ConstitutionalAction } from "@/core/entities/ConstitutionalAction";
import type { RadicadoMilestone, FinalizadoResult } from "@/core/types/actionState";
import { RADICADO_MILESTONE_LABELS, FINALIZADO_RESULT_LABELS } from "@/core/types/actionState";
import {
  publishActionAction,
  closeSignaturesAction,
  transitionActionAction,
} from "@/app/(app)/dashboard/acciones/[id]/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LegalDisclaimerBanner } from "@/components/legal/LegalDisclaimerBanner";
import { getActionDashboardPath } from "@/lib/actionStateRoutes";
import type { ActionState } from "@/core/types/actionState";

const MILESTONE_ORDER: RadicadoMilestone[] = [
  "RECIBIDA",
  "ADMITIDA",
  "INADMITIDA",
  "EN_TRASLADO",
  "EN_PRUEBAS",
  "EN_AUDIENCIA",
  "EN_DECISION",
  "SENTENCIA",
];

export function ActionLeaderPanel({ action }: { action: ConstitutionalAction }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [showRadicado, setShowRadicado] = useState(false);
  const [radicadoNumber, setRadicadoNumber] = useState("");
  const [radicadoEntity, setRadicadoEntity] = useState("");
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

      {action.state === "FIRMADO" && !showRadicado && (
        <Button type="button" variant="accent" size="sm" onClick={() => setShowRadicado(true)}>
          Activar radicación
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
                  radicado_milestone: "RECIBIDA",
                  radicado_number: radicadoNumber.trim() || undefined,
                  radicado_entity_name: radicadoEntity.trim() || undefined,
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
            placeholder="Entidad (juzgado, autoridad…)"
            value={radicadoEntity}
            onChange={(e) => setRadicadoEntity(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
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
            {action.radicado_milestone
              ? RADICADO_MILESTONE_LABELS[action.radicado_milestone]
              : "—"}
          </p>
          <div className="flex flex-wrap gap-1">
            {MILESTONE_ORDER.map((m) => (
              <button
                key={m}
                type="button"
                disabled={loading !== null}
                onClick={() =>
                  run(`milestone-${m}`, () =>
                    transitionActionAction(action.id, action.state, {
                      reason: `Hito: ${m}`,
                      radicado_milestone: m,
                    })
                  )
                }
                className="text-[10px] rounded border px-2 py-1 hover:bg-[var(--surface-hover)]"
              >
                {RADICADO_MILESTONE_LABELS[m]}
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
