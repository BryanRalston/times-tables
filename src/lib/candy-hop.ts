import { GRADE3_PATH_NODES, type PathNodePos } from "./grade-path";

export type HopPose = {
  x: number;
  y: number;
  squashX: number;
  squashY: number;
};

/** One pad-to-pad hop. */
export const HOP_MS = 520;

/** Brief settle on a pad before the next hop. */
export const LAND_MS = 72;

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
  return hops * HOP_MS + (hops - 1) * LAND_MS;
}

export function hopProgressAt(elapsedMs: number, hopCount: number): {
  hopIndex: number;
  t: number;
  done: boolean;
} {
  if (hopCount <= 0) return { hopIndex: 0, t: 1, done: true };
  const cycle = HOP_MS + LAND_MS;
  const total = hopCount * HOP_MS + (hopCount - 1) * LAND_MS;
  if (elapsedMs >= total) return { hopIndex: hopCount - 1, t: 1, done: true };
  const hopIndex = Math.min(hopCount - 1, Math.max(0, Math.floor(elapsedMs / cycle)));
  const local = elapsedMs - hopIndex * cycle;
  return { hopIndex, t: clamp01(local / HOP_MS), done: false };
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

export function hopLiftPercent(from: PathNodePos, to: PathNodePos): number {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.min(6.4, 3.3 + dist * 0.26);
}

export function hopAlong(from: PathNodePos, to: PathNodePos, t: number): HopPose {
  const u = easeHopTravel(t);
  const lift = hopLiftPercent(from, to) * Math.sin(Math.PI * clamp01(t));
  const squash = hopSquash(t);
  return {
    x: from.x + (to.x - from.x) * u,
    y: from.y + (to.y - from.y) * u - lift,
    squashX: squash.x,
    squashY: squash.y,
  };
}

export function restHopPose(pos: PathNodePos): HopPose {
  return { x: pos.x, y: pos.y, squashX: 1, squashY: 1 };
}
