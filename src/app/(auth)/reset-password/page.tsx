"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/client";
import { AuthLogoMark } from "@/components/brand/AuthLogoMark";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push("/login?message=password-updated");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <AuthLogoMark />
        <p className="text-civitapp-charcoal/70 dark:text-slate-400">
          Cargando…
        </p>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <AuthLogoMark />
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-bold text-civitapp-charcoal dark:text-slate-100">
            Enlace no válido
          </h1>
          <p className="text-sm text-civitapp-charcoal/80 dark:text-slate-400">
            {urlError === "invalid_or_expired"
              ? "El enlace ha caducado o no es válido."
              : "Este enlace ha caducado o no es válido. Solicita uno nuevo desde la pantalla de restablecer contraseña."}
          </p>
          <Link
            href="/forgot-password"
            className="inline-block rounded-lg bg-civitapp-blue hover:bg-civitapp-blue-light text-white py-2.5 px-4 font-semibold transition-colors"
          >
            Restablecer contraseña
          </Link>
          <p className="text-sm text-civitapp-charcoal/80 dark:text-slate-400">
            <Link
              href="/login"
              className="font-semibold text-civitapp-blue hover:text-civitapp-blue-light underline"
            >
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <AuthLogoMark />
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center text-civitapp-charcoal dark:text-slate-100">
          Nueva contraseña
        </h1>
        <p className="text-sm text-civitapp-charcoal/80 dark:text-slate-400 text-center">
          Elige una contraseña nueva para tu cuenta.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-civitapp-charcoal dark:text-slate-300 mb-1"
            >
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border-2 border-civitapp-sky/40 focus:border-civitapp-blue bg-white dark:bg-slate-800 px-3 py-2 text-civitapp-charcoal dark:text-slate-200"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-civitapp-charcoal dark:text-slate-300 mb-1"
            >
              Repetir contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border-2 border-civitapp-sky/40 focus:border-civitapp-blue bg-white dark:bg-slate-800 px-3 py-2 text-civitapp-charcoal dark:text-slate-200"
              placeholder="Repite la contraseña"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-civitapp-blue hover:bg-civitapp-blue-light text-white py-2.5 font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
        <p className="text-center text-sm text-civitapp-charcoal/80 dark:text-slate-400">
          <Link
            href="/login"
            className="font-semibold text-civitapp-blue hover:text-civitapp-blue-light underline"
          >
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex flex-col items-center justify-center p-4">
          <AuthLogoMark />
          <p className="text-civitapp-charcoal/70 dark:text-slate-400">
            Cargando…
          </p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
