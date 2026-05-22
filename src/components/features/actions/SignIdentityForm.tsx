"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSignableIdentityAction } from "@/app/(app)/dashboard/acciones/[id]/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SignIdentityForm() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [cedulaFrontPath, setCedulaFrontPath] = useState("");
  const [cedulaBackPath, setCedulaBackPath] = useState("");
  const [selfiePath, setSelfiePath] = useState("");
  const [signaturePath, setSignaturePath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await updateSignableIdentityAction({
      cedula: cedula.trim(),
      cedula_front_path: cedulaFrontPath.trim(),
      cedula_back_path: cedulaBackPath.trim() || undefined,
      selfie_path: selfiePath.trim() || undefined,
      signature_image_path: signaturePath.trim(),
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Identidad para firmar</h3>
        <p className="text-xs text-[var(--muted)] mt-1">
          MVP: indica rutas de almacenamiento (subida de archivos próximamente). Un administrador
          validará tu identidad.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="cedula" className="block text-xs font-medium mb-1">
            Cédula
          </label>
          <input
            id="cedula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="cedula-front" className="block text-xs font-medium mb-1">
            Ruta cédula (frente)
          </label>
          <input
            id="cedula-front"
            value={cedulaFrontPath}
            onChange={(e) => setCedulaFrontPath(e.target.value)}
            required
            placeholder="storage/cedula-frente.jpg"
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="cedula-back" className="block text-xs font-medium mb-1">
            Ruta cédula (reverso, opcional)
          </label>
          <input
            id="cedula-back"
            value={cedulaBackPath}
            onChange={(e) => setCedulaBackPath(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="selfie" className="block text-xs font-medium mb-1">
            Ruta selfie (opcional)
          </label>
          <input
            id="selfie"
            value={selfiePath}
            onChange={(e) => setSelfiePath(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="signature" className="block text-xs font-medium mb-1">
            Ruta imagen de firma
          </label>
          <input
            id="signature"
            value={signaturePath}
            onChange={(e) => setSignaturePath(e.target.value)}
            required
            placeholder="storage/firma.png"
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button type="submit" variant="accent" size="sm" disabled={loading}>
          {loading ? "Guardando…" : "Guardar identidad"}
        </Button>
      </form>
    </Card>
  );
}
