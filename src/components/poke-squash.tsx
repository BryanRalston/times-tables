import { useEffect, useRef, type AnimationEvent, type ReactNode } from "react";
import type { PokeStripMeta } from "@/lib/squishees";
import { cn } from "@/lib/utils";
import "./poke-squish.css";

export function SquashOnPoke({
  active,
  className,
  children,
  onRest,
  onPopEnd,
}: {
  active: boolean;
  className?: string;
  children: ReactNode;
  onRest?: () => void;
  onPopEnd?: () => void;
}) {
  return (
    <span
      data-squash={active ? "1" : "0"}
      className={cn("block overflow-visible", active && "squash poke-bounce", className)}
      onAnimationEnd={(e: AnimationEvent<HTMLSpanElement>) => {
        if (e.animationName === "squash") onRest?.();
        if (e.animationName === "unlock-pop") onPopEnd?.();
      }}
    >
      {children}
    </span>
  );
}

/** CSS steps() sprite. Used when chroma-key video is skipped (iOS / coarse). */
export function PokeStrip({
  src,
  frames,
  fps,
  className,
  onEnded,
}: Pick<PokeStripMeta, "src" | "frames" | "fps"> & {
  className?: string;
  onEnded?: () => void;
}) {
  const done = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const duration = frames / Math.max(fps, 1);

  useEffect(() => {
    done.current = false;
    const t = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onEndedRef.current?.();
    }, duration * 1000 + 80);
    return () => window.clearTimeout(t);
  }, [src, frames, fps, duration]);

  function finish(name: string) {
    if (name !== "poke-strip" || done.current) return;
    done.current = true;
    onEndedRef.current?.();
  }

  return (
    <span
      aria-hidden
      className={cn("poke-strip poke-strip-run pointer-events-none", className)}
      style={{
        backgroundImage: `url("${src}")`,
        backgroundSize: `${frames * 100}% 100%`,
        animationDuration: `${duration}s`,
        animationTimingFunction: `steps(${frames}, jump-none)`,
      }}
      onAnimationEnd={(e: AnimationEvent<HTMLSpanElement>) => finish(e.animationName)}
    />
  );
}
