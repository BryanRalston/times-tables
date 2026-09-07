import type { ActivityDef, FactStat, HonestRun, Kind, PersonalBests, TodayPractice } from "./types";
import type { Rng } from "./rng";

export type { FactStat, HonestRun, PersonalBests, TodayPractice };

export const CORRECT_HOLD_MS = 520;
export const WRONG_RETRY_MS = 420;
export const WRONG_REVEAL_MS = 900;
export const REVEAL_AFTER_MISSES = 2;
export const HONEST_MS_MIN = 400;
export const HONEST_MS_MAX = 30_000;
export const TODAY_AVG_MIN = 5;
export const BEST_AVG_MIN = 5;

export function emptyFacts(): Record<string, FactStat> {
  return {};
}

export function emptyBests(): PersonalBests {
  return { streak: 0, accuracy: 0, avgMs: 0 };
}

export function emptyToday(date = ""): TodayPractice {
  return { date, questions: 0, correct: 0, ms: 0, honestN: 0 };
}

export function emptyRun(): HonestRun {
  return { n: 0, sum: 0 };
}

export function parseFactStat(raw: unknown): FactStat | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const ok = typeof o.ok === "number" ? Math.max(0, Math.floor(o.ok)) : 0;
  const miss = typeof o.miss === "number" ? Math.max(0, Math.floor(o.miss)) : 0;
  const ms = typeof o.ms === "number" ? Math.max(0, Math.floor(o.ms)) : 0;
  return { ok, miss, ms };
}

export function parseFacts(raw: unknown): Record<string, FactStat> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, FactStat> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const st = parseFactStat(v);
    if (st && k) out[k] = st;
  }
  return out;
}

export function parseBests(raw: unknown): PersonalBests {
  const base = emptyBests();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return {
    streak: typeof o.streak === "number" ? Math.max(0, Math.floor(o.streak)) : 0,
    accuracy: typeof o.accuracy === "number" ? clamp01(o.accuracy) : 0,
    avgMs: typeof o.avgMs === "number" ? Math.max(0, Math.floor(o.avgMs)) : 0,
  };
}

export function parseToday(raw: unknown): TodayPractice {
  const base = emptyToday();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return {
    date: typeof o.date === "string" ? o.date : "",
    questions: typeof o.questions === "number" ? Math.max(0, Math.floor(o.questions)) : 0,
    correct: typeof o.correct === "number" ? Math.max(0, Math.floor(o.correct)) : 0,
    ms: typeof o.ms === "number" ? Math.max(0, Math.floor(o.ms)) : 0,
    honestN: typeof o.honestN === "number" ? Math.max(0, Math.floor(o.honestN)) : 0,
  };
}

export function parseRun(raw: unknown): HonestRun {
  if (!raw || typeof raw !== "object") return emptyRun();
  const o = raw as Record<string, unknown>;
  return {
    n: typeof o.n === "number" ? Math.max(0, Math.floor(o.n)) : 0,
    sum: typeof o.sum === "number" ? Math.max(0, Math.floor(o.sum)) : 0,
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function kindKey(kind: string): string {
  return `kind:${kind}`;
}

export function friendsKey(shown: number): string {
  return `friends:${shown}`;
}

export function leftoverKey(shown: number, n: number, total: number, sub: boolean): string {
  if (!sub && total === 10) return friendsKey(shown);
  return sub ? `leftover:${total}−${shown}` : `leftover:${shown}+${n}`;
}

export function parseTimesKey(key: string): { a: number; b: number } | null {
  const m = key.match(/^(\d+)\s*[×xX]\s*(\d+)$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { a: Math.min(a, b), b: Math.max(a, b) };
}

export function timesKey(a: number, b: number): string {
  return `${Math.min(a, b)}×${Math.max(a, b)}`;
}

export function isHonestMs(ms: number | undefined): ms is number {
  return typeof ms === "number" && ms >= HONEST_MS_MIN && ms <= HONEST_MS_MAX;
}

export function weakness(stat: FactStat | undefined): number {
  if (!stat) return 0;
  const n = stat.ok + stat.miss;
  if (n === 0) return 0;
  return ((stat.miss + 1) / (n + 2)) * (1 + stat.miss * 0.3);
}

export function isWeak(stat: FactStat | undefined): boolean {
  if (!stat) return false;
  const n = stat.ok + stat.miss;
  if (n < 2 || stat.miss < 2) return false;
  return stat.miss >= stat.ok || stat.ok / n < 0.7;
}

export function bumpFact(facts: Record<string, FactStat>, key: string, ok: boolean, ms?: number): Record<string, FactStat> {
  if (!key) return facts;
  const prev = facts[key] ?? { ok: 0, miss: 0, ms: 0 };
  const next: FactStat = {
    ok: prev.ok + (ok ? 1 : 0),
    miss: prev.miss + (ok ? 0 : 1),
    ms: prev.ms + (ok && isHonestMs(ms) ? ms : 0),
  };
  return { ...facts, [key]: next };
}

export function shakyFromFacts(facts: Record<string, FactStat>, prev: Record<string, number> = {}): Record<string, number> {
  const out: Record<string, number> = { ...prev };
  for (const [key, st] of Object.entries(facts)) {
    if (key.startsWith("kind:")) continue;
    const n = st.miss - Math.floor(st.ok / 2);
    if (n > 0) out[key] = n;
    else delete out[key];
  }
  return out;
}

export function rollToday(today: TodayPractice, date: string): TodayPractice {
  if (today.date === date) return today;
  return emptyToday(date);
}

export function recordToday(today: TodayPractice, date: string, ok: boolean, ms?: number): TodayPractice {
  const cur = rollToday(today, date);
  const honest = isHonestMs(ms);
  return {
    date,
    questions: cur.questions + 1,
    correct: cur.correct + (ok ? 1 : 0),
    ms: cur.ms + (honest ? ms : 0),
    honestN: cur.honestN + (honest ? 1 : 0),
  };
}

export function recordRun(run: HonestRun, ok: boolean, ms?: number): HonestRun {
  if (!ok || !isHonestMs(ms)) return run;
  return { n: run.n + 1, sum: run.sum + ms };
}

export function applyBests(
  bests: PersonalBests,
  opts: { streak?: number; accuracy?: number; avgMs?: number },
): PersonalBests {
  const next = { ...bests };
  if (typeof opts.streak === "number" && opts.streak > next.streak) next.streak = opts.streak;
  if (typeof opts.accuracy === "number" && opts.accuracy > next.accuracy) next.accuracy = clamp01(opts.accuracy);
  if (typeof opts.avgMs === "number" && opts.avgMs > 0 && (next.avgMs === 0 || opts.avgMs < next.avgMs)) {
    next.avgMs = Math.round(opts.avgMs);
  }
  return next;
}

export function runAverageMs(run: HonestRun): number | null {
  if (run.n < BEST_AVG_MIN || run.sum <= 0) return null;
  return run.sum / run.n;
}

export function weakKeys(facts: Record<string, FactStat>): string[] {
  return Object.entries(facts)
    .filter(([, st]) => isWeak(st) || st.miss > st.ok)
    .sort((a, b) => weakness(b[1]) - weakness(a[1]))
    .map(([k]) => k);
}

export function keyMatchesWeak(factKey: string, weak: string[]): boolean {
  if (weak.includes(factKey)) return true;
  const times = parseTimesKey(factKey);
  if (times) {
    return weak.some((w) => {
      const t = parseTimesKey(w);
      if (t) return t.a === times.a && t.b === times.b;
      const m = w.match(/^×(\d+)$/);
      return Boolean(m && (Number(m[1]) === times.a || Number(m[1]) === times.b));
    });
  }
  if (factKey.startsWith("friends:") || factKey.startsWith("leftover")) {
    return weak.some((w) => w.startsWith("friends:") || w.startsWith("leftover") || w === "kind:tenframe");
  }
  return false;
}

export function pickWeighted<T>(rng: Rng, items: readonly T[], weight: (item: T) => number): T {
  if (!items.length) throw new Error("pickWeighted empty");
  const ws = items.map((it) => Math.max(0, weight(it)));
  const total = ws.reduce((n, w) => n + w, 0);
  if (total <= 0) return items[Math.floor(rng.next() * items.length)]!;
  let r = rng.next() * total;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i]!;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

function activityWeakness(activity: ActivityDef, facts: Record<string, FactStat>): number {
  let w = weakness(facts[kindKey(activity.kind)]);
  if (activity.kind === "tenframe" || /leftover|friends/.test(activity.id)) {
    for (const [k, st] of Object.entries(facts)) {
      if (k.startsWith("friends:") || k.startsWith("leftover")) w += weakness(st);
    }
  }
  const factors = (activity.params?.factors as number[] | undefined) ?? [];
  if (activity.kind === "groups" || activity.kind === "array" || activity.kind === "jumps" || activity.kind === "fluency" || factors.length) {
    for (const [k, st] of Object.entries(facts)) {
      const t = parseTimesKey(k);
      if (!t) continue;
      if (!factors.length || factors.includes(t.a) || factors.includes(t.b)) w += weakness(st);
    }
  }
  if (activity.kind === "fraction" && activity.params?.mode === "leftover") {
    for (const [k, st] of Object.entries(facts)) {
      if (k.startsWith("leftover-frac")) w += weakness(st);
    }
  }
  return w;
}

export function pickBiasedActivity(unitActs: ActivityDef[], rng: Rng, facts: Record<string, FactStat>): ActivityDef {
  if (!unitActs.length) throw new Error("no activities");
  const extras = unitActs.map((a) => activityWeakness(a, facts));
  if (extras.every((n) => n === 0)) return rng.pick(unitActs);
  return pickWeighted(rng, unitActs, (a) => 1 + activityWeakness(a, facts));
}

export function preferParams(
  activity: ActivityDef,
  facts: Record<string, FactStat>,
  rng: Rng,
): Record<string, unknown> | null {
  const weak = weakKeys(facts);
  if (!weak.length) return null;
  if (activity.kind === "tenframe") {
    const friends = weak
      .filter((k) => k.startsWith("friends:"))
      .map((k) => Number(k.slice(8)))
      .filter((n) => n >= 1 && n <= 18);
    if (friends.length) return { preferShown: rng.pick(friends) };
  }
  if (
    activity.kind === "fluency" ||
    activity.kind === "groups" ||
    activity.kind === "array" ||
    activity.kind === "jumps" ||
    activity.kind === "choice"
  ) {
    const times = weak.map(parseTimesKey).filter((t): t is { a: number; b: number } => Boolean(t));
    const pool = (activity.params?.factors as number[] | undefined) ?? [];
    const hit = pool.length ? times.filter((t) => pool.includes(t.a) || pool.includes(t.b)) : times;
    if (hit.length) {
      const t = rng.pick(hit);
      return { preferFact: timesKey(t.a, t.b) };
    }
  }
  return null;
}

export function needsPracticeList(facts: Record<string, FactStat>, shaky: Record<string, number> = {}): string[] {
  const merged: Record<string, FactStat> = { ...facts };
  for (const [k, n] of Object.entries(shaky)) {
    if (n <= 0) continue;
    const prev = merged[k] ?? { ok: 0, miss: 0, ms: 0 };
    if (prev.miss < n) merged[k] = { ...prev, miss: Math.max(prev.miss, n) };
  }

  const scored: { label: string; score: number }[] = [];
  const tables = new Map<number, FactStat>();
  let leftoverScore = 0;
  const friendLabels: { label: string; score: number }[] = [];

  for (const [key, st] of Object.entries(merged)) {
    const t = parseTimesKey(key);
    if (t) {
      for (const n of [t.a, t.b]) {
        if (n < 2) continue;
        const prev = tables.get(n) ?? { ok: 0, miss: 0, ms: 0 };
        tables.set(n, { ok: prev.ok + st.ok, miss: prev.miss + st.miss, ms: prev.ms + st.ms });
      }
      continue;
    }
    if (key.startsWith("friends:")) {
      const shown = Number(key.slice(8));
      if (isWeak(st) || st.miss >= 2) {
        friendLabels.push({ label: `${shown} + n`, score: weakness(st) });
      }
      leftoverScore += weakness(st);
      continue;
    }
    if (key.startsWith("leftover") || key === "kind:tenframe") {
      leftoverScore += weakness(st);
    }
  }

  for (const [n, st] of tables) {
    if (isWeak(st) || st.miss >= 2) scored.push({ label: `×${n}`, score: weakness(st) });
  }
  scored.push(...friendLabels);
  if (leftoverScore > 0.6 && !scored.some((s) => s.label === "leftover" || s.label.endsWith("+ n"))) {
    const leftoverStat = merged["kind:tenframe"];
    if (isWeak(leftoverStat) || leftoverScore > 1) scored.push({ label: "leftover", score: leftoverScore });
  }

  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of scored) {
    if (seen.has(s.label)) continue;
    seen.add(s.label);
    out.push(s.label);
    if (out.length >= 8) break;
  }
  return out;
}

export function todayView(
  today: TodayPractice,
  date: string,
): { questions: number; pct: number | null; avgMs: number | null } {
  const cur = rollToday(today, date);
  const pct = cur.questions === 0 ? null : cur.correct / cur.questions;
  const avgMs = cur.honestN >= TODAY_AVG_MIN ? cur.ms / cur.honestN : null;
  return { questions: cur.questions, pct, avgMs };
}

export function formatAvgSeconds(ms: number): string {
  const s = ms / 1000;
  if (s >= 10) return String(Math.round(s));
  return s.toFixed(1);
}

export function maybePreferShown(shown: number, preferShown: unknown, rng: Rng, total: number): number {
  const n = Number(preferShown);
  if (!Number.isFinite(n) || n < 1 || n >= total) return shown;
  if (rng.next() < 0.75) return n;
  return shown;
}

export function maybePreferFactor(size: number, preferFact: unknown, pool: number[], rng: Rng): number {
  const t = parseTimesKey(String(preferFact ?? ""));
  if (!t) return size;
  const hit = [t.a, t.b].find((n) => pool.includes(n));
  if (hit == null) return size;
  if (rng.next() < 0.75) return hit;
  return size;
}

export function maybePreferTimes(preferFact: unknown, rng: Rng): { a: number; b: number } | null {
  const t = parseTimesKey(String(preferFact ?? ""));
  if (!t) return null;
  if (rng.next() < 0.8) return t;
  return null;
}

export function mergeFactsFromShaky(facts: Record<string, FactStat>, shaky: Record<string, number> = {}): Record<string, FactStat> {
  const out = { ...facts };
  for (const [k, n] of Object.entries(shaky)) {
    if (n <= 0 || out[k]) continue;
    out[k] = { ok: 0, miss: n, ms: 0 };
  }
  return out;
}

export function holdMsFor(kind: Kind, leftoverHold: number, reduce: boolean): number {
  if (kind === "tenframe") return leftoverHold;
  if (reduce) return 180;
  return CORRECT_HOLD_MS;
}
