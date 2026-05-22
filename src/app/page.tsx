import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Search, Scale, ScrollText, Megaphone, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";

function LandingCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-white/[0.07] bg-white/[0.03] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.05] sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-display mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500 sm:text-[11px]">
      {children}
    </p>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--brand-navy)] text-slate-400">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[var(--brand-navy)]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--brand-navy)]/90">
        <nav className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <BrandLogo href="/" priority />
          <div className="flex-1" />
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/login"
              className="rounded-card px-2.5 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-[var(--brand-blue-soft)] sm:px-3 sm:text-sm"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-card bg-[var(--brand-indigo)] px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:brightness-110 sm:px-4 sm:text-sm"
            >
              Registrarse
            </Link>
          </div>
        </nav>
      </header>

      {/* Convencer */}
      <section className="brand-hero-shell relative flex flex-col items-center px-4 pt-12 pb-16 sm:pt-16 sm:pb-24 md:pt-20 md:pb-28">
        <div className="brand-hero-grid" aria-hidden />
        <div className="relative z-[1] flex w-full max-w-6xl flex-col items-center text-center lg:flex-row lg:items-center lg:gap-14 lg:text-left">
          <div className="flex flex-1 flex-col items-center lg:items-start">
            <p className="font-display mb-4 inline-flex items-center rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-blue-soft)] sm:text-[11px] sm:tracking-[0.22em]">
              Participación ciudadana
            </p>
            <h1 className="font-display max-w-xl text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-200 sm:text-4xl md:text-5xl lg:max-w-lg">
              Colombia no cambia sola.
              <span className="block text-slate-400">Cámbiala tú.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
              Recolecta firmas masivamente, ejerce veeduría ciudadana y usa cada herramienta que la Constitución te dio —
              con orden, equipo e impacto real.
            </p>
            <div className="mt-9 flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/acciones/nueva"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-indigo)] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/25 transition hover:brightness-110"
              >
                Crear acción
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
              <Link
                href="/acciones"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-slate-300 transition hover:border-white/[0.18] hover:bg-white/[0.07]"
              >
                <Search className="h-4 w-4 shrink-0 text-[var(--brand-blue-soft)]" aria-hidden />
                Explorar acciones
              </Link>
            </div>
          </div>
          <div className="relative z-[1] mt-12 flex w-full max-w-sm shrink-0 justify-center lg:mt-0 lg:max-w-md">
            <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-8 shadow-2xl backdrop-blur-sm sm:p-10">
              <BrandLogo
                mark="vertical"
                href={null}
                width={180}
                height={220}
                className="max-h-44 max-w-[12rem] sm:max-h-52 sm:max-w-[14rem]"
              />
              <p className="mt-6 text-center text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
                Constitución, equipo y trazabilidad — sin perder el hilo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Poder — propuesta de valor */}
      <section className="border-t border-white/[0.06] bg-[var(--brand-navy)] py-14 sm:py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionKicker>Propuesta de valor</SectionKicker>
          <h2 className="font-display max-w-3xl text-2xl font-bold tracking-tight text-slate-300 sm:text-3xl md:text-4xl">
            El poder ciudadano que la Constitución ya te dio
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Recolección masiva de firmas, veeduría ciudadana y control político — organizados, verificables y con tu
            equipo.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <LandingCard>
              <p className="mb-3 text-lg" aria-hidden>
                ✍️
              </p>
              <h3 className="font-display text-base font-bold text-slate-300">Recolección masiva de firmas</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Para iniciativas legislativas, revocatorias y acciones populares. Firmas verificadas, contadas y listas
                para presentar.
              </p>
            </LandingCard>
            <LandingCard>
              <p className="mb-3 text-lg" aria-hidden>
                👁
              </p>
              <h3 className="font-display text-base font-bold text-slate-300">Veeduría ciudadana</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Haz seguimiento a contratos, obras y decisiones públicas. Lo que se vigila, se documenta. Lo que se
                documenta, se defiende.
              </p>
            </LandingCard>
            <LandingCard>
              <p className="mb-3 text-lg" aria-hidden>
                ⚖️
              </p>
              <h3 className="font-display text-base font-bold text-slate-300">Control ciudadano</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Tutelas, derechos de petición, acciones de cumplimiento e inconstitucionalidad. Instrumentos reales
                para exigir rendición de cuentas.
              </p>
            </LandingCard>
            <LandingCard className="sm:col-span-2 lg:col-span-1">
              <p className="mb-3 text-lg" aria-hidden>
                📢
              </p>
              <h3 className="font-display text-base font-bold text-slate-300">Movilización organizada</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Marchas, eventos y convocatorias con roles, bitácora y trazabilidad. Que la presión ciudadana deje
                huella, no solo ruido.
              </p>
            </LandingCard>
          </div>
        </div>
      </section>

      {/* Herramientas */}
      <section className="border-t border-white/[0.06] bg-[var(--brand-navy)] py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionKicker>Herramientas</SectionKicker>
          <h2 className="font-display max-w-3xl text-2xl font-bold tracking-tight text-slate-300 sm:text-3xl md:text-4xl">
            Hecho para quien sabe que la Constitución da más de lo que creen
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Tutelas, acciones populares, derechos de petición, marchas y más — todo en un solo lugar, con trazabilidad y
            equipo.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <LandingCard>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-[var(--brand-blue-soft)]">
                <Scale className="h-5 w-5" aria-hidden />
              </div>
              <p className="mb-1 text-base font-bold text-slate-300">
                <span aria-hidden>⚖️ </span>Acciones constitucionales
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Tutelas, acciones de cumplimiento, acciones populares e inconstitucionalidad. Instrumentos reales, no
                peticiones al vacío.
              </p>
            </LandingCard>
            <LandingCard>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-[var(--brand-blue-soft)]">
                <ScrollText className="h-5 w-5" aria-hidden />
              </div>
              <p className="mb-1 text-base font-bold text-slate-300">
                <span aria-hidden>📄 </span>Derechos de petición
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Redacta, radica y dale seguimiento a tus derechos de petición. Con estados claros: lo que se envió, lo
                que respondieron y lo que falta.
              </p>
            </LandingCard>
            <LandingCard>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-[var(--brand-blue-soft)]">
                <Megaphone className="h-5 w-5" aria-hidden />
              </div>
              <p className="mb-1 text-base font-bold text-slate-300">
                <span aria-hidden>📢 </span>Marchas y movilizaciones
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Organiza eventos ciudadanos con convocatoria, roles y bitácora. Que la movilización quede escrita, no
                solo en stories.
              </p>
            </LandingCard>
            <LandingCard className="sm:col-span-2 lg:col-span-1">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-[var(--brand-blue-soft)]">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </div>
              <p className="mb-1 text-base font-bold text-slate-300">
                <span aria-hidden>🛡 </span>Iniciativas con respaldo
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Firmas verificadas para iniciativas legislativas y populares. Menos &quot;confío en que alguien lo
                guardó&quot;, más constancia republicana.
              </p>
            </LandingCard>
          </div>
        </div>
      </section>

      {/* Manifiesto */}
      <section className="border-t border-white/[0.06] bg-[var(--brand-navy)] px-4 py-14 text-center sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-2xl space-y-5">
          <p className="font-display text-xl font-semibold leading-snug text-slate-400 sm:text-2xl">
            No somos una app de peticiones. Somos activismo constitucional potenciado.
          </p>
          <p className="text-base leading-relaxed text-slate-500 sm:text-lg">
            Tu causa merece más que un{" "}
            <span className="font-semibold text-[var(--brand-flag)]">like</span>.
          </p>
        </div>
      </section>

      {/* Cierre / CTA */}
      <section className="border-t border-white/[0.06] bg-[var(--brand-navy)] px-4 py-14 text-center sm:px-6 sm:py-12 md:py-16">
        <div className="mx-auto max-w-2xl space-y-5">
          <p className="text-base leading-relaxed text-slate-500 sm:text-lg">
            Tutelas, firmas, marchas y acciones populares — organizadas, trazables y con tu equipo.
          </p>
          <div className="pt-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-indigo)] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/25 transition hover:brightness-110"
            >
              Crear mi cuenta gratis
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-white/[0.06] bg-[var(--brand-navy)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <BrandLogo href="/" width={200} height={54} className="!h-10 !max-h-10 w-auto max-w-[200px] sm:!h-11 sm:!max-h-11 sm:max-w-[220px]" />
            <p className="max-w-md text-center text-sm text-slate-500 md:text-left">
              Civitapp — activismo constitucional potenciado.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center md:shrink-0">
            <Link
              href="/acciones"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/[0.18] hover:bg-white/[0.07]"
            >
              <Search className="h-4 w-4 text-[var(--brand-blue-soft)]" aria-hidden />
              Explorar acciones
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-indigo)] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              Crear mi cuenta gratis
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
