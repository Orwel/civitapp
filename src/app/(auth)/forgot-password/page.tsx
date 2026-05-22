"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/client";
import { AuthLogoMark } from "@/components/brand/AuthLogoMark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/confirm?next=/reset-password`
          : "/auth/confirm?next=/reset-password";
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg === "Failed to fetch" ||
        (err instanceof TypeError && msg.includes("fetch"))
      ) {
        setError(
          "No se pudo conectar con Supabase. Comprueba .env.local y que el proyecto esté activo."
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <AuthLogoMark />
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center text-civitapp-charcoal dark:text-slate-100">
          Restablecer contraseña
        </h1>
        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-civitapp-charcoal dark:text-slate-300 text-center">
              Si existe una cuenta con ese correo, te hemos enviado un enlace
              para restablecer tu contraseña. Revisa tu bandeja de entrada (y la
              carpeta de spam).
            </p>
            <p className="text-xs text-civitapp-charcoal/70 dark:text-slate-500 text-center">
              Si el enlace te lleva a la página principal en vez de cambiar la contraseña, añade{" "}
              <code className="bg-civitapp-sky/20 px-1 rounded">{typeof window !== "undefined" ? `${window.location.origin}/auth/confirm` : "/auth/confirm"}</code> en Supabase → Authentication → URL Configuration → Redirect URLs.
            </p>
            <Link
              href="/login"
              className="block w-full text-center rounded-lg bg-civitapp-blue hover:bg-civitapp-blue-light text-white py-2.5 font-semibold transition-colors"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-civitapp-charcoal/80 dark:text-slate-400 text-center">
              Introduce tu correo y te enviaremos un enlace para crear una nueva
              contraseña.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-civitapp-charcoal dark:text-slate-300 mb-1"
                >
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border-2 border-civitapp-sky/40 focus:border-civitapp-blue bg-white dark:bg-slate-800 px-3 py-2 text-civitapp-charcoal dark:text-slate-200"
                  placeholder="tu@correo.com"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-civitapp-blue hover:bg-civitapp-blue-light text-white py-2.5 font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? "Enviando…" : "Enviar enlace"}
              </button>
            </form>
          </>
        )}
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
