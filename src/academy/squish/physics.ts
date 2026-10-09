export type SquishImpulse = "none" | "tap" | "release" | "flick";
export type SquishFace = "rest" | "squint" | "giggle";

export interface SquishBody {
  sx: number;
  sy: number;
  x: number;
  y: number;
  rot: number;
  vsx: number;
  vsy: number;
  vx: number;
  vy: number;
  vr: number;
}

export interface SquishVisual {
  sx: number;
  sy: number;
  x: number;
  y: number;
  rot: number;
  dentX: number;
  dentY: number;
  depth: number;
  face: SquishFace;
}

export interface SquishFrame {
  reduced: boolean;
  pressing: boolean;
  hold01: number;
  dx: number;
  dy: number;
  nx: number;
  ny: number;
  impulse: SquishImpulse;
}

const DRAG_PX = 14;

export function restBody(): SquishBody {
  return { sx: 1, sy: 1, x: 0, y: 0, rot: 0, vsx: 0, vsy: 0, vx: 0, vy: 0, vr: 0 };
}

export function idleFrame(reduced = false): SquishFrame {
  return { reduced, pressing: false, hold01: 0, dx: 0, dy: 0, nx: 0, ny: 0, impulse: "none" };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function spring(value: number, vel: number, target: number, dt: number, k: number, damp: number): [number, number] {
  const accel = -k * (value - target) - damp * vel;
  const nextVel = vel + accel * dt;
  return [value + nextVel * dt, nextVel];
}

interface Target {
  sx: number;
  sy: number;
  x: number;
  y: number;
  rot: number;
  dentX: number;
  dentY: number;
}

function holdTarget(hold01: number, nx: number, ny: number): Target {
  const h = clamp(hold01, 0, 1);
  const sx = 1 + 0.38 * h;
  return {
    sx,
    sy: 1 / sx,
    x: nx * 5 * h,
    y: 9 * h,
    rot: nx * -8 * h,
    dentX: clamp(nx, -1, 1),
    dentY: clamp(ny, -1, 1),
  };
}

function dragTarget(frame: SquishFrame): Target {
  const x = clamp(frame.dx * 0.45, -34, 34);
  const y = clamp(frame.dy * 0.45, -34, 34);
  const len = Math.hypot(frame.dx, frame.dy);
  const stretch = Math.min(0.24, len / 180);
  const along = len < 1 ? 0 : Math.abs(frame.dx) / len;
  const sx = 1 + stretch * along;
  const sy = (1 + stretch * (1 - along)) / (1 + stretch * 0.35);
  return {
    sx,
    sy,
    x,
    y,
    rot: clamp(frame.dx, -36, 36) * 0.16,
    dentX: clamp(frame.nx, -1, 1),
    dentY: clamp(frame.ny, -1, 1),
  };
}

function restTarget(): Target {
  return { sx: 1, sy: 1, x: 0, y: 0, rot: 0, dentX: 0, dentY: 0 };
}

function applyImpulse(body: SquishBody, impulse: SquishImpulse): SquishBody {
  switch (impulse) {
    case "none":
      return body;
    case "tap":
      return { ...body, sx: 1.26, sy: 0.7, y: 4, vsx: -2.4, vsy: 3.6, vy: -22, vx: body.vx, vr: 0 };
    case "release":
      return {
        ...body,
        vsx: body.vsx + (1 - body.sx) * 8,
        vsy: body.vsy + (1 - body.sy) * 6 + 1.15,
        vy: body.vy - 12,
      };
    case "flick":
      return {
        ...body,
        y: Math.min(body.y, -14),
        vsx: body.vsx + (1 - body.sx) * 5,
        vsy: body.vsy + 3.4,
        vy: -16,
      };
    default: {
      const neverImpulse: never = impulse;
      return neverImpulse;
    }
  }
}

function clampBody(body: SquishBody): SquishBody {
  return {
    sx: clamp(body.sx, 0.62, 1.58),
    sy: clamp(body.sy, 0.58, 1.48),
    x: clamp(body.x, -48, 48),
    y: clamp(body.y, -64, 36),
    rot: clamp(body.rot, -24, 24),
    vsx: clamp(body.vsx, -14, 14),
    vsy: clamp(body.vsy, -14, 14),
    vx: clamp(body.vx, -90, 90),
    vy: clamp(body.vy, -110, 90),
    vr: clamp(body.vr, -50, 50),
  };
}

function faceFor(depth: number, impulse: SquishImpulse): SquishFace {
  if (depth >= 0.72) return "giggle";
  if (depth >= 0.32 || impulse === "tap" || impulse === "flick") return "squint";
  return "rest";
}

function visualOf(body: SquishBody, target: Target, frame: SquishFrame): SquishVisual {
  const squash = Math.max(0, body.sx - body.sy);
  const depth = frame.pressing ? clamp(frame.hold01, 0, 1) : clamp(squash / 0.5, 0, 1);
  const denting = frame.pressing || frame.impulse !== "none";
  return {
    sx: body.sx,
    sy: body.sy,
    x: body.x,
    y: body.y,
    rot: body.rot,
    dentX: denting ? clamp(frame.nx, -1, 1) : target.dentX,
    dentY: denting ? clamp(frame.ny, -1, 1) : target.dentY,
    depth,
    face: faceFor(depth, frame.impulse),
  };
}

function stepReduced(body: SquishBody, frame: SquishFrame): { body: SquishBody; visual: SquishVisual } {
  const poke = frame.impulse === "none" ? 0 : 0.55;
  const press = frame.pressing ? clamp(Math.max(frame.hold01, poke), 0, 1) : poke;
  const target = 1 - 0.04 * press;
  const s = body.sx + (target - body.sx) * 0.35;
  const next: SquishBody = { sx: s, sy: s, x: 0, y: 0, rot: 0, vsx: 0, vsy: 0, vx: 0, vy: 0, vr: 0 };
  return {
    body: next,
    visual: {
      sx: s,
      sy: s,
      x: 0,
      y: 0,
      rot: 0,
      dentX: 0,
      dentY: 0,
      depth: press * 0.35,
      face: press > 0.6 ? "squint" : "rest",
    },
  };
}

/** One animation frame. Soft spring on the way back, stiffer while the finger is down. */
export function stepSquish(body: SquishBody, frame: SquishFrame, dt: number): { body: SquishBody; visual: SquishVisual } {
  if (frame.reduced) return stepReduced(body, frame);
  const step = dt > 0 && dt < 0.05 ? dt : 1 / 60;
  const pushed = applyImpulse(body, frame.impulse);
  const dragging = frame.pressing && Math.hypot(frame.dx, frame.dy) >= DRAG_PX;
  const target = dragging ? dragTarget(frame) : frame.pressing ? holdTarget(frame.hold01, frame.nx, frame.ny) : restTarget();
  const k = frame.pressing ? 150 : 38;
  const damp = frame.pressing ? 20 : 5.6;
  const [sx, vsx] = spring(pushed.sx, pushed.vsx, target.sx, step, k, damp);
  const [sy, vsy] = spring(pushed.sy, pushed.vsy, target.sy, step, k, damp);
  const [x, vx] = spring(pushed.x, pushed.vx, target.x, step, k * 0.85, damp);
  const [y, vy] = spring(pushed.y, pushed.vy, target.y, step, k * 0.75, damp);
  const [rot, vr] = spring(pushed.rot, pushed.vr, target.rot, step, k, damp);
  const next = coast(clampBody({ sx, sy, x, y, rot, vsx, vsy, vx, vy, vr }), frame.pressing);
  return { body: next, visual: visualOf(next, target, frame) };
}

/** Drop the last invisible shiver so the animation loop can stop. */
function coast(body: SquishBody, pressing: boolean): SquishBody {
  if (pressing) return body;
  const quiet =
    Math.abs(body.sx - 1) < 0.012 &&
    Math.abs(body.sy - 1) < 0.012 &&
    Math.abs(body.x) < 0.4 &&
    Math.abs(body.y) < 0.4 &&
    Math.abs(body.rot) < 0.3 &&
    Math.abs(body.vsx) < 0.08 &&
    Math.abs(body.vsy) < 0.08 &&
    Math.abs(body.vx) < 1 &&
    Math.abs(body.vy) < 1 &&
    Math.abs(body.vr) < 0.5;
  return quiet ? restBody() : body;
}

export function squishSettled(body: SquishBody, pressing: boolean): boolean {
  if (pressing) return false;
  return (
    Math.abs(body.sx - 1) < 0.004 &&
    Math.abs(body.sy - 1) < 0.004 &&
    Math.abs(body.x) < 0.2 &&
    Math.abs(body.y) < 0.2 &&
    Math.abs(body.rot) < 0.15 &&
    Math.abs(body.vsx) < 0.02 &&
    Math.abs(body.vsy) < 0.02 &&
    Math.abs(body.vx) < 0.2 &&
    Math.abs(body.vy) < 0.2 &&
    Math.abs(body.vr) < 0.2
  );
}

export function touchNorm(localX: number, localY: number, width: number, height: number): { nx: number; ny: number } {
  return {
    nx: width <= 0 ? 0 : clamp((localX / width) * 2 - 1, -1, 1),
    ny: height <= 0 ? 0 : clamp((localY / height) * 2 - 1, -1, 1),
  };
}
