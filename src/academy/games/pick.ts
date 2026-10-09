import type { Rng } from "@/lib/rng";
import type { Board } from "./boards";
import { qid } from "./choices";
import type { ChoiceQ } from "./types";

export function uniqueChoices(
  rng: Rng,
  answer: string,
  pool: readonly string[],
  pinned: readonly string[] = [],
): string[] {
  const picked: string[] = [];
  const used = new Set<string>([answer]);
  const consider = (item: string) => {
    const text = item.trim();
    if (picked.length >= 3 || !text || used.has(text)) return;
    used.add(text);
    picked.push(text);
  };
  for (const item of pinned) consider(item);
  for (const item of rng.shuffle([...pool])) consider(item);
  let n = 1;
  while (picked.length < 3 && n < 40) {
    consider(`no ${n}`);
    n += 1;
  }
  return rng.shuffle([answer, ...picked]);
}

export function nearChoices(rng: Rng, answer: number, lo: number, hi: number, extra: number[] = []): string[] {
  const pool: number[] = [];
  const add = (n: number) => {
    if (!Number.isInteger(n) || n === answer || n < lo || n > hi || pool.includes(n)) return;
    pool.push(n);
  };
  for (const n of extra) add(n);
  for (const d of [1, -1, 2, -2, 3, -3, 4, 5, -5, 10, -10, 20, -20]) add(answer + d);
  let guard = 0;
  while (pool.length < 3 && guard < 24) {
    guard += 1;
    if (hi >= lo) add(rng.int(lo, hi));
  }
  let widen = 1;
  while (pool.length < 3 && widen < 40) {
    add(Math.max(0, answer + widen));
    add(Math.max(0, answer - widen));
    widen += 1;
  }
  return uniqueChoices(rng, String(answer), pool.map(String));
}

/** The keyed answer is the greatest or least choice, so a bigger distractor cannot be "more right". */
export function extremeChoices(
  rng: Rng,
  answer: number,
  other: number,
  askGreater: boolean,
  lo: number,
  hi: number,
): string[] {
  const pool: string[] = [];
  const add = (n: number) => {
    if (!Number.isInteger(n) || n < lo || n > hi || n === answer || n === other) return;
    if (askGreater ? n >= answer : n <= answer) return;
    const text = String(n);
    if (!pool.includes(text)) pool.push(text);
  };
  for (let step = 1; step <= 40; step += 1) add(askGreater ? answer - step : answer + step);
  return uniqueChoices(rng, String(answer), pool, [String(other)]);
}

export function distinctInts(rng: Rng, count: number, lo: number, hi: number): number[] {
  const span = hi - lo + 1;
  const bag = rng.shuffle(Array.from({ length: Math.max(0, span) }, (_, i) => lo + i));
  return bag.slice(0, Math.min(count, bag.length));
}

export function labelFor(rows: { key: string; label: string }[], key: string): string | null {
  return rows.find((row) => row.key === key)?.label ?? null;
}

export function sceneQuestion(
  rng: Rng,
  spec: {
    game: string;
    title: string;
    hint: string;
    answer: string;
    choices: string[];
    skill: string;
    tags: string[];
    solved: string;
    picture: string;
    hands: boolean;
    quietChoices: boolean;
    labels: Record<string, string>;
    pictures?: Record<string, string>;
    board: Board;
    factKey: string;
  },
): ChoiceQ {
  return {
    id: qid(rng),
    game: spec.game,
    title: spec.title,
    hint: spec.hint,
    praise: `Yes! ${spec.solved}`,
    almost: `Almost! ${spec.solved}`,
    answer: spec.answer,
    choices: spec.choices,
    skill: spec.skill,
    tags: spec.hands ? [...spec.tags, "hands"] : spec.tags,
    factKey: spec.factKey,
    visual: {
      kind: "scene",
      picture: spec.picture,
      hands: spec.hands,
      quietChoices: spec.quietChoices,
      labels: spec.labels,
      pictures: spec.pictures,
      board: spec.board,
    },
  };
}
