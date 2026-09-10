import type { PathNodePos } from "./grade-path";
import { RADIAL_PAD_COUNT, areAdjacent, clampPad, radialHopStops } from "./radial-web";

export type HopPhase = "air" | "land";

export type PathHopSfx = "hop" | "land";

export type HopPose = {
  x: number;
  y: number;
  squashX: number;
  squashY: number;
  shadowX: number;
  shadowY: number;
  shadowScale: number;
  shadowOpacity: number;
};

/** One pad-to-pad hop. */
export const HOP_MS = 520;

/** Longer air time so water-crossing vaults read as a hop. */
export const OBSTACLE_HOP_MS = 740;

/** Extra lift (map %) so water spans clear the shoulder boulder / cove. */
export const OBSTACLE_LIFT_PERCENT = 8.1;

/** No water vaults on the radial web — every hop is a one-space tile jump. */
export const OBSTACLE_HOP_SPANS: readonly (readonly [number, number])[] = [];

/** Primary water-rise vault (meadow → cove). */
export const OBSTACLE_HOP_FROM = 4;
export const OBSTACLE_HOP_TO = 5;

/** Squash and settle on a pad, including after the last hop. */
export const LAND_MS = 160;

const REST_SHADOW_SCALE = 1;
const REST_SHADOW_OPACITY = 0.14;

export function clamp01(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t;
}

/** Smoothstep so the hopper eases off and onto each pad. */
export function easeHopTravel(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export function hopUnitStops(fromNumber: number, toNumber: number, _total = RADIAL_PAD_COUNT): number[] {
  return radialHopStops(fromNumber, toNumber);
}

export function hopIsOneSpace(fromNumber: number, toNumber: number): boolean {
  const a = clampPad(fromNumber);
  const b = clampPad(toNumber);
  return a === b || areAdjacent(a, b);
}

export function hopSpanIsObstacle(fromNumber: number, toNumber: number): boolean {
  const a = Math.min(fromNumber, toNumber);
  const b = Math.max(fromNumber, toNumber);
  return OBSTACLE_HOP_SPANS.some(([from, to]) => a === from && b === to);
}

export function hopSpanMs(fromNumber: number, toNumber: number): number {
  return hopSpanIsObstacle(fromNumber, toNumber) ? OBSTACLE_HOP_MS : HOP_MS;
}

export function hopAirMsList(stops: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < stops.length - 1; i++) out.push(hopSpanMs(stops[i]!, stops[i + 1]!));
  return out;
}

export function hopTravelMs(stops: readonly number[]): number {
  if (stops.length < 2) return 0;
  let ms = 0;
  for (let i = 0; i < stops.length - 1; i++) ms += hopSpanMs(stops[i]!, stops[i + 1]!) + LAND_MS;
  return ms;
}

function airMsAt(hopIndex: number, airMs: number | readonly number[]): number {
  if (typeof airMs === "number") return airMs;
  return airMs[hopIndex] ?? HOP_MS;
}

export function hopProgressAt(
  elapsedMs: number,
  hopCount: number,
  airMs: number | readonly number[] = HOP_MS,
): {
  hopIndex: number;
  t: number;
  phase: HopPhase;
  done: boolean;
} {
  if (hopCount <= 0) return { hopIndex: 0, t: 1, phase: "land", done: true };
  let acc = 0;
  for (let i = 0; i < hopCount; i++) {
    const air = airMsAt(i, airMs);
    const cycle = air + LAND_MS;
    if (elapsedMs < acc + cycle) {
      const local = elapsedMs - acc;
      if (local < air) return { hopIndex: i, t: clamp01(local / air), phase: "air", done: false };
      return { hopIndex: i, t: clamp01((local - air) / LAND_MS), phase: "land", done: false };
    }
    acc += cycle;
  }
  return { hopIndex: hopCount - 1, t: 1, phase: "land", done: true };
}

/** One hop takeoff and one land tick per pad jump — not every animation frame. */
export function pathHopSfxKind(
  prev: { hopIndex: number; phase: HopPhase } | null,
  next: { hopIndex: number; phase: HopPhase; done: boolean },
): PathHopSfx | null {
  if (next.done) return null;
  switch (next.phase) {
    case "air":
      if (!prev || prev.hopIndex !== next.hopIndex) return "hop";
      return null;
    case "land":
      if (prev?.phase !== "land") return "land";
      return null;
    default: {
      const _never: never = next.phase;
      return _never;
    }
  }
}

export function hopSquash(t: number): { x: number; y: number } {
  const x = clamp01(t);
  if (x < 0.13) {
    const s = 1 - x / 0.13;
    return { x: 1 + 0.15 * s, y: 1 - 0.13 * s };
  }
  if (x > 0.87) {
    const s = (x - 0.87) / 0.13;
    return { x: 1 + 0.17 * s, y: 1 - 0.15 * s };
  }
  const lift = Math.sin(Math.PI * x);
  return { x: 1 - 0.05 * lift, y: 1 + 0.08 * lift };
}

/** Impact squash, then ease back to rest on the same pad. */
export function hopLandSquash(t: number): { x: number; y: number } {
  const u = clamp01(t);
  const land = hopSquash(1);
  if (u < 0.38) {
    const s = easeHopTravel(u / 0.38);
    return { x: land.x + 0.07 * s, y: land.y - 0.06 * s };
  }
  const s = 1 - (1 - (u - 0.38) / 0.62) ** 2;
  const peakX = land.x + 0.07;
  const peakY = land.y - 0.06;
  return { x: peakX + (1 - peakX) * s, y: peakY + (1 - peakY) * s };
}

export function hopLiftPercent(from: PathNodePos, to: PathNodePos, clearObstacle = false): number {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const base = Math.min(6.4, 3.3 + dist * 0.26);
  if (clearObstacle) return Math.max(base, OBSTACLE_LIFT_PERCENT);
  return base;
}

function withShadow(pos: PathNodePos, scale: number, opacity: number, squash: { x: number; y: number }): HopPose {
  return {
    x: pos.x,
    y: pos.y,
    squashX: squash.x,
    squashY: squash.y,
    shadowX: pos.x,
    shadowY: pos.y,
    shadowScale: scale,
    shadowOpacity: opacity,
  };
}

export function hopAlong(from: PathNodePos, to: PathNodePos, t: number, clearObstacle = false): HopPose {
  const u = easeHopTravel(t);
  const liftAmt = Math.sin(Math.PI * clamp01(t));
  const lift = hopLiftPercent(from, to, clearObstacle) * liftAmt;
  const squash = hopSquash(t);
  const ground = { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u };
  return {
    x: ground.x,
    y: ground.y - lift,
    squashX: squash.x,
    squashY: squash.y,
    shadowX: ground.x,
    shadowY: ground.y,
    shadowScale: 1 + 0.42 * liftAmt,
    shadowOpacity: 0.22 - 0.1 * liftAmt,
  };
}

export function hopLandSettle(pos: PathNodePos, t: number): HopPose {
  const u = clamp01(t);
  const squash = hopLandSquash(u);
  return withShadow(pos, REST_SHADOW_SCALE, 0.22 - 0.08 * u, squash);
}

export function restHopPose(pos: PathNodePos): HopPose {
  return withShadow(pos, REST_SHADOW_SCALE, REST_SHADOW_OPACITY, { x: 1, y: 1 });
}
