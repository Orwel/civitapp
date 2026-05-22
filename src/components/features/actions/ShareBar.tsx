"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Share2, QrCode } from "lucide-react";
import type { ConstitutionalActionPublic } from "@/core/entities/ConstitutionalAction";
import { ACTION_STATE_LABELS } from "@/core/types/actionState";
import { getPublicActionShareUrl } from "@/lib/siteUrl";

function buildShareMessage(action: ConstitutionalActionPublic): string {
  const state = ACTION_STATE_LABELS[action.state];
  const count = action.signatures_count;
  const goal = action.target_count ?? action.minimum_required;
  return `✍️ ${action.title}\n${state} · ${count}/${goal} firmas\nÚnete en Civitapp:`;
}

export function ShareBar({ action }: { action: ConstitutionalActionPublic }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = getPublicActionShareUrl(action.slug);
  const message = `${buildShareMessage(action)} ${shareUrl}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [shareUrl]);

  return (
    <div className="rounded-card border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Share2 className="h-5 w-5 text-[var(--accent)] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-[var(--foreground)]">
            Comparte esta acción — así se recogen las firmas
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Cada persona que reciba el link puede registrarse y firmar. Sin compartir, la acción no crece.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-hover)]"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
        >
          WhatsApp
        </a>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(buildShareMessage(action))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0088cc] px-3 py-2 text-xs font-bold text-white"
        >
          Telegram
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-2 text-xs font-bold text-white"
        >
          X
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent(action.title)}&body=${encodeURIComponent(message)}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
        >
          Email
        </a>
        <a
          href={`/api/qr/${action.slug}`}
          download={`civitapp-${action.slug}-qr.png`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-hover)]"
        >
          <QrCode className="h-4 w-4" />
          Descargar QR
        </a>
      </div>
      <p className="text-[10px] text-[var(--muted)] font-mono truncate">{shareUrl}</p>
    </div>
  );
}
