export const HOLD_START_MS = 90;
export const HOLD_FULL_MS = 420;
export const DRAG_PX = 14;
export const TAP_MS = 240;
export const TAP_PX = 10;
export const FLICK_PX_PER_MS = 0.62;

export type SquishRole = "buddy" | "toy";

/** Where a squishee sits. Answer controls and the map hop stay ordinary taps. */
export type SquishPlace = "buddy" | "toy" | "answer" | "map";

export interface Gesture {
  phase: "idle" | "down";
  originX: number;
  originY: number;
  downAt: number;
  x: number;
  y: number;
  t: number;
  prevX: number;
  prevY: number;
  prevT: number;
  maxMove: number;
}

export interface Sample {
  kind: "down" | "move" | "up" | "cancel";
  x: number;
  y: number;
  t: number;
}

export interface PointerPlan {
  gesture: Gesture;
  mode: "idle" | "press" | "hold" | "drag" | "tap" | "release" | "flick" | "cancel";
  impulse: "none" | "tap" | "release" | "flick";
  pressing: boolean;
  hold01: number;
  dx: number;
  dy: number;
  speed: number;
  stopPropagation: boolean;
  /** Squish never chooses, skips, or scores an answer. */
  answers: false;
  capture: boolean;
  yieldScroll: boolean;
  countSquish: boolean;
}

export function gestureStart(): Gesture {
  return {
    phase: "idle",
    originX: 0,
    originY: 0,
    downAt: 0,
    x: 0,
    y: 0,
    t: 0,
    prevX: 0,
    prevY: 0,
    prevT: 0,
    maxMove: 0,
  };
}

export function holdAmount(elapsedMs: number): number {
  if (elapsedMs <= HOLD_START_MS) return 0;
  const t = (elapsedMs - HOLD_START_MS) / HOLD_FULL_MS;
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  return t;
}

export function squishHitPolicy(place: SquishPlace): { interactive: boolean; stopPropagation: boolean; answers: false } {
  switch (place) {
    case "answer":
    case "map":
      return { interactive: false, stopPropagation: false, answers: false };
    case "buddy":
      return { interactive: true, stopPropagation: true, answers: false };
    case "toy":
      return { interactive: true, stopPropagation: false, answers: false };
    default: {
      const neverPlace: never = place;
      return neverPlace;
    }
  }
}

function idlePlan(gesture: Gesture, role: SquishRole): PointerPlan {
  return {
    gesture,
    mode: "idle",
    impulse: "none",
    pressing: false,
    hold01: 0,
    dx: 0,
    dy: 0,
    speed: 0,
    stopPropagation: role === "buddy",
    answers: false,
    capture: false,
    yieldScroll: false,
    countSquish: false,
  };
}

/** Classify one pointer sample. Buddy presses stay on the buddy. */
export function applyPointer(gesture: Gesture, sample: Sample, role: SquishRole): PointerPlan {
  if (sample.kind === "down") {
    const next: Gesture = {
      phase: "down",
      originX: sample.x,
      originY: sample.y,
      downAt: sample.t,
      x: sample.x,
      y: sample.y,
      t: sample.t,
      prevX: sample.x,
      prevY: sample.y,
      prevT: sample.t,
      maxMove: 0,
    };
    return {
      gesture: next,
      mode: "press",
      impulse: "none",
      pressing: true,
      hold01: 0,
      dx: 0,
      dy: 0,
      speed: 0,
      stopPropagation: role === "buddy",
      answers: false,
      capture: role === "buddy",
      yieldScroll: false,
      countSquish: false,
    };
  }

  if (gesture.phase !== "down") return idlePlan(gesture, role);

  const dx = sample.x - gesture.originX;
  const dy = sample.y - gesture.originY;
  const moved = Math.hypot(dx, dy);
  const dt = Math.max(1, sample.t - gesture.prevT);
  const speed = Math.hypot(sample.x - gesture.prevX, sample.y - gesture.prevY) / dt;
  const next: Gesture = {
    ...gesture,
    x: sample.x,
    y: sample.y,
    t: sample.t,
    prevX: gesture.x,
    prevY: gesture.y,
    prevT: gesture.t,
    maxMove: Math.max(gesture.maxMove, moved),
  };
  const hold01 = holdAmount(sample.t - gesture.downAt);
  const sideways = Math.abs(gesture.x - gesture.originX) >= Math.abs(gesture.y - gesture.originY);
  const committed = gesture.maxMove >= DRAG_PX && sideways;
  const yieldScroll = role === "toy" && !committed && Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx) * 1.25;

  if (sample.kind === "cancel" || yieldScroll) {
    return {
      gesture: gestureStart(),
      mode: "cancel",
      impulse: "release",
      pressing: false,
      hold01: 0,
      dx: 0,
      dy: 0,
      speed,
      stopPropagation: role === "buddy",
      answers: false,
      capture: false,
      yieldScroll,
      countSquish: false,
    };
  }

  if (sample.kind === "move") {
    const dragging = next.maxMove >= DRAG_PX;
    let mode: PointerPlan["mode"] = "press";
    if (dragging) mode = "drag";
    else if (hold01 > 0) mode = "hold";
    return {
      gesture: next,
      mode,
      impulse: "none",
      pressing: true,
      hold01: dragging ? hold01 * 0.35 : hold01,
      dx: dragging ? dx : 0,
      dy: dragging ? dy : 0,
      speed,
      stopPropagation: role === "buddy",
      answers: false,
      capture: role === "buddy" || dragging,
      yieldScroll: false,
      countSquish: false,
    };
  }

  const duration = sample.t - gesture.downAt;
  const tap = next.maxMove < TAP_PX && duration < TAP_MS && hold01 < 0.2;
  const flick = !tap && speed >= FLICK_PX_PER_MS && next.maxMove >= DRAG_PX;
  let mode: PointerPlan["mode"] = "release";
  let impulse: PointerPlan["impulse"] = "release";
  if (tap) {
    mode = "tap";
    impulse = "tap";
  } else if (flick) {
    mode = "flick";
    impulse = "flick";
  }
  return {
    gesture: gestureStart(),
    mode,
    impulse,
    pressing: false,
    hold01: 0,
    dx: 0,
    dy: 0,
    speed,
    stopPropagation: role === "buddy",
    answers: false,
    capture: false,
    yieldScroll: false,
    countSquish: true,
  };
}

/** Replay a poke. Every plan refuses to answer. */
export function replayPointer(samples: readonly Sample[], role: SquishRole): PointerPlan[] {
  let gesture = gestureStart();
  const plans: PointerPlan[] = [];
  for (const sample of samples) {
    const plan = applyPointer(gesture, sample, role);
    plans.push(plan);
    gesture = plan.gesture;
  }
  return plans;
}
