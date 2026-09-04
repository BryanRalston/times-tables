import { useEffect, useRef, useState, type AnimationEvent, type ReactNode } from "react";
import { MagentaImg, MagentaVideo, skipPokeVideo } from "@/components/magenta-video";
import {
  squisheeById,
  squisheeCheerSrc,
  squisheeCheerStrip,
  squisheePokeSrc,
  squisheePokeStrip,
  squisheeSrc,
  type PokeStripMeta,
} from "@/lib/squishees";
import { cn } from "@/lib/utils";

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
      className={cn("block overflow-visible", active && "squash", className)}
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

export function PokeToy({
  id,
  size = "md",
  bob = false,
  className,
  cheer = false,
  onCheerEnd,
}: {
  id: string;
  size?: "sm" | "md" | "lg";
  bob?: boolean;
  className?: string;
  /** Autoplay hop once (buy). Never squash, never the poke clip. */
  cheer?: boolean;
  onCheerEnd?: () => void;
}) {
  const onCheerEndRef = useRef(onCheerEnd);
  onCheerEndRef.current = onCheerEnd;
  const s = squisheeById(id);
  const pokeClip = squisheePokeSrc(id);
  const pokeStrip = squisheePokeStrip(id);
  const cheerClip = squisheeCheerSrc(id);
  const cheerStrip = squisheeCheerStrip(id);
  const skipVideo = skipPokeVideo();
  const cheerVideo = Boolean(cheer) && Boolean(cheerClip) && !skipVideo;
  const cheerSprite = Boolean(cheer) && Boolean(cheerStrip) && !cheerVideo;
  const cheerPop = Boolean(cheer) && !cheerClip && !cheerStrip;

  const [poking, setPoking] = useState(false);
  const [pokeTick, setPokeTick] = useState(0);
  const [clipOn, setClipOn] = useState(cheerVideo);
  const [clipReady, setClipReady] = useState(false);
  const [stripOn, setStripOn] = useState(cheerSprite);

  useEffect(() => {
    if (!cheerPop) return;
    const t = window.setTimeout(() => onCheerEndRef.current?.(), 360);
    return () => window.clearTimeout(t);
  }, [cheerPop]);

  const videoSrc = cheer ? cheerClip : pokeClip;
  const strip = cheer ? cheerStrip : pokeStrip;
  const playPokeClip = Boolean(pokeClip) && !skipVideo;
  const playPokeStrip = Boolean(pokeStrip) && !playPokeClip;

  function stopClip() {
    setClipOn(false);
    setClipReady(false);
  }

  function stopStrip() {
    setStripOn(false);
  }

  function stopCheer() {
    setClipOn(false);
    setClipReady(false);
    setStripOn(false);
    onCheerEndRef.current?.();
  }

  return (
    <button
      type="button"
      data-cheer={cheer ? "1" : "0"}
      className={cn(
        "relative shrink-0 touch-manipulation select-none overflow-visible border-0 bg-transparent p-0",
        size === "sm" && "h-20 w-20",
        size === "md" && "h-32 w-32",
        size === "lg" && "h-44 w-44 sm:h-52 sm:w-52",
        className,
      )}
      aria-label={s ? `Poke ${s.name}` : "Poke"}
      onClick={() => {
        if (cheer) return;
        setPokeTick((n) => n + 1);
        setPoking(true);
        if (playPokeClip) setClipOn(true);
        else if (playPokeStrip) setStripOn(true);
      }}
    >
      <SquashOnPoke
        key={pokeTick}
        active={poking && !cheer}
        className={cn(
          "relative h-full w-full overflow-visible",
          cheerPop && "unlock-pop",
          !cheer && !poking && !stripOn && !clipOn && bob && "idle-bob",
        )}
        onRest={() => setPoking(false)}
        onPopEnd={() => onCheerEndRef.current?.()}
      >
        <MagentaImg src={squisheeSrc(id)} alt="" className={cn("h-full w-full", (clipReady || stripOn) && "invisible")} />
        {clipOn && videoSrc ? (
          <MagentaVideo
            src={videoSrc}
            className="absolute inset-0 h-full w-full"
            onReady={() => setClipReady(true)}
            onFail={cheer ? stopCheer : stopClip}
            onEnded={cheer ? stopCheer : stopClip}
          />
        ) : null}
        {stripOn && strip ? (
          <PokeStrip
            src={strip.src}
            frames={strip.frames}
            fps={strip.fps}
            className="absolute inset-0 h-full w-full"
            onEnded={cheer ? stopCheer : stopStrip}
          />
        ) : null}
      </SquashOnPoke>
    </button>
  );
}
