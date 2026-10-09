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
  type SquishFrame,
  type SquishVisual,
} from "../squish/physics";
import { bodyMapOf, drawSoftBody } from "../squish/render";
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

function paintReduced(el: HTMLElement, visual: SquishVisual) {
  el.style.transform = `translate3d(0, 0, 0) scale(${visual.sx.toFixed(4)})`;
}

function restVisual(): SquishVisual {
  return {
    sx: 1,
    sy: 1,
    x: 0,
    y: 0,
    rot: 0,
    dentX: 0,
    dentY: 0,
    depth: 0,
    spread: 1,
    contact: 0,
  };
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
  const ref = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const body = useRef<SquishBody>(restBody());
  const gesture = useRef<Gesture>(gestureStart());
  const frame = useRef<SquishFrame>(idleFrame());
  const visual = useRef<SquishVisual>(restVisual());
  const raf = useRef(0);
  const last = useRef(0);
  const pointer = useRef<number | null>(null);
  const localSquish = useRef(0);
  const popTimer = useRef(0);
  const alive = useRef(true);
  const seen = useRef(true);
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
    const canvas = canvasRef.current;
    let observer: IntersectionObserver | null = null;
    if (node && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        seen.current = entries.some((entry) => entry.isIntersecting);
        if (seen.current) kick();
      });
      observer.observe(node);
    }
    return () => {
      alive.current = false;
      observer?.disconnect();
      if (raf.current) cancelAnimationFrame(raf.current);
      window.clearTimeout(popTimer.current);
      if (node) {
        node.style.transform = "";
        node.dataset.live = "no";
      }
      if (canvas) canvas.width = 0;
    };
  }, []);

  function renderMesh() {
    const el = ref.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const img = el.querySelector("img");
    if (!(img instanceof HTMLImageElement)) return;
    canvas.style.left = `${img.offsetLeft}px`;
    canvas.style.top = `${img.offsetTop}px`;
    canvas.style.width = `${img.offsetWidth}px`;
    canvas.style.height = `${img.offsetHeight}px`;
    drawSoftBody(canvas, img, body.current, visual.current, bodyMapOf(img));
    el.style.transform = "";
    el.dataset.live = "yes";
  }

  function kick() {
    if (raf.current || !alive.current) return;
    if (!seen.current && !frame.current.pressing) return;
    last.current = 0;
    raf.current = requestAnimationFrame(loop);
  }

  function loop(now: number) {
    if (!alive.current) return;
    if (!seen.current && !frame.current.pressing) {
      raf.current = 0;
      return;
    }
    const dt = last.current === 0 ? 1 / 60 : Math.min(0.034, (now - last.current) / 1000);
    last.current = now;
    const live = frame.current;
    if (live.pressing && gesture.current.phase === "down") {
      live.hold01 = holdAmount(performance.now() - gesture.current.downAt);
    }
    live.reduced = reducedRef.current;
    const stepped = stepSquish(body.current, live, dt);
    body.current = stepped.body;
    visual.current = stepped.visual;
    if (live.impulse !== "none") frame.current = { ...live, impulse: "none" };
    const el = ref.current;
    const moving = !squishSettled(body.current, frame.current.pressing);
    if (el) {
      if (!moving) {
        el.style.transform = "";
        el.dataset.live = "no";
        body.current = restBody();
        visual.current = restVisual();
      } else if (live.reduced) {
        el.dataset.live = "no";
        paintReduced(el, stepped.visual);
      } else {
        renderMesh();
      }
    }
    if (moving && alive.current && (seen.current || frame.current.pressing)) {
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
      width: point.width,
      height: point.height,
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
      frame.current = {
        ...idleFrame(reducedRef.current),
        impulse: "release",
        nx: point.nx,
        ny: point.ny,
        width: point.width,
        height: point.height,
      };
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
      width: point.width,
      height: point.height,
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
    frame.current = {
      ...idleFrame(reducedRef.current),
      impulse: plan.impulse,
      nx: point.nx,
      ny: point.ny,
      dx: plan.dx,
      dy: plan.dy,
      width: point.width,
      height: point.height,
    };
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
      <span className="ac-squish-stage">
        {children}
        <canvas ref={canvasRef} className="ac-squish-view" aria-hidden="true" />
      </span>
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

function readPoint(event: ReactPointerEvent<HTMLSpanElement>): {
  x: number;
  y: number;
  nx: number;
  ny: number;
  width: number;
  height: number;
} {
  const img = event.currentTarget.querySelector("img");
  const box = (img instanceof HTMLImageElement ? img : event.currentTarget).getBoundingClientRect();
  const localX = event.clientX - box.left;
  const localY = event.clientY - box.top;
  if (img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0 && box.width > 0 && box.height > 0) {
    const map = bodyMapOf(img);
    const fit = contain(box.width, box.height, img.naturalWidth, img.naturalHeight);
    const u = (localX - fit.x) / Math.max(1, fit.w);
    const v = (localY - fit.y) / Math.max(1, fit.h);
    const bw = Math.max(0.2, map.u1 - map.u0);
    const bh = Math.max(0.2, map.v1 - map.v0);
    const bx = (u - map.u0) / bw;
    const by = (v - map.v0) / bh;
    return {
      x: event.clientX,
      y: event.clientY,
      nx: clampUnit(bx * 2 - 1),
      ny: clampUnit(by * 2 - 1),
      width: box.width * bw,
      height: box.height * bh,
    };
  }
  const norm = touchNorm(localX, localY, box.width, box.height);
  return { x: event.clientX, y: event.clientY, nx: norm.nx, ny: norm.ny, width: box.width || 100, height: box.height || 100 };
}

function contain(boxW: number, boxH: number, imgW: number, imgH: number): { x: number; y: number; w: number; h: number } {
  const s = Math.min(boxW / imgW, boxH / imgH);
  const w = imgW * s;
  const h = imgH * s;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
}

function clampUnit(n: number): number {
  return Math.max(-1, Math.min(1, n));
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
