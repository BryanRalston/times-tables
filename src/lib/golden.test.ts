import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { UNITS, WELCOME_ACTIVITY } from "./curriculum";
import { makeQuestion, welcomeFirst } from "./questions";
import { rngFromSeed } from "./rng";
import type { Question } from "./types";

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDEN = join(HERE, "golden/g3-seeds.json");
const SEEDS = 20;

export type GoldenSnap = {
  prompt: string;
  answer: string;
  alts: string[] | null;
  choices: string[] | null;
  kind: string;
  input: string;
  needsInteract: boolean;
};

function snap(q: Question): GoldenSnap {
  return {
    prompt: q.prompt,
    answer: q.answer,
    alts: q.alts ?? null,
    choices: q.choices ?? null,
    kind: q.kind,
    input: q.input,
    needsInteract: Boolean(q.needsInteract),
  };
}

export function generateG3Golden(): Record<string, GoldenSnap[]> {
  const out: Record<string, GoldenSnap[]> = {};
  out[WELCOME_ACTIVITY.id] = [];
  for (let s = 0; s < SEEDS; s++) {
    out[WELCOME_ACTIVITY.id]!.push(snap(welcomeFirst(rngFromSeed(`g3-golden:${WELCOME_ACTIVITY.id}:${s}`))));
  }
  for (const unit of UNITS) {
    for (const activity of unit.activities) {
      const rows: GoldenSnap[] = [];
      for (let s = 0; s < SEEDS; s++) {
        rows.push(snap(makeQuestion(activity, rngFromSeed(`g3-golden:${activity.id}:${s}`))));
      }
      out[activity.id] = rows;
    }
  }
  return out;
}

describe("G3 golden seeds", () => {
  it("regenerates the same {prompt, answer, alts, choices, kind, input, needsInteract}", () => {
    const got = generateG3Golden();
    if (process.env.UPDATE_GOLDEN === "1") {
      mkdirSync(dirname(GOLDEN), { recursive: true });
      writeFileSync(GOLDEN, `${JSON.stringify(got, null, 2)}\n`);
    }
    const want = JSON.parse(readFileSync(GOLDEN, "utf8")) as Record<string, GoldenSnap[]>;
    expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort());
    expect(got).toEqual(want);
  });
});
