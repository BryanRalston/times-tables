export type SquishImpulse = "none" | "tap" | "release" | "flick";

export const SOFT_COLS = 20;
export const SOFT_ROWS = 24;

const DRAG_PX = 14;

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
  cols: number;
  rows: number;
  rest: Float32Array;
  pos: Float32Array;
  prev: Float32Array;
  scratch: Float32Array;
  consI: Uint16Array;
  consL: Float32Array;
  consK: Float32Array;
  restArea: number;
  wobble: number;
  phase: number;
  grabX: number;
  grabY: number;
  wave: number;
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
  spread: number;
  contact: number;
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
  /** Pixel size of the soft body. Drag offsets are divided by this. */
  width?: number;
  height?: number;
}

export function restBody(): SquishBody {
  const cols = SOFT_COLS;
  const rows = SOFT_ROWS;
  const n = cols * rows;
  const rest = new Float32Array(n * 2);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const i = (r * cols + c) * 2;
      rest[i] = c / (cols - 1);
      rest[i + 1] = r / (rows - 1);
    }
  }
  const links: number[] = [];
  const add = (a: number, b: number, k: number) => {
    const ax = rest[a * 2] ?? 0;
    const ay = rest[a * 2 + 1] ?? 0;
    const bx = rest[b * 2] ?? 0;
    const by = rest[b * 2 + 1] ?? 0;
    links.push(a, b, Math.hypot(bx - ax, by - ay), k);
  };
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const i = r * cols + c;
      if (c + 1 < cols) add(i, i + 1, 1);
      if (r + 1 < rows) add(i, i + cols, 1);
      if (c + 1 < cols && r + 1 < rows) {
        add(i, i + cols + 1, 0.45);
        add(i + 1, i + cols, 0.45);
      }
    }
  }
  const count = links.length / 4;
  const consI = new Uint16Array(count * 2);
  const consL = new Float32Array(count);
  const consK = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    consI[i * 2] = links[i * 4] ?? 0;
    consI[i * 2 + 1] = links[i * 4 + 1] ?? 0;
    consL[i] = links[i * 4 + 2] ?? 0;
    consK[i] = links[i * 4 + 3] ?? 0;
  }
  const body: SquishBody = {
    sx: 1,
    sy: 1,
    x: 0,
    y: 0,
    rot: 0,
    vsx: 0,
    vsy: 0,
    vx: 0,
    vy: 0,
    vr: 0,
    cols,
    rows,
    rest,
    pos: rest.slice(),
    prev: rest.slice(),
    scratch: new Float32Array(n * 2),
    consI,
    consL,
    consK,
    restArea: 1,
    wobble: 0,
    phase: 0,
    grabX: 0,
    grabY: 0,
    wave: 0,
  };
  body.restArea = Math.max(0.0001, meshArea(body));
  return body;
}

export function idleFrame(reduced = false): SquishFrame {
  return { reduced, pressing: false, hold01: 0, dx: 0, dy: 0, nx: 0, ny: 0, impulse: "none" };
}

export function meshVertex(body: SquishBody, col: number, row: number): { x: number; y: number; rx: number; ry: number } {
  const i = (row * body.cols + col) * 2;
  return { x: body.pos[i] ?? 0, y: body.pos[i + 1] ?? 0, rx: body.rest[i] ?? 0, ry: body.rest[i + 1] ?? 0 };
}

export function meshArea(body: SquishBody): number {
  const { cols, rows, pos } = body;
  let area = 0;
  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < cols - 1; c += 1) {
      const i00 = (r * cols + c) * 2;
      const i10 = i00 + 2;
      const i01 = i00 + cols * 2;
      const i11 = i01 + 2;
      area += triArea(pos, i00, i10, i11);
      area += triArea(pos, i00, i11, i01);
    }
  }
  return Math.abs(area) * 0.5;
}

function triArea(pos: Float32Array, a: number, b: number, c: number): number {
  const ax = pos[a] ?? 0;
  const ay = pos[a + 1] ?? 0;
  const bx = pos[b] ?? 0;
  const by = pos[b + 1] ?? 0;
  const cx = pos[c] ?? 0;
  const cy = pos[c + 1] ?? 0;
  return (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function spanOf(frame: SquishFrame): { w: number; h: number } {
  return {
    w: frame.width && frame.width > 0 ? frame.width : 100,
    h: frame.height && frame.height > 0 ? frame.height : 100,
  };
}

function contactOf(frame: SquishFrame): { x: number; y: number } {
  return { x: (clamp(frame.nx, -1, 1) + 1) / 2, y: (clamp(frame.ny, -1, 1) + 1) / 2 };
}

function dragging(frame: SquishFrame): boolean {
  return frame.pressing && Math.hypot(frame.dx, frame.dy) >= DRAG_PX;
}

/** One animation frame. A held finger dents the mesh; letting go is a slow damped rise. */
export function stepSquish(body: SquishBody, frame: SquishFrame, dt: number): { body: SquishBody; visual: SquishVisual } {
  if (frame.reduced) return stepReduced(body, frame);
  const step = dt > 0 && dt < 0.05 ? dt : 1 / 60;
  const sub = step > 1 / 45 ? 2 : 1;
  const h = step / sub;
  applyImpulse(body, frame);
  for (let i = 0; i < sub; i += 1) substep(body, frame, h);
  summarize(body);
  const depth = measureDepth(body, frame);
  maybeRest(body, frame.pressing);
  return { body, visual: visualOf(body, frame, depth) };
}

function substep(body: SquishBody, frame: SquishFrame, dt: number): void {
  if (!frame.pressing) {
    relax(body, dt);
    return;
  }
  unwave(body);
  if (dragging(frame)) {
    integrate(body, frame, dt);
    for (let i = 0; i < 3; i += 1) {
      satisfy(body, 0.28);
      pin(body);
    }
    grab(body, frame);
    smooth(body, 0.1);
    grab(body, frame);
    pin(body);
    limit(body);
    bleed(body, frame);
    return;
  }
  // The finger sinks into a local dimple. Flesh around it bulges; the feet stay put.
  const depth = easeHold(frame.hold01);
  const contact = contactOf(frame);
  const follow = 1 - Math.exp(-dt / 0.11);
  const { pos, rest } = body;
  for (let i = 0; i < pos.length; i += 2) {
    const rx = rest[i] ?? 0;
    const ry = rest[i + 1] ?? 0;
    const target = softTarget(rx, ry, contact.x, contact.y, depth);
    pos[i] = (pos[i] ?? rx) + (target.x - (pos[i] ?? rx)) * follow;
    pos[i + 1] = (pos[i + 1] ?? ry) + (target.y - (pos[i + 1] ?? ry)) * follow;
  }
  pin(body);
  keepArea(body);
  pin(body);
  limit(body);
  body.prev.set(body.pos);
}

function integrate(body: SquishBody, frame: SquishFrame, dt: number): void {
  const press = frame.pressing;
  const damp = press ? 0.5 : 0.74;
  const k = (press ? 0.35 : 1.7) * dt;
  const { pos, prev, rest } = body;
  for (let i = 0; i < pos.length; i += 2) {
    const x = pos[i] ?? 0;
    const y = pos[i + 1] ?? 0;
    const px = prev[i] ?? x;
    const py = prev[i + 1] ?? y;
    const rx = rest[i] ?? x;
    const ry = rest[i + 1] ?? y;
    const vx = (x - px) * damp + (rx - x) * k;
    const vy = (y - py) * damp + (ry - y) * k;
    prev[i] = x;
    prev[i + 1] = y;
    pos[i] = x + vx;
    pos[i + 1] = y + vy;
  }
}

function satisfy(body: SquishBody, scale: number): void {
  const { pos, consI, consL, consK } = body;
  for (let n = 0; n < consL.length; n += 1) {
    const a = (consI[n * 2] ?? 0) * 2;
    const b = (consI[n * 2 + 1] ?? 0) * 2;
    const ax = pos[a] ?? 0;
    const ay = pos[a + 1] ?? 0;
    const bx = pos[b] ?? 0;
    const by = pos[b + 1] ?? 0;
    let dx = bx - ax;
    let dy = by - ay;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-5) continue;
    const restLen = consL[n] ?? dist;
    const k = (consK[n] ?? 1) * scale;
    const diff = ((dist - restLen) / dist) * k;
    dx *= diff * 0.5;
    dy *= diff * 0.5;
    pos[a] = ax + dx;
    pos[a + 1] = ay + dy;
    pos[b] = bx - dx;
    pos[b + 1] = by - dy;
  }
}

function pin(body: SquishBody): void {
  const { cols, rows, pos, rest } = body;
  const row = rows - 1;
  let sum = 0;
  for (let c = 0; c < cols; c += 1) sum += pos[(row * cols + c) * 2] ?? 0;
  const shift = (0.5 - sum / cols) * 0.9;
  for (let c = 0; c < cols; c += 1) {
    const i = (row * cols + c) * 2;
    const rx = rest[i] ?? 0;
    const x = (pos[i] ?? rx) + shift;
    pos[i] = rx + (x - rx) * 0.78;
    pos[i + 1] = rest[i + 1] ?? 1;
  }
}

/** Local dimple under the finger, a ring of displaced flesh, and a wider belly. */
function softTarget(rx: number, ry: number, cx: number, cy: number, depth: number): { x: number; y: number } {
  if (ry > 0.985) return { x: rx, y: ry };
  const dx = rx - cx;
  const dy = ry - cy;
  const dist2 = dx * dx + dy * dy;
  const dist = Math.sqrt(dist2) || 1e-4;
  const dent = Math.exp(-dist2 / 0.011);
  let x = rx;
  let y = ry + dent * depth * 0.17;
  const pinch = dent * depth * 0.78;
  x -= dx * pinch;
  y -= dy * pinch * 0.22;
  const ring = Math.exp(-((dist - 0.2) * (dist - 0.2)) / 0.01);
  x += (dx / dist) * depth * 0.04 * ring;
  y += (dy / dist) * depth * 0.022 * ring;
  const belly = Math.sin(clamp(ry, 0, 1) * Math.PI);
  const flank = Math.abs(rx - 0.5) * 2;
  x += (rx < 0.5 ? -1 : 1) * depth * 0.058 * belly * flank;
  const crown = Math.exp(-(ry * ry) / 0.028) * Math.exp(-((rx - 0.5) * (rx - 0.5)) / 0.06);
  y += depth * 0.018 * crown;
  return { x, y };
}

function grab(body: SquishBody, frame: SquishFrame): void {
  const { w, h } = spanOf(frame);
  let gx = frame.dx / w;
  let gy = frame.dy / h;
  const mag = Math.hypot(gx, gy);
  const cap = 0.7;
  if (mag > cap) {
    gx *= cap / mag;
    gy *= cap / mag;
  }
  body.grabX = gx;
  body.grabY = gy;
  const contact = contactOf(frame);
  const { pos, rest } = body;
  for (let i = 0; i < pos.length; i += 2) {
    const rx = rest[i] ?? 0;
    const ry = rest[i + 1] ?? 0;
    const dx = rx - contact.x;
    const dy = ry - contact.y;
    const inf = Math.exp(-(dx * dx + dy * dy) / 0.02);
    if (inf < 0.04) continue;
    const tx = rx + gx * inf;
    const ty = ry + gy * inf;
    const follow = 0.35 + 0.55 * inf;
    pos[i] = (pos[i] ?? rx) + (tx - (pos[i] ?? rx)) * follow;
    pos[i + 1] = (pos[i + 1] ?? ry) + (ty - (pos[i + 1] ?? ry)) * follow;
  }
}

/** Nudge the sides if the dimple ate or added too much area. Height stays put. */
function keepArea(body: SquishBody): void {
  const area = meshArea(body);
  if (area < 1e-4) return;
  const ratio = area / body.restArea;
  if (ratio >= 0.9 && ratio <= 1.1) return;
  const goal = ratio < 0.9 ? 0.94 : 1.06;
  const s = goal / ratio;
  const { pos, rows, cols } = body;
  const last = (rows - 1) * cols * 2;
  for (let i = 0; i < last; i += 2) {
    const x = pos[i] ?? 0.5;
    pos[i] = 0.5 + (x - 0.5) * s;
  }
}

function smooth(body: SquishBody, amount: number): void {
  const { cols, rows, pos, scratch } = body;
  scratch.set(pos);
  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      let sx = 0;
      let sy = 0;
      let n = 0;
      const i = (r * cols + c) * 2;
      for (let k = 0; k < 4; k += 1) {
        const cc = c + (k === 0 ? 1 : k === 1 ? -1 : 0);
        const rr = r + (k === 2 ? 1 : k === 3 ? -1 : 0);
        if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
        const j = (rr * cols + cc) * 2;
        sx += pos[j] ?? 0;
        sy += pos[j + 1] ?? 0;
        n += 1;
      }
      if (n === 0) continue;
      const x = pos[i] ?? 0;
      const y = pos[i + 1] ?? 0;
      scratch[i] = x + (sx / n - x) * amount;
      scratch[i + 1] = y + (sy / n - y) * amount;
    }
  }
  pos.set(scratch);
}

function relax(body: SquishBody, dt: number): void {
  unwave(body);
  const k = 1 - Math.exp(-dt / 0.7);
  const { pos, rest, prev } = body;
  for (let i = 0; i < pos.length; i += 1) {
    const r = rest[i] ?? 0;
    pos[i] = (pos[i] ?? r) + (r - (pos[i] ?? r)) * k;
  }
  if (body.wobble < 0.03) {
    body.wobble = 0;
    body.wave = 0;
  } else {
    body.phase += 0.1;
    body.wobble *= 0.978;
    const wave = Math.sin(body.phase) * body.wobble * 0.026;
    applyWave(body, wave);
    body.wave = wave;
  }
  pin(body);
  prev.set(pos);
}

function applyWave(body: SquishBody, wave: number): void {
  if (wave === 0) return;
  const { cols, rows, pos, rest } = body;
  for (let r = 0; r < rows - 1; r += 1) {
    const envelope = Math.sin((r / (rows - 1)) * Math.PI);
    for (let c = 0; c < cols; c += 1) {
      const i = (r * cols + c) * 2;
      pos[i] = (pos[i] ?? 0) + wave * envelope;
      const ry = rest[i + 1] ?? 0;
      pos[i + 1] = (pos[i + 1] ?? 0) + wave * 0.28 * (ry - 0.45);
    }
  }
}

function unwave(body: SquishBody): void {
  if (body.wave === 0) return;
  applyWave(body, -body.wave);
  body.wave = 0;
}

function limit(body: SquishBody): void {
  const { pos, rest, rows, cols } = body;
  const last = (rows - 1) * cols * 2;
  for (let i = 0; i < pos.length; i += 2) {
    if (i >= last) continue;
    const rx = rest[i] ?? 0;
    const ry = rest[i + 1] ?? 0;
    pos[i] = rx + clamp((pos[i] ?? rx) - rx, -0.62, 0.62);
    pos[i + 1] = ry + clamp((pos[i + 1] ?? ry) - ry, -0.5, 0.48);
  }
}

function bleed(body: SquishBody, frame: SquishFrame): void {
  const keep = frame.pressing ? 0.12 : 0.3;
  const { pos, prev, rows, cols } = body;
  const last = (rows - 1) * cols * 2;
  for (let i = 0; i < pos.length; i += 2) {
    const x = pos[i] ?? 0;
    const y = pos[i + 1] ?? 0;
    if (i >= last) {
      prev[i] = x;
      prev[i + 1] = y;
      continue;
    }
    const vx = x - (prev[i] ?? x);
    const vy = y - (prev[i + 1] ?? y);
    prev[i] = x - vx * keep;
    prev[i + 1] = y - vy * keep;
  }
}

function applyImpulse(body: SquishBody, frame: SquishFrame): void {
  switch (frame.impulse) {
    case "none":
      return;
    case "tap":
      poseSquash(body, 1);
      body.wobble = 1;
      body.phase = 0.4;
      body.prev.set(body.pos);
      return;
    case "release":
      body.wobble = Math.max(body.wobble, 0.7);
      return;
    case "flick": {
      const { w, h } = spanOf(frame);
      const gx = clamp(frame.dx / w, -0.55, 0.55);
      const gy = clamp(frame.dy / h, -0.4, 0.4);
      nudge(body, gx * 0.55, gy * 0.4);
      body.wobble = 1;
      body.phase = 0.2;
      body.prev.set(body.pos);
      return;
    }
    default: {
      const neverImpulse: never = frame.impulse;
      return neverImpulse;
    }
  }
}

function poseSquash(body: SquishBody, amount: number): void {
  const { pos, rest, cols, rows } = body;
  for (let r = 0; r < rows - 1; r += 1) {
    const up = 1 - r / (rows - 1);
    for (let c = 0; c < cols; c += 1) {
      const i = (r * cols + c) * 2;
      const rx = rest[i] ?? 0.5;
      const ry = rest[i + 1] ?? 0;
      pos[i] = (pos[i] ?? rx) + (rx - 0.5) * 0.1 * amount + Math.sin(ry * Math.PI) * 0.02 * amount;
      pos[i + 1] = (pos[i + 1] ?? ry) + up * up * 0.16 * amount;
    }
  }
}

function nudge(body: SquishBody, gx: number, gy: number): void {
  const { pos, rest, cols, rows } = body;
  for (let r = 0; r < rows - 1; r += 1) {
    const up = 1 - r / (rows - 1);
    for (let c = 0; c < cols; c += 1) {
      const i = (r * cols + c) * 2;
      pos[i] = (pos[i] ?? 0) + gx * (0.25 + 0.75 * up);
      pos[i + 1] = (pos[i + 1] ?? 0) + gy * up;
      const rx = rest[i] ?? 0;
      pos[i] += (rx - 0.5) * Math.abs(gy) * 0.15;
    }
  }
}

function easeHold(hold01: number): number {
  const t = clamp(hold01, 0, 1);
  return 1 - (1 - t) ** 1.65;
}

function measureDepth(body: SquishBody, frame: SquishFrame): number {
  const contact = contactOf(frame);
  const { pos, rest } = body;
  let best = 0;
  for (let i = 0; i < pos.length; i += 2) {
    const rx = rest[i] ?? 0;
    const ry = rest[i + 1] ?? 0;
    const down = (pos[i + 1] ?? ry) - ry;
    const dx = rx - contact.x;
    const dy = ry - contact.y;
    const inf = Math.exp(-(dx * dx + dy * dy) / 0.012);
    if (down * inf > best) best = down * inf;
  }
  const held = frame.pressing ? frame.hold01 * 0.28 : 0;
  return clamp(Math.max(best / 0.13, held), 0, 1);
}

function summarize(body: SquishBody): void {
  const { pos, cols, rows } = body;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let cx = 0;
  let cy = 0;
  const n = cols * rows;
  for (let i = 0; i < pos.length; i += 2) {
    const x = pos[i] ?? 0;
    const y = pos[i + 1] ?? 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    cx += x;
    cy += y;
  }
  cx /= n;
  cy /= n;
  const prevSx = body.sx;
  const prevSy = body.sy;
  body.sx = maxX - minX;
  body.sy = maxY - minY;
  body.x = cx - 0.5;
  body.y = cy - 0.5;
  let topX = 0;
  let botX = 0;
  for (let c = 0; c < cols; c += 1) {
    topX += pos[c * 2] ?? 0;
    botX += pos[((rows - 1) * cols + c) * 2] ?? 0;
  }
  body.rot = Math.atan2(topX / cols - botX / cols, 1) * (180 / Math.PI);
  body.vsx = body.sx - prevSx;
  body.vsy = body.sy - prevSy;
  body.vx = body.x;
  body.vy = body.y;
  body.vr = body.rot;
}

function maybeRest(body: SquishBody, pressing: boolean): void {
  if (pressing || body.wobble > 0.05) return;
  const { pos, rest, prev } = body;
  for (let i = 0; i < pos.length; i += 1) {
    if (Math.abs((pos[i] ?? 0) - (rest[i] ?? 0)) > 0.006) return;
    if (Math.abs((pos[i] ?? 0) - (prev[i] ?? 0)) > 0.002) return;
  }
  pos.set(rest);
  prev.set(rest);
  body.sx = 1;
  body.sy = 1;
  body.x = 0;
  body.y = 0;
  body.rot = 0;
  body.vsx = 0;
  body.vsy = 0;
  body.vx = 0;
  body.vy = 0;
  body.vr = 0;
  body.wobble = 0;
  body.grabX = 0;
  body.grabY = 0;
  body.wave = 0;
}

function visualOf(body: SquishBody, frame: SquishFrame, depth: number): SquishVisual {
  const spread = clamp(0.82 + Math.max(0, body.sx - 1) * 1.8 + depth * 0.42, 0.75, 1.85);
  return {
    sx: body.sx,
    sy: body.sy,
    x: body.x,
    y: body.y,
    rot: body.rot,
    dentX: frame.pressing || frame.impulse !== "none" ? clamp(frame.nx, -1, 1) : 0,
    dentY: frame.pressing || frame.impulse !== "none" ? clamp(frame.ny, -1, 1) : 0,
    depth,
    spread,
    contact: depth,
  };
}

function stepReduced(body: SquishBody, frame: SquishFrame): { body: SquishBody; visual: SquishVisual } {
  const poke = frame.impulse === "none" ? 0 : 0.55;
  const press = frame.pressing ? clamp(Math.max(frame.hold01, poke), 0, 1) : poke;
  const target = 1 - 0.04 * press;
  const s = body.sx + (target - body.sx) * 0.35;
  body.sx = s;
  body.sy = s;
  body.x = 0;
  body.y = 0;
  body.rot = 0;
  body.vsx = 0;
  body.vsy = 0;
  body.vx = 0;
  body.vy = 0;
  body.vr = 0;
  body.wobble = 0;
  body.pos.set(body.rest);
  body.prev.set(body.rest);
  return {
    body,
    visual: {
      sx: s,
      sy: s,
      x: 0,
      y: 0,
      rot: 0,
      dentX: 0,
      dentY: 0,
      depth: press * 0.35,
      spread: 1,
      contact: 0,
    },
  };
}

export function squishSettled(body: SquishBody, pressing: boolean): boolean {
  if (pressing || body.wobble > 0.04) return false;
  if (Math.abs(body.sx - 1) > 0.008 || Math.abs(body.sy - 1) > 0.008) return false;
  if (Math.abs(body.x) > 0.01 || Math.abs(body.y) > 0.01 || Math.abs(body.rot) > 0.4) return false;
  const { pos, rest, prev } = body;
  for (let i = 0; i < pos.length; i += 1) {
    if (Math.abs((pos[i] ?? 0) - (rest[i] ?? 0)) > 0.004) return false;
    if (Math.abs((pos[i] ?? 0) - (prev[i] ?? 0)) > 0.0015) return false;
  }
  return true;
}

export function touchNorm(localX: number, localY: number, width: number, height: number): { nx: number; ny: number } {
  return {
    nx: width <= 0 ? 0 : clamp((localX / width) * 2 - 1, -1, 1),
    ny: height <= 0 ? 0 : clamp((localY / height) * 2 - 1, -1, 1),
  };
}
