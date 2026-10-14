"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  TemplateAnswers,
  TemplateClause,
  TemplateDefinition,
  TemplateField,
} from "@/core/templates/types";
import {
  getPath,
  isFieldVisible,
  list,
  setPath,
  validateTemplate,
} from "@/core/templates/evaluate";
import { getTemplate } from "@/lib/templates/catalog";
import { renderTemplate } from "@/lib/templates/render";
import { LegalDisclaimerBanner } from "@/components/legal/LegalDisclaimerBanner";
import { getActionDashboardPath } from "@/lib/actionStateRoutes";
import { saveTemplateAnswersAction } from "@/app/(app)/dashboard/acciones/[id]/plantilla/actions";
import {
  acquireEditLockAction,
  heartbeatEditLockAction,
  releaseEditLockAction,
} from "@/app/(app)/dashboard/acciones/[id]/editar/actions";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm disabled:opacity-60";

const previewClass =
  "text-sm leading-relaxed [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:font-bold [&_h3]:text-[var(--foreground)] [&_p]:my-2 [&_p]:text-justify [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function TemplateWizard({
  actionId,
  actionTitle,
  templateSlug,
  templateVersion,
  initialAnswers,
  initialBodyEdited,
}: {
  actionId: string;
  actionTitle: string;
  templateSlug: string;
  templateVersion: number;
  initialAnswers: TemplateAnswers;
  initialBodyEdited: boolean;
}) {
  const def = useMemo(
    () => getTemplate(templateSlug, templateVersion),
    [templateSlug, templateVersion]
  );
  const router = useRouter();
  const [answers, setAnswers] = useState<TemplateAnswers>(initialAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [bodyEdited, setBodyEdited] = useState(initialBodyEdited);
  const [canEdit, setCanEdit] = useState(false);
  const [lockHolder, setLockHolder] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<TemplateAnswers | null>(null);

  // ---------- Lock de edición (compartido con el editor de texto) ----------
  const tryAcquire = useCallback(async () => {
    const res = await acquireEditLockAction(actionId);
    setCanEdit(res.granted);
    setLockHolder(res.granted ? null : res.holder_name ?? "Otro usuario");
  }, [actionId]);

  useEffect(() => {
    void tryAcquire();
    return () => {
      void releaseEditLockAction(actionId);
    };
  }, [actionId, tryAcquire]);

  useEffect(() => {
    if (!canEdit) return;
    const id = setInterval(() => void heartbeatEditLockAction(actionId), 10000);
    return () => clearInterval(id);
  }, [canEdit, actionId]);

  // ---------- Autosave ----------
  const flush = useCallback(
    async (overwriteEdited = false) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const next = pendingRef.current;
      if (!next && !overwriteEdited) return true;
      pendingRef.current = null;
      setSaveStatus("saving");
      const res = await saveTemplateAnswersAction(actionId, next ?? answers, {
        overwriteEdited,
      });
      if (res.error) {
        setSaveStatus("error");
        setSaveError(res.error);
        return false;
      }
      if (overwriteEdited && res.bodyUpdated) setBodyEdited(false);
      setSaveError(null);
      setSaveStatus("saved");
      return true;
    },
    [actionId, answers]
  );

  const update = useCallback(
    (path: string, value: unknown) => {
      if (!canEdit) return;
      setAnswers((prev) => {
        const next = setPath(prev, path, value);
        pendingRef.current = next;
        return next;
      });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => void flush(), 1200);
    },
    [canEdit, flush]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const preview = useMemo(() => (def ? renderTemplate(def, answers) : ""), [def, answers]);
  const issues = useMemo(() => (def ? validateTemplate(def, answers) : []), [def, answers]);

  if (!def) {
    return (
      <p className="text-sm text-red-600">
        La plantilla «{templateSlug}» v{templateVersion} ya no está disponible.
      </p>
    );
  }

  const steps = def.steps;
  const isReview = stepIndex === steps.length;
  const step = steps[stepIndex];
  const blocking = issues.filter((i) => i.level === "blocking");
  const warnings = issues.filter((i) => i.level === "warning");

  function goTo(index: number) {
    setStepIndex(Math.max(0, Math.min(steps.length, index)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function continueToEditor() {
    const ok = await flush();
    if (ok) router.push(getActionDashboardPath(actionId, "EN_CREACION"));
  }

  async function regenerate() {
    if (
      !window.confirm(
        "Se reemplazará el texto del documento con lo que generen tus respuestas. Las ediciones manuales se perderán (quedan en el historial de revisiones). ¿Continuar?"
      )
    ) {
      return;
    }
    pendingRef.current = answers;
    await flush(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Plantilla guiada · {def.name}
          </p>
          <h1 className="font-display text-xl font-bold">{actionTitle}</h1>
        </div>
        <p className="text-xs text-[var(--muted)]" aria-live="polite">
          {!canEdit
            ? "Solo lectura"
            : saveStatus === "saving"
              ? "Guardando…"
              : saveStatus === "saved"
                ? "Guardado"
                : saveStatus === "error"
                  ? "Error al guardar"
                  : "Los cambios se guardan solos"}
        </p>
      </div>

      <LegalDisclaimerBanner compact />

      {!canEdit && (
        <div className="rounded-card border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <strong>{lockHolder ?? "Otro usuario"}</strong> está editando este borrador. Solo lectura
          por ahora.{" "}
          <button type="button" className="underline font-semibold" onClick={() => void tryAcquire()}>
            Reintentar
          </button>
        </div>
      )}

      {saveError && (
        <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3">
          {saveError}
        </p>
      )}

      {bodyEdited && (
        <div className="rounded-card border border-amber-500/30 bg-amber-500/10 p-4 text-sm space-y-2">
          <p>
            Editaste el documento a mano en el editor. Tus respuestas se guardan, pero{" "}
            <strong>no cambian el texto</strong> hasta que lo regeneres.
          </p>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => void regenerate()}
            className="rounded-lg border border-amber-600/50 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            Regenerar documento desde las respuestas
          </button>
        </div>
      )}

      {/* Navegación de pasos */}
      <nav aria-label="Pasos" className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {[...steps.map((s) => s.title), "Revisión"].map((title, i) => {
          const stepId = steps[i]?.id;
          const stepBlocking = stepId ? blocking.filter((b) => b.step === stepId).length : 0;
          const active = i === stepIndex;
          return (
            <button
              key={title}
              type="button"
              onClick={() => goTo(i)}
              aria-current={active ? "step" : undefined}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                active
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {i + 1}. {title.length > 28 ? `${title.slice(0, 26)}…` : title}
              {stepBlocking > 0 && !active && (
                <span className="ml-1 text-red-500" aria-label={`${stepBlocking} pendientes`}>
                  •
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Formulario */}
        <div className="space-y-5 min-w-0">
          {isReview ? (
            <ReviewPanel
              blocking={blocking}
              warnings={warnings}
              steps={steps.map((s) => s.id)}
              onGoTo={goTo}
            />
          ) : (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">{step.title}</h2>
                {step.description && (
                  <p className="text-sm text-[var(--muted)] mt-1">{step.description}</p>
                )}
              </div>
              {step.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  root={answers}
                  scope={answers}
                  path={field.key}
                  clauses={def.clauses}
                  disabled={!canEdit}
                  onChange={update}
                  placeholderOverride={
                    field.key === "juez_competente"
                      ? String(def.derive?.(answers, def.clauses).juez_sugerido ?? "")
                      : undefined
                  }
                />
              ))}
            </section>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => goTo(stepIndex - 1)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
              >
                Atrás
              </button>
            )}
            {!isReview ? (
              <button
                type="button"
                onClick={() => goTo(stepIndex + 1)}
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-foreground)]"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void continueToEditor()}
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-foreground)]"
              >
                Continuar al editor
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="lg:hidden rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
            >
              {showPreview ? "Ocultar documento" : "Ver documento"}
            </button>
          </div>
        </div>

        {/* Vista previa */}
        <aside
          className={`${showPreview ? "block" : "hidden"} lg:block min-w-0 lg:sticky lg:top-4 lg:self-start`}
        >
          <div className="rounded-card border border-[var(--border)] bg-[var(--surface)]">
            <p className="border-b border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]">
              Vista previa del documento{bodyEdited ? " (según respuestas, no según tus ediciones)" : ""}
            </p>
            <div
              className={`${previewClass} max-h-[75vh] overflow-y-auto px-5 py-4`}
              // Contenido escapado por Handlebars; cláusulas provienen del código.
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReviewPanel({
  blocking,
  warnings,
  steps,
  onGoTo,
}: {
  blocking: { id: string; step: string; message: string }[];
  warnings: { id: string; step: string; message: string }[];
  steps: string[];
  onGoTo: (i: number) => void;
}) {
  const link = (stepId: string) => {
    const i = steps.indexOf(stepId);
    return i >= 0 ? (
      <button type="button" className="underline text-xs ml-1" onClick={() => onGoTo(i)}>
        Ir al paso {i + 1}
      </button>
    ) : null;
  };
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">Revisión</h2>
      {blocking.length === 0 ? (
        <p className="rounded-card border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          Todo lo obligatorio está completo. Puedes pasar al editor para ajustar el texto y luego
          publicarlo para recoger firmas.
        </p>
      ) : (
        <div className="rounded-card border border-red-500/30 bg-red-500/10 p-4 text-sm space-y-2">
          <p className="font-semibold">Falta para poder publicar ({blocking.length}):</p>
          <ul className="list-disc pl-5 space-y-1">
            {blocking.map((i) => (
              <li key={i.id}>
                {i.message}
                {link(i.step)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded-card border border-amber-500/30 bg-amber-500/10 p-4 text-sm space-y-2">
          <p className="font-semibold">Revisa antes de publicar:</p>
          <ul className="list-disc pl-5 space-y-1">
            {warnings.map((i) => (
              <li key={i.id}>
                {i.message}
                {link(i.step)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-[var(--muted)]">
        Puedes volver a este asistente en cualquier momento mientras la acción esté en creación.
      </p>
    </section>
  );
}

function FieldInput({
  field,
  root,
  scope,
  path,
  clauses,
  disabled,
  onChange,
  placeholderOverride,
}: {
  field: TemplateField;
  root: TemplateAnswers;
  scope: TemplateAnswers;
  path: string;
  clauses: TemplateClause[];
  disabled: boolean;
  onChange: (path: string, value: unknown) => void;
  placeholderOverride?: string;
}) {
  if (!isFieldVisible(field, root)) return null;
  const value = getPath(scope, field.key);
  const id = `f-${path.replace(/\./g, "-")}`;
  const label = (
    <label htmlFor={id} className="block text-sm font-semibold mb-1">
      {field.label}
      {field.required && <span className="text-red-500"> *</span>}
    </label>
  );
  const help = field.help ? (
    <p className="text-xs text-[var(--muted)] mt-1">{field.help}</p>
  ) : null;

  switch (field.type) {
    case "text":
      return (
        <div>
          {label}
          <input
            id={id}
            type={path.endsWith("email_notificaciones") ? "email" : "text"}
            value={typeof value === "string" ? value : ""}
            maxLength={field.maxLength}
            placeholder={placeholderOverride || field.placeholder}
            disabled={disabled}
            onChange={(e) => onChange(path, e.target.value)}
            className={inputClass}
          />
          {help}
        </div>
      );
    case "textarea": {
      const text = typeof value === "string" ? value : "";
      return (
        <div>
          {label}
          <textarea
            id={id}
            value={text}
            rows={field.rows ?? 4}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            disabled={disabled}
            onChange={(e) => onChange(path, e.target.value)}
            className={inputClass}
          />
          <div className="flex justify-between gap-2">
            {help ?? <span />}
            {field.maxLength && (
              <span className="text-[10px] text-[var(--muted)] mt-1 shrink-0">
                {text.length}/{field.maxLength}
              </span>
            )}
          </div>
        </div>
      );
    }
    case "date":
      return (
        <div>
          {label}
          <input
            id={id}
            type="date"
            value={typeof value === "string" ? value : ""}
            disabled={disabled}
            onChange={(e) => onChange(path, e.target.value)}
            className={inputClass}
          />
          {help}
        </div>
      );
    case "select":
      return (
        <div>
          {label}
          <select
            id={id}
            value={typeof value === "string" ? value : ""}
            disabled={disabled}
            onChange={(e) => onChange(path, e.target.value)}
            className={inputClass}
          >
            {!field.required && <option value="">—</option>}
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {help}
        </div>
      );
    case "radio":
      return (
        <fieldset>
          <legend className="block text-sm font-semibold mb-1">
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </legend>
          <div className="space-y-2">
            {field.options.map((o) => (
              <label
                key={o.value}
                className="flex gap-3 p-3 rounded-card border border-[var(--border)] cursor-pointer has-[:checked]:border-[var(--accent)]"
              >
                <input
                  type="radio"
                  name={id}
                  checked={value === o.value}
                  disabled={disabled}
                  onChange={() => onChange(path, o.value)}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-sm">
                  <strong>{o.label}</strong>
                  {o.help && <span className="block text-xs text-[var(--muted)]">{o.help}</span>}
                </span>
              </label>
            ))}
          </div>
          {help}
        </fieldset>
      );
    case "boolean":
      return (
        <div>
          <p className="text-sm font-semibold mb-1">
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </p>
          <label className="flex gap-2 text-sm cursor-pointer">
            <input
              id={id}
              type="checkbox"
              checked={value === true}
              disabled={disabled}
              onChange={(e) => onChange(path, e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            <span>{field.checkboxLabel}</span>
          </label>
          {help}
        </div>
      );
    case "clause_multi": {
      const selected = list<string>(value);
      const options = clauses.filter((c) => c.category === field.category);
      return (
        <fieldset>
          <legend className="block text-sm font-semibold mb-1">{field.label}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((c) => {
              const checked = selected.includes(c.slug);
              return (
                <label
                  key={c.slug}
                  className="flex gap-3 p-3 rounded-card border border-[var(--border)] cursor-pointer has-[:checked]:border-[var(--accent)]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() =>
                      onChange(
                        path,
                        checked ? selected.filter((s) => s !== c.slug) : [...selected, c.slug]
                      )
                    }
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-sm">
                    <strong>{c.label}</strong>
                    {c.help && <span className="block text-xs text-[var(--muted)]">{c.help}</span>}
                  </span>
                </label>
              );
            })}
          </div>
          {help}
        </fieldset>
      );
    }
    case "repeatable": {
      const items = list(value);
      const canAdd = !field.max || items.length < field.max;
      const quick = field.quickAdd?.(root) ?? [];
      const setItems = (next: TemplateAnswers[]) => onChange(path, next);
      return (
        <fieldset className="space-y-3">
          <legend className="block text-sm font-semibold mb-1">
            {field.label}
            {field.min ? <span className="text-red-500"> *</span> : null}
          </legend>
          {help}
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-card border border-[var(--border)] p-3 space-y-3 bg-[var(--surface)]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                  {field.itemLabel} {i + 1}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={disabled || i === 0}
                    onClick={() => {
                      const next = [...items];
                      [next[i - 1], next[i]] = [next[i], next[i - 1]];
                      setItems(next);
                    }}
                    className="rounded border border-[var(--border)] px-2 text-xs disabled:opacity-40"
                    aria-label="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={disabled || i === items.length - 1}
                    onClick={() => {
                      const next = [...items];
                      [next[i + 1], next[i]] = [next[i], next[i + 1]];
                      setItems(next);
                    }}
                    className="rounded border border-[var(--border)] px-2 text-xs disabled:opacity-40"
                    aria-label="Bajar"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="rounded border border-[var(--border)] px-2 text-xs text-red-600 disabled:opacity-40"
                  >
                    Quitar
                  </button>
                </div>
              </div>
              {field.fields.map((sub) => (
                <FieldInput
                  key={sub.key}
                  field={sub}
                  root={root}
                  scope={item}
                  path={`${path}.${i}.${sub.key}`}
                  clauses={clauses}
                  disabled={disabled}
                  onChange={(_p, v) => {
                    const next = [...items];
                    next[i] = setPath(item, sub.key, v);
                    setItems(next);
                  }}
                />
              ))}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || !canAdd}
              onClick={() => setItems([...items, {}])}
              className="rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm disabled:opacity-50"
            >
              + Agregar {field.itemLabel.toLowerCase()}
            </button>
            {quick.map((q) => (
              <button
                key={q.label}
                type="button"
                disabled={disabled || !canAdd}
                onClick={() => setItems([...items, q.item])}
                className="rounded-lg border border-[var(--accent)]/40 px-3 py-2 text-xs text-[var(--accent)] disabled:opacity-50"
              >
                + {q.label}
              </button>
            ))}
          </div>
        </fieldset>
      );
    }
  }
}
