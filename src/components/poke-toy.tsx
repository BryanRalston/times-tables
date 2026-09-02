import { useState, type AnimationEvent, type ReactNode } from "react";
import { MagentaImg, MagentaVideo, skipPokeVideo } from "@/components/magenta-video";
import { squisheeById, squisheePokeSrc, squisheeSrc } from "@/lib/squishees";
import { cn } from "@/lib/utils";

export function SquashOnPoke({
  active,
  className,
  children,
  onRest,
}: {
  active: boolean;
  className?: string;
  children: ReactNode;
  onRest?: () => void;
}) {
  return (
    <span
      data-squash={active ? "1" : "0"}
      className={cn("block overflow-visible", active && "squash", className)}
      onAnimationEnd={(e: AnimationEvent<HTMLSpanElement>) => {
        if (e.animationName === "squash") onRest?.();
      }}
    >
      {children}
    </span>
  );
}

export function PokeToy({
  id,
  size = "md",
  bob = false,
  className,
}: {
  id: string;
  size?: "sm" | "md" | "lg";
  bob?: boolean;
  className?: string;
}) {
  const [poking, setPoking] = useState(false);
  const [pokeTick, setPokeTick] = useState(0);
  const [clipOn, setClipOn] = useState(false);
  const [clipReady, setClipReady] = useState(false);
  const s = squisheeById(id);
  const clip = squisheePokeSrc(id);
  const playClip = Boolean(clip) && !skipPokeVideo();

  function stopClip() {
    setClipOn(false);
    setClipReady(false);
  }

  return (
    <button
      type="button"
      className={cn(
        "relative shrink-0 touch-manipulation select-none overflow-visible border-0 bg-transparent p-0",
        size === "sm" && "h-20 w-20",
        size === "md" && "h-32 w-32",
        size === "lg" && "h-44 w-44 sm:h-52 sm:w-52",
        className,
      )}
      aria-label={s ? `Poke ${s.name}` : "Poke"}
      onClick={() => {
        setPokeTick((n) => n + 1);
        setPoking(true);
        if (playClip) setClipOn(true);
      }}
    >
      <SquashOnPoke
        key={pokeTick}
        active={poking}
        className={cn("relative h-full w-full overflow-visible", !poking && bob && "idle-bob")}
        onRest={() => setPoking(false)}
      >
        <MagentaImg src={squisheeSrc(id)} alt="" className={cn("h-full w-full", clipReady && "invisible")} />
        {clipOn && clip ? (
          <MagentaVideo
            src={clip}
            className="absolute inset-0 h-full w-full"
            onReady={() => setClipReady(true)}
            onFail={stopClip}
            onEnded={stopClip}
          />
        ) : null}
      </SquashOnPoke>
    </button>
  );
}
