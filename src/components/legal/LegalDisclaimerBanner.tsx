import Link from "next/link";
import { Scale } from "lucide-react";

export function LegalDisclaimerBanner({
  compact = false,
  legalLinkNewTab = false,
}: {
  compact?: boolean;
  /** En el wizard de creación: abrir legal sin salir del flujo. */
  legalLinkNewTab?: boolean;
}) {
  return (
    <div
      className={`rounded-card border border-amber-500/30 bg-amber-500/10 ${
        compact ? "p-3" : "p-4"
      } flex gap-3`}
      role="note"
    >
      <Scale className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
      <div className="text-sm space-y-1">
        <p className="font-semibold text-amber-900 dark:text-amber-200">
          Asesoría jurídica recomendada
        </p>
        <p className="text-amber-800/90 dark:text-amber-100/80 text-xs leading-relaxed">
          Civitapp es una herramienta de organización ciudadana, no sustituye asesoría legal
          profesional. Antes de publicar para recolección de firmas, incluye un abogado o abogada
          en tu equipo para revisar el contenido.
        </p>
        {!compact && (
          <Link
            href="/legal/responsabilidad"
            target={legalLinkNewTab ? "_blank" : undefined}
            rel={legalLinkNewTab ? "noopener noreferrer" : undefined}
            className="text-xs font-semibold text-amber-700 underline"
          >
            Leer responsabilidad legal →
          </Link>
        )}
      </div>
    </div>
  );
}
