import { useEffect, useRef, useState } from "react";
import { MagentaImg, MagentaVideo, skipPokeVideo } from "@/components/magenta-video";
import { pokePlayback } from "@/components/poke-play";
import { PokeStrip, SquashOnPoke } from "@/components/poke-squash";
import { canDressFace, dressedSquisheeSrc, wearForFace } from "@/lib/cosmetics";
import { useProgress } from "@/lib/progress";
import { playTap } from "@/lib/sound";
import { pathHopperId, squisheeById, squisheeCheerSrc, squisheeCheerStrip } from "@/lib/squishees";
import { cn } from "@/lib/utils";

export { PokeStrip, SquashOnPoke };

export function PokeToy({
  id,
  size = "md",
  bob = false,
  className,
  cheer = false,
  cosmetic,
  onCheerEnd,
}: {
  id: string;
  size?: "sm" | "md" | "lg";
  bob?: boolean;
  className?: string;
  /** Autoplay hop once (buy). Never squash, never the poke clip. */
  cheer?: boolean;
  /** Fitted wearable; omit to follow the chosen hopper's Shelf outfit. */
  cosmetic?: string | null;
  onCheerEnd?: () => void;
}) {
  const onCheerEndRef = useRef(onCheerEnd);
  onCheerEndRef.current = onCheerEnd;
  useProgress((s) => `${s.squishees.join("\0")}:${s.hopperId}:${s.equippedCosmetic}`);
  const live = useProgress.getState();
  const hopperId = pathHopperId(live.squishees, live.hopperId);
  const wear = cosmetic !== undefined ? cosmetic : wearForFace(id, hopperId, live.equippedCosmetic);
  const fitted = canDressFace(id, wear);
  const still = dressedSquisheeSrc(id, wear);
  const s = squisheeById(id);
  const skipVideo = skipPokeVideo();
  const played = pokePlayback(id, skipVideo);
  const pokeClip = played.clip;
  const pokeStrip = played.strip;
  const cheerClip = squisheeCheerSrc(id);
  const cheerStrip = squisheeCheerStrip(id);
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

  useEffect(() => {
    if (!cheer) return;
    const t = window.setTimeout(() => onCheerEndRef.current?.(), 2800);
    return () => window.clearTimeout(t);
  }, [cheer]);

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
      data-owned-poke="1"
      data-poke-bounce={poking && !cheer ? "1" : "0"}
      data-dressed={id}
      data-cosmetic={fitted ? wear : undefined}
      onClick={() => {
        if (cheer) onCheerEndRef.current?.();
        playTap();
        setPokeTick((n) => n + 1);
        setPoking(true);
        if (playPokeClip) {
          setClipOn(true);
        } else if (playPokeStrip) {
          setStripOn(true);
        }
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
        <MagentaImg
          src={still}
          alt=""
          className={cn("pointer-events-none h-full w-full", (clipReady || stripOn) && "invisible")}
        />
        {clipOn && videoSrc ? (
          <MagentaVideo
            src={videoSrc}
            className="pointer-events-none absolute inset-0 h-full w-full"
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
