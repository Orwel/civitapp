"use client";

import { useState } from "react";

/** Calcula el SHA-256 del archivo en el navegador (no se sube a ningún lado) y lo compara. */
export function HashCheck({ expected }: { expected: string[] }) {
  const [result, setResult] = useState<{ hash: string; match: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    setBusy(true);
    try {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setResult({ hash, match: expected.includes(hash) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-card border border-[var(--border)] p-4 space-y-2 text-sm">
      <p className="font-semibold">¿Tienes el PDF? Compruébalo aquí</p>
      <p className="text-xs text-[var(--muted)]">
        El archivo se revisa en tu dispositivo; no se sube a ningún servidor.
      </p>
      <input
        type="file"
        accept="application/pdf"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
        }}
        className="text-xs"
      />
      {result && (
        <p className={`text-xs font-semibold ${result.match ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>
          {result.match
            ? "✔ Coincide: es el documento registrado en Civitapp, sin modificaciones."
            : "✘ No coincide con el documento registrado. Puede ser otra versión o haber sido modificado."}
          <code className="block font-mono font-normal text-[10px] text-[var(--muted)] break-all mt-1">
            {result.hash}
          </code>
        </p>
      )}
    </div>
  );
}
