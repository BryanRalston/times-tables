import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { MagentaVideo, skipPokeVideo } from "@/components/magenta-video";
import { pokeMotion, pokePlayback, type PokePlayback } from "@/components/poke-play";
import { PokeStrip, SquashOnPoke } from "@/components/poke-squash";
import { playTap } from "@/lib/sound";
import { catchphrase } from "../buddy/lines";
import { squisheeMediaUrl } from "../paths";
import { applyPointer, gestureStart, type Gesture, type SquishRole } from "../squish/gesture";
import { bumpSquishCount, getSquishCount, squishFlourish, subscribeSquish } from "../squish/rewards";
import { useSoundEnabled } from "./sound-context";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export function Squishy({
  id,
  role = "toy",
  lines = true,
  className,
  children,
}: {
  id: string;
  role?: SquishRole;
  lines?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const gesture = useRef<Gesture>(gestureStart());
  const pointer = useRef<number | null>(null);
  const localSquish = useRef(0);
  const popTimer = useRef(0);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const soundOn = useSoundEnabled();
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  const [pokeTick, setPokeTick] = useState(0);
  const [poking, setPoking] = useState(false);
  const [clipOn, setClipOn] = useState(false);
  const [clipReady, setClipReady] = useState(false);
  const [stripOn, setStripOn] = useState(false);
  const [pop, setPop] = useState<{ hearts: boolean; line: string }>({ hearts: false, line: "" });

  const motion = pokeMotion(reduced, academyPoke(id));

  useEffect(() => {
    return () => window.clearTimeout(popTimer.current);
  }, []);

  function showFlourish(nextRole: SquishRole) {
    localSquish.current += 1;
    const flourish = squishFlourish(localSquish.current, nextRole);
    const line = lines && flourish.line ? catchphrase(id) : "";
    const hearts = flourish.hearts;
    if (!line && !hearts) return;
    setPop({ hearts, line });
    window.clearTimeout(popTimer.current);
    popTimer.current = window.setTimeout(() => setPop({ hearts: false, line: "" }), 1400);
  }

  function playCountedPoke() {
    const next = pokeMotion(reducedRef.current, academyPoke(id));
    setPokeTick((n) => n + 1);
    setPoking(next.squash);
    setClipReady(false);
    setClipOn(Boolean(next.clip));
    setStripOn(Boolean(next.strip));
    if (soundRef.current) playTap();
    bumpSquishCount();
    showFlourish(role);
  }

  function stopClip() {
    setClipOn(false);
    setClipReady(false);
  }

  function stopStrip() {
    setStripOn(false);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLSpanElement>) {
    if (event.button !== 0 || pointer.current !== null) return;
    const plan = applyPointer(
      gesture.current,
      { kind: "down", x: event.clientX, y: event.clientY, t: performance.now() },
      role,
    );
    gesture.current = plan.gesture;
    pointer.current = event.pointerId;
    if (plan.stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (plan.capture) capturePointer(event.currentTarget, event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    if (pointer.current !== event.pointerId) return;
    const plan = applyPointer(
      gesture.current,
      { kind: "move", x: event.clientX, y: event.clientY, t: performance.now() },
      role,
    );
    gesture.current = plan.gesture;
    if (plan.stopPropagation) event.stopPropagation();
    if (plan.yieldScroll) {
      pointer.current = null;
      releasePointer(event.currentTarget, event.pointerId);
      return;
    }
    if (plan.capture && !hasCapture(event.currentTarget, event.pointerId)) {
      capturePointer(event.currentTarget, event.pointerId);
    }
  }

  function finish(event: ReactPointerEvent<HTMLSpanElement>, kind: "up" | "cancel") {
    if (pointer.current !== event.pointerId) return;
    const plan = applyPointer(
      gesture.current,
      { kind, x: event.clientX, y: event.clientY, t: performance.now() },
      role,
    );
    gesture.current = plan.gesture;
    pointer.current = null;
    if (plan.stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }
    releasePointer(event.currentTarget, event.pointerId);
    if (plan.countSquish) playCountedPoke();
  }

  const artOn = clipReady || stripOn;

  return (
    <span
      className={className ? `ac-squish ${className}` : "ac-squish"}
      data-squish={role}
      data-poke-art={artOn ? "on" : "off"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => finish(event, "up")}
      onPointerCancel={(event) => finish(event, "cancel")}
      onClick={(event) => {
        if (role !== "buddy") return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      <SquashOnPoke key={pokeTick} active={poking && motion.squash} className="ac-squish-stage">
        {children}
        {clipOn && motion.clip ? (
          <MagentaVideo
            src={motion.clip}
            className="ac-poke-clip"
            onReady={() => setClipReady(true)}
            onFail={stopClip}
            onEnded={stopClip}
          />
        ) : null}
        {stripOn && motion.strip ? (
          <PokeStrip
            src={motion.strip.src}
            frames={motion.strip.frames}
            fps={motion.strip.fps}
            className="ac-poke-clip"
            onEnded={stopStrip}
          />
        ) : null}
      </SquashOnPoke>
      {pop.line ? <span className="ac-squish-line">{pop.line}</span> : null}
      {pop.hearts ? (
        <span className="ac-squish-hearts" aria-hidden="true">
          <i>♥</i>
          <i>♥</i>
          <i>♥</i>
        </span>
      ) : null}
    </span>
  );
}

function academyPoke(id: string): PokePlayback {
  const played = pokePlayback(id, skipPokeVideo());
  return {
    clip: played.clip ? squisheeMediaUrl(played.clip) : null,
    strip: played.strip ? { ...played.strip, src: squisheeMediaUrl(played.strip.src) } : null,
  };
}

function capturePointer(el: HTMLElement, id: number) {
  try {
    el.setPointerCapture(id);
  } catch {
    /* A cancelled pointer has nothing to capture. The squish still plays. */
  }
}

function hasCapture(el: HTMLElement, id: number): boolean {
  try {
    return el.hasPointerCapture(id);
  } catch {
    return false;
  }
}

function releasePointer(el: HTMLElement, id: number) {
  try {
    if (el.hasPointerCapture(id)) el.releasePointerCapture(id);
  } catch {
    /* Already released. */
  }
}

export function SquishTally() {
  const count = useSyncExternalStore(subscribeSquish, getSquishCount, () => 0);
  if (count <= 0) return null;
  return (
    <p className="ac-squish-tally" data-squish-count={count}>
      Squish! {count}
    </p>
  );
}
