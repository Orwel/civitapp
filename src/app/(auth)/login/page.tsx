"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/client";
import { AuthLogoMark } from "@/components/brand/AuthLogoMark";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const message = searchParams.get("message");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(err.message);
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "Failed to fetch" || (err instanceof TypeError && msg.includes("fetch"))) {
        setError(
          "No se pudo conectar con Supabase. Comprueba .env.local (NEXT_PUBLIC_SUPABASE_URL y clave), que el proyecto esté activo y CORS/origen en el dashboard."
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
        <h1 className="text-2xl font-bold text-center text-civitapp-charcoal dark:text-slate-100">Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-civitapp-charcoal dark:text-slate-300 mb-1">
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
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-civitapp-charcoal dark:text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border-2 border-civitapp-sky/40 focus:border-civitapp-blue bg-white dark:bg-slate-800 px-3 py-2 text-civitapp-charcoal dark:text-slate-200"
            />
          </div>
          <p className="text-sm text-right">
            <Link
              href="/forgot-password"
              className="font-medium text-civitapp-blue hover:text-civitapp-blue-light underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          {message === "password-updated" && (
            <p className="text-sm text-green-600 dark:text-green-400 text-center">
              Contraseña actualizada. Ya puedes iniciar sesión.
            </p>
          )}
          {message === "email-confirmed" && (
            <p className="text-sm text-green-600 dark:text-green-400 text-center">
              Correo confirmado. Ya puedes iniciar sesión con tu contraseña.
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-civitapp-blue hover:bg-civitapp-blue-light text-white py-2.5 font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="text-center text-sm text-civitapp-charcoal/80 dark:text-slate-400">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-semibold text-civitapp-blue hover:text-civitapp-blue-light underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center bg-civitapp-bg"><p className="text-civitapp-charcoal/70">Cargando…</p></main>}>
      <LoginForm />
    </Suspense>
  );
}
