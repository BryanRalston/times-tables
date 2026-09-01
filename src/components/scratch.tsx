import { useEffect, useRef, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScratchPad() {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = ref.current;
    if (!c || !open) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = "#1f1a14";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
    };
    resize();
    const pos = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      drawing.current = true;
      c.setPointerCapture(e.pointerId);
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const move = (e: PointerEvent) => {
      if (!drawing.current) return;
      const p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };
    const up = () => {
      drawing.current = false;
    };
    c.addEventListener("pointerdown", down);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", up);
    return () => {
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerup", up);
      c.removeEventListener("pointercancel", up);
    };
  }, [open]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
          <Pencil className="size-4" />
          {open ? "Hide pad" : "Work it out"}
        </Button>
        {open ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const c = ref.current;
              const ctx = c?.getContext("2d");
              if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
            }}
          >
            <RotateCcw className="size-4" />
            Clear
          </Button>
        ) : null}
      </div>
      {open ? (
        <canvas
          ref={ref}
          className="h-36 w-full touch-none rounded-[16px] border border-line bg-surface"
          aria-label="Scratch pad"
        />
      ) : null}
    </div>
  );
}
