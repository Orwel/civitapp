"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, MessageSquare, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markOnboardedAction } from "@/app/(app)/dashboard/onboarding-actions";

const SLIDES = [
  {
    icon: Share2,
    title: "Comparte, comparte, comparte",
    body: "Una acción no recoge firmas sola. Cada link que envíes por WhatsApp, redes o QR en una marcha suma firmas verificadas.",
  },
  {
    icon: MessageSquare,
    title: "Chat y eventos = comunidad",
    body: "Usa el chat para coordinar el equipo. Registra encuentros presenciales u online — la movilización deja huella.",
  },
  {
    icon: Scale,
    title: "Asesórate con un abogado",
    body: "Civitapp organiza y documenta. Las tutelas y acciones constitucionales requieren revisión jurídica antes de radicar.",
  },
];

export function OnboardingModal({ show }: { show: boolean }) {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(!show);
  const router = useRouter();

  if (dismissed) return null;

  const SlideIcon = SLIDES[step].icon;
  const isLast = step === SLIDES.length - 1;

  async function finish() {
    await markOnboardedAction();
    setDismissed(true);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-md w-full rounded-card border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xl">
        <SlideIcon className="h-10 w-10 text-[var(--accent)]" />
        <h2 className="font-display text-xl font-bold">{SLIDES[step].title}</h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed">{SLIDES[step].body}</p>
        <div className="flex gap-1 justify-center">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${i === step ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
            />
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              Atrás
            </Button>
          )}
          {isLast ? (
            <Button type="button" variant="accent" onClick={() => void finish()}>
              Entendido
            </Button>
          ) : (
            <Button type="button" variant="accent" onClick={() => setStep((s) => s + 1)}>
              Siguiente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
