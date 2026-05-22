import Link from "next/link";
import { LegalDisclaimerBanner } from "@/components/legal/LegalDisclaimerBanner";

export default function ResponsabilidadLegalPage() {
  return (
    <div className="flex-1 overflow-auto px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/acciones" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Volver
        </Link>
        <h1 className="font-display text-2xl font-bold">Responsabilidad legal</h1>
        <LegalDisclaimerBanner />
        <div className="prose prose-sm max-w-none text-[var(--foreground)] space-y-4 text-sm leading-relaxed">
          <p>
            <strong>Civitapp</strong> es una plataforma de organización ciudadana para acciones
            constitucionales, recolección de firmas, chat de equipo y registro de eventos. No es un
            bufete de abogados ni un servicio de asesoría jurídica.
          </p>
          <h2 className="font-bold text-base mt-6">Recomendación de asesoría profesional</h2>
          <p>
            Las acciones de tutela, cumplimiento, popular, de grupo, de nulidad e
            inconstitucionalidad tienen requisitos formales y sustantivos específicos. Antes de
            publicar un documento para recolección de firmas o radicarlo ante una autoridad, te
            recomendamos contar con un abogado o abogada en tu equipo que revise el contenido.
          </p>
          <h2 className="font-bold text-base mt-6">Firmas y documentos</h2>
          <p>
            Las firmas registradas en Civitapp constituyen un respaldo ciudadano organizado con
            trazabilidad técnica (fecha, identidad verificada según políticas de la plataforma).
            La validez jurídica del instrumento final depende del cumplimiento de los requisitos
            legales aplicables y de la revisión profesional del texto.
          </p>
          <h2 className="font-bold text-base mt-6">Eventos</h2>
          <p>
            Los eventos registrados (presenciales u online) son responsabilidad de los organizadores.
            Civitapp solo documenta la convocatoria; no garantiza la realización ni la seguridad de
            los encuentros.
          </p>
        </div>
      </div>
    </div>
  );
}
