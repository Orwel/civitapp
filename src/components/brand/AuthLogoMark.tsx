import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";

/** Logo mixto blanco sobre bloque navy — auth y páginas con fondo claro. */
export function AuthLogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("mb-8 flex justify-center", className)}>
      <div className="rounded-2xl border border-white/10 bg-[var(--brand-navy)] px-6 py-4 shadow-lg sm:px-7 sm:py-5">
        <BrandLogo href={null} width={200} height={54} className="mx-auto h-10 max-w-[12rem] sm:h-11 sm:max-w-[14rem]" priority />
      </div>
    </div>
  );
}
