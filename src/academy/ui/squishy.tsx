import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { catchphrase } from "../buddy/lines";
import { squishTone } from "../sound";
import { applyPointer, gestureStart, holdAmount, type Gesture, type SquishRole } from "../squish/gesture";
import {
  idleFrame,
  restBody,
  squishSettled,
  stepSquish,
  touchNorm,
  type SquishBody,
  type SquishFace,
  type SquishFrame,
  type SquishVisual,
} from "../squish/physics";
import { bumpSquishCount, getSquishCount, squishBuzz, squishFlourish, subscribeSquish } from "../squish/rewards";
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

function paint(el: HTMLElement, visual: SquishVisual, expression: boolean) {
  const face: SquishFace = expression ? visual.face : "rest";
  el.style.transform = `translate3d(${visual.x.toFixed(2)}px, ${visual.y.toFixed(2)}px, 0) rotate(${visual.rot.toFixed(2)}deg) scale(${visual.sx.toFixed(4)}, ${visual.sy.toFixed(4)})`;
  el.style.transformOrigin = `${(50 + visual.dentX * 18).toFixed(1)}% ${(44 + visual.dentY * 16).toFixed(1)}%`;
  el.dataset.face = face;
}

export function Squishy({
  id,
  role = "toy",
  expression = true,
  lines = true,
  className,
  children,
}: {
  id: string;
  role?: SquishRole;
  expression?: boolean;
  lines?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const body = useRef<SquishBody>(restBody());
  const gesture = useRef<Gesture>(gestureStart());
  const frame = useRef<SquishFrame>(idleFrame());
  const raf = useRef(0);
  const last = useRef(0);
  const pointer = useRef<number | null>(null);
  const localSquish = useRef(0);
  const popTimer = useRef(0);
  const alive = useRef(true);
  const expressionRef = useRef(expression);
  expressionRef.current = expression;
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const soundOn = useSoundEnabled();
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;
  const [pop, setPop] = useState<{ hearts: boolean; line: string }>({ hearts: false, line: "" });

  useEffect(() => {
    alive.current = true;
    const node = ref.current;
    return () => {
      alive.current = false;
      if (raf.current) cancelAnimationFrame(raf.current);
      window.clearTimeout(popTimer.current);
      if (node) node.style.transform = "";
    };
  }, []);

  function kick() {
    if (raf.current) return;
    last.current = 0;
    raf.current = requestAnimationFrame(loop);
  }

  function loop(now: number) {
    if (!alive.current) return;
    const dt = last.current === 0 ? 1 / 60 : Math.min(0.034, (now - last.current) / 1000);
    last.current = now;
    const live = frame.current;
    if (live.pressing && gesture.current.phase === "down") {
      live.hold01 = holdAmount(performance.now() - gesture.current.downAt);
    }
    live.reduced = reducedRef.current;
    const stepped = stepSquish(body.current, live, dt);
    body.current = stepped.body;
    if (live.impulse !== "none") frame.current = { ...live, impulse: "none" };
    const el = ref.current;
    const moving = !squishSettled(body.current, frame.current.pressing);
    if (el) {
      if (moving) {
        paint(el, stepped.visual, expressionRef.current);
        el.dataset.live = "yes";
      } else {
        el.style.transform = "";
        el.style.transformOrigin = "";
        el.dataset.face = "rest";
        el.dataset.live = "no";
        body.current = restBody();
      }
    }
    if (moving && alive.current) {
      raf.current = requestAnimationFrame(loop);
      return;
    }
    raf.current = 0;
  }

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

  function onPointerDown(event: ReactPointerEvent<HTMLSpanElement>) {
    if (event.button !== 0 || pointer.current !== null) return;
    const point = readPoint(event);
    const plan = applyPointer(gesture.current, { kind: "down", x: point.x, y: point.y, t: performance.now() }, role);
    gesture.current = plan.gesture;
    pointer.current = event.pointerId;
    if (plan.stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (plan.capture) capturePointer(event.currentTarget, event.pointerId);
    frame.current = {
      reduced: reducedRef.current,
      pressing: true,
      hold01: 0,
      dx: 0,
      dy: 0,
      nx: point.nx,
      ny: point.ny,
      impulse: "none",
    };
    squishTone(id, soundRef.current, "down");
    squishBuzz(reducedRef.current);
    kick();
  }

  function onPointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    if (pointer.current !== event.pointerId) return;
    const point = readPoint(event);
    const plan = applyPointer(gesture.current, { kind: "move", x: point.x, y: point.y, t: performance.now() }, role);
    gesture.current = plan.gesture;
    if (plan.stopPropagation) event.stopPropagation();
    if (plan.yieldScroll) {
      pointer.current = null;
      releasePointer(event.currentTarget, event.pointerId);
      frame.current = { ...idleFrame(reducedRef.current), impulse: "release", nx: point.nx, ny: point.ny };
      kick();
      return;
    }
    if (plan.capture && !hasCapture(event.currentTarget, event.pointerId)) {
      capturePointer(event.currentTarget, event.pointerId);
    }
    frame.current = {
      reduced: reducedRef.current,
      pressing: true,
      hold01: plan.hold01,
      dx: plan.dx,
      dy: plan.dy,
      nx: point.nx,
      ny: point.ny,
      impulse: "none",
    };
    kick();
  }

  function finish(event: ReactPointerEvent<HTMLSpanElement>, kind: "up" | "cancel") {
    if (pointer.current !== event.pointerId) return;
    const point = readPoint(event);
    const plan = applyPointer(gesture.current, { kind, x: point.x, y: point.y, t: performance.now() }, role);
    gesture.current = plan.gesture;
    pointer.current = null;
    if (plan.stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }
    releasePointer(event.currentTarget, event.pointerId);
    frame.current = { ...idleFrame(reducedRef.current), impulse: plan.impulse, nx: point.nx, ny: point.ny };
    if (plan.countSquish) {
      squishTone(id, soundRef.current, "up");
      squishBuzz(reducedRef.current);
      bumpSquishCount();
      showFlourish(role);
    }
    kick();
  }

  return (
    <span
      ref={ref}
      className={className ? `ac-squish ${className}` : "ac-squish"}
      data-squish={role}
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
      {children}
      {expression ? (
        <>
          <SquishFace />
          <span className="ac-squish-hee" aria-hidden="true">
            hee
          </span>
        </>
      ) : null}
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

function readPoint(event: ReactPointerEvent<HTMLSpanElement>): { x: number; y: number; nx: number; ny: number } {
  const box = event.currentTarget.getBoundingClientRect();
  const norm = touchNorm(event.clientX - box.left, event.clientY - box.top, box.width, box.height);
  return { x: event.clientX, y: event.clientY, nx: norm.nx, ny: norm.ny };
}

function SquishFace() {
  return (
    <svg className="ac-squish-face" viewBox="0 0 100 100" aria-hidden="true">
      <path className="ac-squish-eye" d="M28 40c4-7 12-7 16 0" />
      <path className="ac-squish-eye" d="M56 40c4-7 12-7 16 0" />
      <path className="ac-squish-smile" d="M38 62c4 7 20 7 24 0" />
      <circle className="ac-squish-blush" cx="24" cy="58" r="6" />
      <circle className="ac-squish-blush" cx="76" cy="58" r="6" />
    </svg>
  );
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
