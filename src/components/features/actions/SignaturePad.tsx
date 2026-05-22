"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SignaturePadHandle = {
  exportPngBlob: () => Promise<Blob | null>;
  clear: () => void;
  hasStroke: () => boolean;
};

export const SignaturePad = forwardRef<SignaturePadHandle>(function SignaturePad(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStrokeRef = useRef(false);
  const [, setTick] = useState(0);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, [setupCanvas]);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawing.current = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasStrokeRef.current) {
      hasStrokeRef.current = true;
      setTick((t) => t + 1);
    }
  }

  function endDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  }

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasStrokeRef.current = false;
    setTick((t) => t + 1);
  }, []);

  useImperativeHandle(ref, () => ({
    exportPngBlob: () => {
      const canvas = canvasRef.current;
      if (!canvas || !hasStrokeRef.current) return Promise.resolve(null);
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png");
      });
    },
    clear,
    hasStroke: () => hasStrokeRef.current,
  }));

  return (
    <div className="space-y-2 w-full">
      <div className="rounded-lg border-2 border-dashed border-[var(--border)] bg-white touch-none w-full">
        <canvas
          ref={canvasRef}
          className="w-full h-36 sm:h-40 cursor-crosshair block"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
      </div>
      <p className="text-xs text-[var(--muted)]">Dibuja tu firma aquí (mouse o dedo).</p>
      <Button type="button" variant="outline" size="sm" onClick={clear} className="gap-1.5">
        <Eraser className="h-4 w-4" />
        Borrar firma
      </Button>
    </div>
  );
});
