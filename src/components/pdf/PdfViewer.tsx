"use client";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

function loadReactPdf() {
  return import("react-pdf").then((m) => {
    m.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    // #region agent log
    fetch("http://127.0.0.1:7512/ingest/5260e652-28ac-4e6a-bf69-7b4525a8a675", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf4f0d" },
      body: JSON.stringify({
        sessionId: "bf4f0d",
        runId: "post-fix",
        hypothesisId: "A",
        location: "PdfViewer.tsx:react-pdf-import",
        message: "pdfjs workerSrc after worker config",
        data: { workerSrc: m.pdfjs.GlobalWorkerOptions.workerSrc },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return m;
  });
}

const Document = dynamic(() => loadReactPdf().then((m) => m.Document), { ssr: false });
const Page = dynamic(() => loadReactPdf().then((m) => m.Page), { ssr: false });

export function PdfViewer({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7512/ingest/5260e652-28ac-4e6a-bf69-7b4525a8a675", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf4f0d" },
      body: JSON.stringify({
        sessionId: "bf4f0d",
        runId: "pre-fix",
        hypothesisId: "D",
        location: "PdfViewer.tsx:mount",
        message: "PdfViewer mounted",
        data: { urlHost: (() => { try { return new URL(url).host; } catch { return "invalid"; } })() },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [url]);

  if (failed) {
    return (
      <iframe src={url} title="Documento PDF" className="w-full h-[70vh] rounded-card border" />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center text-xs">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded border px-2 py-1 disabled:opacity-40"
        >
          Anterior
        </button>
        <span>
          {page} / {numPages || "?"}
        </span>
        <button
          type="button"
          disabled={page >= numPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded border px-2 py-1 disabled:opacity-40"
        >
          Siguiente
        </button>
        <a href={url} download className="ml-auto text-[var(--accent)] font-semibold underline">
          Descargar
        </a>
      </div>
      <div className="overflow-auto border rounded-card bg-white">
        <Document
          file={url}
          onLoadSuccess={({ numPages: n }) => {
            // #region agent log
            fetch("http://127.0.0.1:7512/ingest/5260e652-28ac-4e6a-bf69-7b4525a8a675", {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf4f0d" },
              body: JSON.stringify({
                sessionId: "bf4f0d",
                runId: "pre-fix",
                hypothesisId: "A",
                location: "PdfViewer.tsx:onLoadSuccess",
                message: "PDF loaded",
                data: { numPages: n },
                timestamp: Date.now(),
              }),
            }).catch(() => {});
            // #endregion
            setNumPages(n);
          }}
          onLoadError={(err) => {
            // #region agent log
            fetch("http://127.0.0.1:7512/ingest/5260e652-28ac-4e6a-bf69-7b4525a8a675", {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf4f0d" },
              body: JSON.stringify({
                sessionId: "bf4f0d",
                runId: "pre-fix",
                hypothesisId: "A",
                location: "PdfViewer.tsx:onLoadError",
                message: "PDF load error",
                data: { errorMessage: err?.message ?? String(err) },
                timestamp: Date.now(),
              }),
            }).catch(() => {});
            // #endregion
            setFailed(true);
          }}
          loading={<p className="p-4 text-sm text-[var(--muted)]">Cargando PDF…</p>}
        >
          <Page pageNumber={page} width={Math.min(800, typeof window !== "undefined" ? window.innerWidth - 48 : 800)} />
        </Document>
      </div>
    </div>
  );
}
