import Link from "next/link";
import { AuthLogoMark } from "@/components/brand/AuthLogoMark";

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-civitapp-bg dark:bg-slate-950">
      <AuthLogoMark className="mb-0" />
      <h1 className="text-2xl font-bold text-civitapp-charcoal dark:text-slate-100">Acceso denegado</h1>
      <p className="text-civitapp-charcoal/80 dark:text-slate-400 text-center">No tienes permiso para ver esta página.</p>
      <Link href="/dashboard" className="rounded-lg bg-civitapp-blue hover:bg-civitapp-blue-light text-white font-semibold px-5 py-2.5 transition-colors">
        Volver al inicio
      </Link>
    </main>
  );
}
