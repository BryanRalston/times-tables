import { GRADE3_PATH_NODES, type PathNodePos } from "./grade-path";

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

export function hopUnitStops(fromNumber: number, toNumber: number, total = GRADE3_PATH_NODES.length): number[] {
  const a = Math.min(total, Math.max(1, Math.round(fromNumber)));
  const b = Math.min(total, Math.max(1, Math.round(toNumber)));
  if (a === b) return [a];
  const step = a < b ? 1 : -1;
  const out: number[] = [a];
  for (let n = a + step; n !== b; n += step) out.push(n);
  out.push(b);
  return out;
}

export function hopTravelMs(stops: readonly number[]): number {
  const hops = Math.max(0, stops.length - 1);
  if (hops === 0) return 0;
  return hops * (HOP_MS + LAND_MS);
}

export function hopProgressAt(
  elapsedMs: number,
  hopCount: number,
): {
  hopIndex: number;
  t: number;
  phase: HopPhase;
  done: boolean;
} {
  if (hopCount <= 0) return { hopIndex: 0, t: 1, phase: "land", done: true };
  const cycle = HOP_MS + LAND_MS;
  const total = hopCount * cycle;
  if (elapsedMs >= total) return { hopIndex: hopCount - 1, t: 1, phase: "land", done: true };
  const hopIndex = Math.min(hopCount - 1, Math.max(0, Math.floor(elapsedMs / cycle)));
  const local = elapsedMs - hopIndex * cycle;
  if (local < HOP_MS) return { hopIndex, t: clamp01(local / HOP_MS), phase: "air", done: false };
  return { hopIndex, t: clamp01((local - HOP_MS) / LAND_MS), phase: "land", done: false };
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

export function hopLiftPercent(from: PathNodePos, to: PathNodePos): number {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.min(6.4, 3.3 + dist * 0.26);
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

export function hopAlong(from: PathNodePos, to: PathNodePos, t: number): HopPose {
  const u = easeHopTravel(t);
  const liftAmt = Math.sin(Math.PI * clamp01(t));
  const lift = hopLiftPercent(from, to) * liftAmt;
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
