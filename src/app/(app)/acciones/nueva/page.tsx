"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/client";
import { createRepositories } from "@/infrastructure/repositories";
import type { ActionType } from "@/core/entities/ActionType";
import type { ActionContentMode } from "@/core/types/actionState";
import { LegalDisclaimerBanner } from "@/components/legal/LegalDisclaimerBanner";
import {
  ACTION_DOCUMENTS_BUCKET,
  draftPdfStoragePath,
} from "@/lib/actionDocuments";
import { getActionDashboardPath } from "@/lib/actionStateRoutes";
import { createWizardActionAction, finalizeWizardPdfAction } from "./actions";
import {
  MIN_FIRMA_DEADLINE_DAYS,
  minDeadlineLocalInput,
  isDeadlineAtLeastMinDays,
} from "@/lib/actionDeadline";

const WIZARD_STORAGE_KEY = "civitapp:nueva-accion-wizard";
const MAX_PDF_BYTES = 15 * 1024 * 1024;

type DraftCollab = "OPEN_AUTH" | "OPEN_INVITED";
type CloseRule = "DEADLINE_WINS" | "QUORUM_OR_DEADLINE" | "QUORUM_ONLY";

interface WizardDraft {
  step: number;
  actionTypeId: string;
  title: string;
  summary: string;
  minimumRequired: number;
  draftCollab: DraftCollab;
  contentMode: ActionContentMode;
  closeRule: CloseRule;
  deadline: string;
  legalAccepted: boolean;
  clientRequestId?: string;
}

function loadWizardDraft(): Partial<WizardDraft> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<WizardDraft>;
  } catch {
    return null;
  }
}

function saveWizardDraft(draft: WizardDraft) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

function clearWizardDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(WIZARD_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export default function NuevaAccionPage() {
  const [step, setStep] = useState(1);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [actionTypeId, setActionTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [minimumRequired, setMinimumRequired] = useState(10);
  const [draftCollab, setDraftCollab] = useState<DraftCollab>("OPEN_INVITED");
  const [contentMode, setContentMode] = useState<ActionContentMode>("TEXT");
  const [closeRule, setCloseRule] = useState<CloseRule>("QUORUM_OR_DEADLINE");
  const [deadline, setDeadline] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [clientRequestId, setClientRequestId] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  const persist = useCallback(() => {
    if (!hydrated) return;
    saveWizardDraft({
      step,
      actionTypeId,
      title,
      summary,
      minimumRequired,
      draftCollab,
      contentMode,
      closeRule,
      deadline,
      legalAccepted,
      clientRequestId,
    });
  }, [
    hydrated,
    step,
    actionTypeId,
    title,
    summary,
    minimumRequired,
    draftCollab,
    contentMode,
    closeRule,
    deadline,
    legalAccepted,
    clientRequestId,
  ]);

  useEffect(() => {
    const saved = loadWizardDraft();
    if (saved) {
      if (saved.step) setStep(saved.step);
      if (saved.actionTypeId) setActionTypeId(saved.actionTypeId);
      if (saved.title) setTitle(saved.title);
      if (saved.summary) setSummary(saved.summary);
      if (saved.minimumRequired) setMinimumRequired(saved.minimumRequired);
      if (saved.draftCollab) setDraftCollab(saved.draftCollab);
      if (saved.contentMode) setContentMode(saved.contentMode);
      if (saved.closeRule) setCloseRule(saved.closeRule);
      if (saved.deadline) setDeadline(saved.deadline);
      if (saved.legalAccepted) setLegalAccepted(saved.legalAccepted);
      if (saved.clientRequestId) setClientRequestId(saved.clientRequestId);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    persist();
  }, [persist]);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const repos = createRepositories(supabase);
        const types = await repos.catalog.getActionTypes();
        setActionTypes(types);
        if (types.length > 0) {
          setActionTypeId((prev) => prev || types[0].id);
        }
      } catch {
        setError("No se pudieron cargar los tipos de acción.");
      }
    }
    load();
  }, []);

  function validateStep3(): string | null {
    if (closeRule === "QUORUM_ONLY") return null;
    if (!deadline) return "Indica la fecha límite de firmas.";
    if (!isDeadlineAtLeastMinDays(deadline)) {
      return `La fecha límite debe ser al menos ${MIN_FIRMA_DEADLINE_DAYS} días después de hoy.`;
    }
    return null;
  }

  function ensureClientRequestId(): string {
    if (clientRequestId) return clientRequestId;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setClientRequestId(id);
    return id;
  }

  function goToStep(next: number) {
    setError(null);
    if (next === 4) {
      const err = validateStep3();
      if (err) {
        setError(err);
        return;
      }
      ensureClientRequestId();
    }
    setStep(next);
  }

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading) return;
    setError(null);
    if (!legalAccepted) {
      setError("Debes aceptar el aviso de responsabilidad legal.");
      return;
    }
    const step3Err = validateStep3();
    if (step3Err) {
      setError(step3Err);
      setStep(3);
      return;
    }
    if (contentMode === "PDF") {
      if (!pdfFile) {
        setError("Selecciona el archivo PDF antes de crear la acción.");
        return;
      }
      if (pdfFile.type !== "application/pdf") {
        setError("Solo se permiten archivos PDF.");
        return;
      }
      if (pdfFile.size > MAX_PDF_BYTES) {
        setError("El PDF no puede superar 15 MB.");
        return;
      }
    }

    const requestId = ensureClientRequestId();
    setLoading(true);
    try {
      const res = await createWizardActionAction({
        action_type_id: actionTypeId,
        title: title.trim(),
        summary: summary.trim() || null,
        minimum_required: minimumRequired,
        draft_collaboration: draftCollab,
        content_mode: contentMode,
        signature_close_rule: closeRule,
        firma_deadline_at:
          closeRule !== "QUORUM_ONLY" && deadline
            ? new Date(deadline).toISOString()
            : null,
        legal_accepted: legalAccepted,
        client_request_id: requestId,
      });

      if (res.error || !res.actionId) {
        setError(res.error ?? "Error al crear la acción");
        return;
      }

      const actionId = res.actionId;

      if (contentMode === "PDF" && pdfFile) {
        const supabase = createClient();
        const path = draftPdfStoragePath(actionId);
        const { error: uploadError } = await supabase.storage
          .from(ACTION_DOCUMENTS_BUCKET)
          .upload(path, pdfFile, { upsert: true, contentType: "application/pdf" });

        if (uploadError) {
          setError(uploadError.message);
          return;
        }

        const fin = await finalizeWizardPdfAction(actionId, path);
        if (fin.error) {
          setError(fin.error);
          return;
        }

        clearWizardDraft();
        router.replace(getActionDashboardPath(actionId, "EN_FIRMA"));
        return;
      }

      clearWizardDraft();
      router.replace(getActionDashboardPath(actionId, "EN_CREACION"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la acción");
    } finally {
      setLoading(false);
    }
  }

  const minDeadline = minDeadlineLocalInput();

  return (
    <div className="flex-1 overflow-auto px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Nueva acción constitucional</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Paso {step} de 4 · tu progreso se guarda en esta pestaña
          </p>
        </div>

        {error && step !== 4 && (
          <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3">
            {error}
          </p>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="tipo" className="block text-sm font-semibold mb-1">
                Tipo de acción
              </label>
              <select
                id="tipo"
                value={actionTypeId}
                onChange={(e) => setActionTypeId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                {actionTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-semibold mb-1">
                Título
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="summary" className="block text-sm font-semibold mb-1">
                Resumen
              </label>
              <textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={!title.trim()}
              onClick={() => goToStep(2)}
              className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-foreground)] disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold">¿Cómo será el documento?</p>
            <label className="flex gap-3 p-3 rounded-card border cursor-pointer has-[:checked]:border-[var(--accent)]">
              <input
                type="radio"
                name="contentMode"
                checked={contentMode === "TEXT"}
                onChange={() => setContentMode("TEXT")}
              />
              <span className="text-sm">
                <strong>Redactar en Civitapp</strong> — editor de texto enriquecido (HTML).
              </span>
            </label>
            <label className="flex gap-3 p-3 rounded-card border cursor-pointer has-[:checked]:border-[var(--accent)]">
              <input
                type="radio"
                name="contentMode"
                checked={contentMode === "PDF"}
                onChange={() => setContentMode("PDF")}
              />
              <span className="text-sm">
                <strong>Subir PDF ya listo</strong> — archivo externo al bucket privado (máx. 15 MB).
              </span>
            </label>

            <p className="text-sm font-semibold pt-2">¿Quién puede editar el borrador?</p>
            <label className="flex gap-3 p-3 rounded-card border cursor-pointer has-[:checked]:border-[var(--accent)]">
              <input
                type="radio"
                name="collab"
                checked={draftCollab === "OPEN_AUTH"}
                onChange={() => setDraftCollab("OPEN_AUTH")}
              />
              <span className="text-sm">
                <strong>Máxima colaboración</strong> — cualquier usuario registrado puede aportar
                (un editor a la vez).
              </span>
            </label>
            <label className="flex gap-3 p-3 rounded-card border cursor-pointer has-[:checked]:border-[var(--accent)]">
              <input
                type="radio"
                name="collab"
                checked={draftCollab === "OPEN_INVITED"}
                onChange={() => setDraftCollab("OPEN_INVITED")}
              />
              <span className="text-sm">
                <strong>Solo invitados</strong> — personas con rol en el equipo.
              </span>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => goToStep(1)} className="rounded-lg border px-4 py-2 text-sm">
                Atrás
              </button>
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-foreground)]"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="minimum" className="block text-sm font-semibold mb-1">
                Firmas mínimas
              </label>
              <input
                id="minimum"
                type="number"
                min={1}
                value={minimumRequired}
                onChange={(e) => setMinimumRequired(Number(e.target.value))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="closeRule" className="block text-sm font-semibold mb-1">
                Regla de cierre
              </label>
              <select
                id="closeRule"
                value={closeRule}
                onChange={(e) => setCloseRule(e.target.value as CloseRule)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="QUORUM_OR_DEADLINE">Al alcanzar mínimo o en fecha límite</option>
                <option value="DEADLINE_WINS">Siempre en fecha límite (si hay quorum)</option>
                <option value="QUORUM_ONLY">Sin fecha — al alcanzar mínimo</option>
              </select>
            </div>
            {closeRule !== "QUORUM_ONLY" && (
              <div>
                <label htmlFor="deadline" className="block text-sm font-semibold mb-1">
                  Fecha límite de firmas
                </label>
                <input
                  id="deadline"
                  type="datetime-local"
                  min={minDeadline}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  Mínimo {MIN_FIRMA_DEADLINE_DAYS} días desde hoy (hora Colombia del dispositivo).
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => goToStep(2)} className="rounded-lg border px-4 py-2 text-sm">
                Atrás
              </button>
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-foreground)]"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <form className="space-y-4" onSubmit={(e) => void handleCreate(e)}>
            <LegalDisclaimerBanner legalLinkNewTab />
            {contentMode === "PDF" && (
              <div className="rounded-card border border-[var(--border)] p-4 space-y-2">
                <p className="text-sm font-semibold">Documento PDF</p>
                <p className="text-xs text-[var(--muted)]">
                  Sube el escrito listo (máx. 15 MB). Al crear, la acción quedará en recolección de
                  firmas sin pasar por el editor.
                </p>
                <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] p-6 cursor-pointer hover:border-[var(--accent)]">
                  <span className="text-sm font-semibold">
                    {pdfFile ? pdfFile.name : "Seleccionar PDF"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    disabled={loading}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setPdfFile(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            )}
            <label className="flex gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                className="mt-0.5 shrink-0"
              />
              <span>
                Entiendo que Civitapp no sustituye asesoría legal profesional y que debo contar con
                revisión jurídica antes de publicar para firmas.
              </span>
            </label>
            {error && (
              <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="rounded-lg border px-4 py-2 text-sm"
                disabled={loading}
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  !legalAccepted ||
                  (contentMode === "PDF" && !pdfFile)
                }
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-foreground)] disabled:opacity-50"
              >
                {loading
                  ? "Creando…"
                  : contentMode === "PDF"
                    ? "Crear y abrir firmas"
                    : "Crear y abrir editor"}
              </button>
            </div>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            clearWizardDraft();
            router.push("/acciones");
          }}
          className="text-sm text-[var(--muted)] hover:underline block text-left"
        >
          Cancelar y descartar borrador del asistente
        </button>
      </div>
    </div>
  );
}
