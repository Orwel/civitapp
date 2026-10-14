"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { createClient } from "@/infrastructure/supabase/client";
import { signActionAction } from "@/app/(app)/dashboard/acciones/[id]/actions";
import { ACTION_DOCUMENTS_BUCKET } from "@/lib/actionDocuments";
import { actionSignatureStoragePath } from "@/lib/signatureUpload";
import { getPublicActionShareUrl } from "@/lib/siteUrl";
import {
  DATA_CONSENT_FULL,
  DATA_CONSENT_SUMMARY,
} from "@/lib/legal/dataConsent";
import type {
  SignatureLevel,
  SignerFieldsConfig,
} from "@/core/entities/ActionType";
import { SignaturePad, type SignaturePadHandle } from "@/components/features/actions/SignaturePad";
import { Button } from "@/components/ui/button";

export interface SignActionFormProps {
  actionId: string;
  slug: string;
  actionTitle: string;
  signatureLevel: SignatureLevel;
  signerFields: SignerFieldsConfig;
  /** Correo de la sesión; null si el visitante no ha iniciado sesión (se verifica con código). */
  sessionEmail: string | null;
  initial?: {
    full_name?: string | null;
    cedula?: string | null;
    address?: string | null;
    phone?: string | null;
  };
}

type Step = "form" | "code" | "done";

interface FormState {
  full_name: string;
  cedula: string;
  address: string;
  phone: string;
  email: string;
  consent: boolean;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm";

function draftKey(actionId: string) {
  return `civitapp:firma:${actionId}`;
}

export function SignActionForm({
  actionId,
  slug,
  actionTitle,
  signatureLevel,
  signerFields,
  sessionEmail,
  initial,
}: SignActionFormProps) {
  const router = useRouter();
  const padRef = useRef<SignaturePadHandle>(null);
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>({
    full_name: initial?.full_name ?? "",
    cedula: initial?.cedula ?? "",
    address: initial?.address ?? "",
    phone: initial?.phone ?? "",
    email: sessionEmail ?? "",
    consent: false,
  });
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);
  const [code, setCode] = useState("");
  const [showConsent, setShowConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureNumber, setSignatureNumber] = useState<number | null>(null);

  const needsPad = signatureLevel !== "SIMPLE";
  const askAddress = Boolean(signerFields.address);
  const askPhone = Boolean(signerFields.phone);

  // Si el visitante abrió el enlace del correo en vez de escribir el código, recupera lo que llenó.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey(actionId));
      if (raw) {
        const saved = JSON.parse(raw) as Partial<FormState>;
        setForm((f) => ({ ...f, ...saved, consent: false, email: sessionEmail ?? saved.email ?? f.email }));
      }
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [actionId, sessionEmail]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function saveDraft() {
    try {
      const { consent: _consent, ...rest } = form;
      sessionStorage.setItem(draftKey(actionId), JSON.stringify(rest));
    } catch {
      /* ignore */
    }
  }

  function clearDraft() {
    try {
      sessionStorage.removeItem(draftKey(actionId));
    } catch {
      /* ignore */
    }
  }

  function localValidate(): string | null {
    if (form.full_name.trim().split(/\s+/).length < 2) return "Escribe tu nombre completo.";
    if (!form.cedula.trim()) return "Falta la cédula.";
    if (signerFields.address === "required" && !form.address.trim()) return "Falta la dirección.";
    if (signerFields.phone === "required" && !form.phone.trim()) return "Falta el celular.";
    if (!form.email.trim()) return "Falta el correo: ahí te llega el código.";
    if (!form.consent) return "Debes autorizar el tratamiento de datos para firmar.";
    return null;
  }

  async function submitSignature(blob: Blob | null) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Tu sesión expiró. Vuelve a pedir el código.");

    let signaturePath: string | null = null;
    if (needsPad) {
      if (!blob) throw new Error("Dibuja tu firma en el recuadro.");
      signaturePath = actionSignatureStoragePath(actionId, user.id);
      const { error: uploadError } = await supabase.storage
        .from(ACTION_DOCUMENTS_BUCKET)
        .upload(signaturePath, blob, { upsert: true, contentType: "image/png" });
      if (uploadError) throw new Error(`No se pudo guardar la firma: ${uploadError.message}`);
    }

    const res = await signActionAction(actionId, {
      full_name: form.full_name,
      cedula: form.cedula,
      address: askAddress ? form.address : null,
      phone: askPhone ? form.phone : null,
      email: form.email,
      data_consent: form.consent,
      signature_storage_path: signaturePath,
    });
    if (res.error) throw new Error(res.error);
    clearDraft();
    setSignatureNumber(res.signatureNumber ?? null);
    setStep("done");
    router.refresh();
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const invalid = localValidate();
    if (invalid) {
      setError(invalid);
      return;
    }
    let blob: Blob | null = null;
    if (needsPad) {
      blob = (await padRef.current?.exportPngBlob()) ?? null;
      if (!blob) {
        setError("Dibuja tu firma en el recuadro.");
        return;
      }
      setSignatureBlob(blob);
    }

    setLoading(true);
    try {
      if (sessionEmail) {
        await submitSignature(blob);
        return;
      }
      saveDraft();
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: form.email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          data: { full_name: form.full_name.trim() },
          emailRedirectTo: `${window.location.origin}/acciones/${slug}?firmar=1`,
        },
      });
      if (otpError) throw new Error(otpError.message);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo continuar");
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      setError("Escribe el código de 6 dígitos que te llegó al correo.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: form.email.trim().toLowerCase(),
        token,
        type: "email",
      });
      if (verifyError) throw new Error("El código no es válido o ya venció. Pide uno nuevo.");
      await submitSignature(signatureBlob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar el código");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    const shareUrl = getPublicActionShareUrl(slug);
    const waText = encodeURIComponent(`Ya firmé "${actionTitle}". Firma tú también: ${shareUrl}`);
    return (
      <div className="w-full rounded-card border-2 border-green-600/40 bg-green-500/5 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400 shrink-0" />
          <div>
            <p className="text-base font-bold text-green-800 dark:text-green-300">
              Tu firma quedó registrada{signatureNumber ? ` (#${signatureNumber.toLocaleString("es-CO")})` : ""}
            </p>
            <p className="text-sm text-[var(--muted)] mt-1">
              Te avisaremos por correo cuando se radique y cuando la entidad responda o se venza el plazo.
            </p>
          </div>
        </div>
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white"
        >
          <MessageCircle className="h-4 w-4" />
          Compartir por WhatsApp
        </a>
      </div>
    );
  }

  if (step === "code") {
    return (
      <form
        onSubmit={(e) => void handleCodeSubmit(e)}
        className="w-full rounded-card border-2 border-[var(--accent)]/50 bg-[var(--surface)] p-5 space-y-4"
      >
        <div>
          <p className="text-sm font-bold">Revisa tu correo</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Enviamos un código de 6 dígitos a <span className="font-semibold">{form.email}</span>. Si no
            lo ves, busca en spam o promociones.
          </p>
        </div>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
          placeholder="••••••"
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="accent" disabled={loading} className="flex-1 sm:flex-none">
            {loading ? "Verificando…" : "Confirmar y firmar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => {
              setStep("form");
              setCode("");
              setError(null);
            }}
          >
            Cambiar correo
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleFormSubmit(e)}
      className="w-full rounded-card border-2 border-[var(--accent)]/50 bg-[var(--surface)] p-5 space-y-4"
    >
      <div>
        <p className="text-base font-bold">Firma esta acción</p>
        <p className="text-xs text-[var(--muted)] mt-1">
          {sessionEmail
            ? "Confirma tus datos. Tu nombre y cédula irán en el anexo de firmas."
            : "Sin contraseña: te enviamos un código al correo para confirmar que eres tú. Tu nombre y cédula irán en el anexo de firmas."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs font-semibold">Nombre completo</span>
          <input
            className={inputClass}
            autoComplete="name"
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold">Cédula</span>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.cedula}
            onChange={(e) => update("cedula", e.target.value)}
            placeholder="Sin puntos"
            required
          />
        </label>
        {askPhone && (
          <label className="space-y-1">
            <span className="text-xs font-semibold">
              Celular{signerFields.phone === "optional" ? " (opcional)" : ""}
            </span>
            <input
              className={inputClass}
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              required={signerFields.phone === "required"}
            />
          </label>
        )}
        {askAddress && (
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs font-semibold">
              Dirección{signerFields.address === "optional" ? " (opcional)" : ""}
            </span>
            <input
              className={inputClass}
              autoComplete="street-address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Ej. Calle 10 # 20-30, apto 401"
              required={signerFields.address === "required"}
            />
          </label>
        )}
        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs font-semibold">Correo</span>
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            readOnly={Boolean(sessionEmail)}
            required
          />
        </label>
      </div>

      {needsPad && <SignaturePad ref={padRef} />}

      <div className="rounded-lg border border-[var(--border)] p-3 space-y-2">
        <label className="flex gap-2 text-xs leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={form.consent}
            onChange={(e) => update("consent", e.target.checked)}
          />
          <span>{DATA_CONSENT_SUMMARY}</span>
        </label>
        <button
          type="button"
          className="text-xs text-[var(--accent)] underline"
          onClick={() => setShowConsent((v) => !v)}
        >
          {showConsent ? "Ocultar detalle" : "Leer la autorización completa"}
        </button>
        {showConsent && (
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-[var(--muted)]">
            {DATA_CONSENT_FULL.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" variant="accent" disabled={loading} className="w-full">
        {loading ? "Enviando…" : sessionEmail ? "Firmar" : "Enviarme el código"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
