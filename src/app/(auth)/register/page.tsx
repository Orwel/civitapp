"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/client";
import { AuthLogoMark } from "@/components/brand/AuthLogoMark";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/confirm?next=/login&message=email-confirmed`
          : "/auth/confirm?next=/login&message=email-confirmed";
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: redirectTo,
        },
      });
      if (err) {
        setError(err.message);
        return;
      }
      const identities = data.user?.identities ?? [];
      if (identities.length === 0) {
        setError(
          "No se pudo crear la cuenta con este correo. Puede que ya esté registrado: prueba a iniciar sesión o usa otro correo."
        );
        return;
      }
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "Failed to fetch" || (err instanceof TypeError && msg.includes("fetch"))) {
        setError(
          "No se pudo conectar con Supabase. Comprueba .env.local (NEXT_PUBLIC_SUPABASE_URL y clave), que el proyecto esté activo y CORS/origen en el dashboard."
        );
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <AuthLogoMark />
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center text-civitapp-charcoal dark:text-slate-100">Crear cuenta</h1>
        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-green-700 dark:text-green-400 text-center font-medium">
              Cuenta creada correctamente.
            </p>
            <p className="text-sm text-civitapp-charcoal dark:text-slate-300 text-center">
              Te hemos enviado un correo de confirmación. Abre el enlace para activar tu cuenta y
              después podrás iniciar sesión.
            </p>
            <p className="text-xs text-civitapp-charcoal/70 dark:text-slate-500 text-center">
              Revisa también la carpeta de spam. Si no llega el correo, añade{" "}
              <code className="bg-civitapp-sky/20 px-1 rounded">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/auth/confirm`
                  : "/auth/confirm"}
              </code>{" "}
              en Supabase → Authentication → URL Configuration → Redirect URLs.
            </p>
            <Link
              href="/login"
              className="block w-full text-center rounded-lg bg-civitapp-blue hover:bg-civitapp-blue-light text-white py-2.5 font-semibold transition-colors"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-civitapp-charcoal dark:text-slate-300 mb-1">
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border-2 border-civitapp-sky/40 focus:border-civitapp-blue bg-white dark:bg-slate-800 px-3 py-2 text-civitapp-charcoal dark:text-slate-200"
                placeholder="Tu nombre"
              />
            </div>
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
                minLength={6}
                className="w-full rounded-lg border-2 border-civitapp-sky/40 focus:border-civitapp-blue bg-white dark:bg-slate-800 px-3 py-2 text-civitapp-charcoal dark:text-slate-200"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-civitapp-blue hover:bg-civitapp-blue-light text-white py-2.5 font-semibold disabled:opacity-50 transition-colors"
            >
              {loading ? "Creando cuenta…" : "Registrarme"}
            </button>
          </form>
        )}
        {!success && (
          <p className="text-center text-sm text-civitapp-charcoal/80 dark:text-slate-400">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-civitapp-blue hover:text-civitapp-blue-light underline">
              Inicia sesión
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
