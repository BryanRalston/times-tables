import { glyphFor, type Glyph, type Pt, type Stroke } from "./glyphs";

/** Wide on purpose. A 4-year-old finger on a phone still lands inside this. */
export const TRACE_TOLERANCE = 18;

export interface TraceScore {
  strokeCoverage: number[];
  covered: number;
  done: boolean;
}

export function pathLength(points: readonly Pt[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const next = points[i];
    if (!prev || !next) continue;
    total += Math.hypot(next.x - prev.x, next.y - prev.y);
  }
  return total;
}

export function resample(points: readonly Pt[], spacing: number): Pt[] {
  if (points.length === 0) return [];
  const first = points[0];
  if (!first) return [];
  const out: Pt[] = [{ x: first.x, y: first.y }];
  let carry = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const next = points[i];
    if (!prev || !next) continue;
    const dist = Math.hypot(next.x - prev.x, next.y - prev.y);
    if (dist === 0) continue;
    let traveled = spacing - carry;
    while (traveled <= dist) {
      const t = traveled / dist;
      out.push({ x: prev.x + (next.x - prev.x) * t, y: prev.y + (next.y - prev.y) * t });
      traveled += spacing;
    }
    carry = spacing - (traveled - dist);
  }
  const last = points[points.length - 1];
  const end = out[out.length - 1];
  if (last && end && Math.hypot(last.x - end.x, last.y - end.y) > 0.4) out.push({ x: last.x, y: last.y });
  return out;
}

function near(sample: Pt, ink: readonly Pt[], tol2: number): boolean {
  for (const point of ink) {
    const dx = sample.x - point.x;
    const dy = sample.y - point.y;
    if (dx * dx + dy * dy <= tol2) return true;
  }
  return false;
}

/**
 * Coverage only. There is no fail. A wobbly line that stays near the guide
 * counts, including one continuous scribble that covers every stroke.
 */
export function scoreTrace(glyph: Glyph, ink: readonly (readonly Pt[])[], tolerance = TRACE_TOLERANCE): TraceScore {
  const flat: Pt[] = [];
  let drawn = 0;
  for (const stroke of ink) {
    for (let i = 0; i < stroke.length; i += 1) {
      const point = stroke[i];
      if (!point) continue;
      flat.push(point);
      const prev = stroke[i - 1];
      if (prev) drawn += Math.hypot(point.x - prev.x, point.y - prev.y);
    }
  }
  const tol2 = tolerance * tolerance;
  const per: number[] = [];
  let guide = 0;
  for (const stroke of glyph.strokes) {
    guide += pathLength(stroke.points);
    const samples = resample(stroke.points, 4);
    if (samples.length === 0) {
      per.push(1);
      continue;
    }
    let hit = 0;
    for (const sample of samples) {
      if (near(sample, flat, tol2)) hit += 1;
    }
    per.push(hit / samples.length);
  }
  const covered = per.length === 0 ? 0 : per.reduce((sum, value) => sum + value, 0) / per.length;
  const enough = drawn >= 12 && drawn >= Math.min(guide * 0.4, 34);
  const each = per.every((value) => value >= 0.5);
  const loose = covered >= 0.64 && per.every((value) => value >= 0.34);
  return { strokeCoverage: per, covered, done: enough && flat.length > 0 && (each || loose) };
}

/** First stroke that still needs ink. Equals the stroke count when the glyph is done. */
export function activeStroke(score: TraceScore): number {
  const index = score.strokeCoverage.findIndex((value) => value < 0.55);
  return index < 0 ? score.strokeCoverage.length : index;
}

export function strokeCue(stroke: Stroke): { start: Pt; tip: Pt; angle: number } {
  const start = stroke.points[0] ?? { x: 50, y: 50 };
  let dist = 0;
  let tip = stroke.points[Math.min(2, stroke.points.length - 1)] ?? start;
  for (let i = 1; i < stroke.points.length; i += 1) {
    const prev = stroke.points[i - 1];
    const next = stroke.points[i];
    if (!prev || !next) continue;
    dist += Math.hypot(next.x - prev.x, next.y - prev.y);
    tip = next;
    if (dist >= 14) break;
  }
  return { start, tip, angle: Math.atan2(tip.y - start.y, tip.x - start.x) };
}

export function guideInk(id: string): Pt[][] {
  const glyph = glyphFor(id);
  if (!glyph) return [];
  return glyph.strokes.map((stroke) => stroke.points.map((point) => ({ x: point.x, y: point.y })));
}

export function traceMatches(id: string, ink: readonly (readonly Pt[])[]): boolean {
  const glyph = glyphFor(id);
  if (!glyph) return false;
  return scoreTrace(glyph, ink).done;
}
