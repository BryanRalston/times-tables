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
      className={cn("block", active && "squash", className)}
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
  const [clipOn, setClipOn] = useState(false);
  const s = squisheeById(id);
  const clip = squisheePokeSrc(id);
  const playClip = Boolean(clip) && !skipPokeVideo();

  return (
    <button
      type="button"
      className={cn(
        "relative shrink-0 touch-manipulation select-none border-0 bg-transparent p-0",
        size === "sm" && "h-20 w-20",
        size === "md" && "h-32 w-32",
        size === "lg" && "h-44 w-44 sm:h-52 sm:w-52",
        className,
      )}
      aria-label={s ? `Poke ${s.name}` : "Poke"}
      onClick={() => {
        setPoking(true);
        if (playClip) setClipOn(true);
      }}
    >
      <SquashOnPoke
        active={poking}
        className={cn("relative h-full w-full", !poking && bob && "idle-bob")}
        onRest={() => setPoking(false)}
      >
        <MagentaImg
          src={squisheeSrc(id)}
          alt=""
          className={cn("h-full w-full", clipOn && playClip && "invisible")}
        />
        {clipOn && clip ? (
          <MagentaVideo src={clip} className="absolute inset-0 h-full w-full" onEnded={() => setClipOn(false)} />
        ) : null}
      </SquashOnPoke>
    </button>
  );
}
