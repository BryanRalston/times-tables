import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { setLocale, type Locale } from "../i18n";
import { workedExample } from "../teach";
import type { GridBoard, PatternBoard } from "./boards";
import {
  PLANE_MAX,
  TWO_RULES_RANGE,
  makePlaneQuestion,
  makeTwoRulesQuestion,
  pairText,
  parsePair,
  planeAnswer,
  planeSheet,
  rollPlane,
  rollTwoRules,
  timesOf,
  twoRuleTerms,
  twoRulesAnswer,
  twoRulesSheet,
} from "./grade5-pairs";

const N = 500;

function boardOf<T>(q: { visual: { kind: string } & Record<string, unknown> }): T {
  if (q.visual.kind !== "scene") throw new Error("scene");
  return (q.visual as unknown as { board: T }).board;
}

describe("ordered pair helpers", () => {
  it("prints and reads ordered pairs", () => {
    expect(pairText(3, 5)).toBe("(3, 5)");
    expect(parsePair("(3, 5)")).toEqual({ x: 3, y: 5 });
    expect(parsePair("(-1, 5)")).toBeNull();
    expect(parsePair("3, 5")).toBeNull();
  });

  it("builds two patterns from two rules, both from 0", () => {
    const two = { ruleA: 3, ruleB: 6, count: 5, ask: "pair" as const, col: 3, row: "b" as const };
    expect(twoRuleTerms(two)).toEqual({ a: [0, 3, 6, 9, 12], b: [0, 6, 12, 18, 24] });
    expect(timesOf(two)).toBe(2);
    expect(twoRulesAnswer(two)).toBe("(9, 18)");
    expect(twoRulesAnswer({ ...two, ask: "relation" })).toBe("× 2");
    expect(twoRulesAnswer({ ...two, ask: "missing", row: "b", col: 3 })).toBe("18");
  });
});

describe("patterns: two rules (5.OA.B.3)", () => {
  it("serves all three asks with the right answer and four distinct tiles", () => {
    const asks = { missing: 0, relation: 0, pair: 0 };
    for (let i = 0; i < N; i += 1) {
      const q = makeTwoRulesQuestion(rngFromSeed(`tr-${i}`));
      const board = boardOf<PatternBoard>(q);
      const two = board.two!;
      asks[two.ask] += 1;
      expect(q.skill).toBe("patterns:twoRules");
      expect(board.mode).toBe("twoRules");
      expect(q.answer).toBe(twoRulesAnswer(two));
      expect(two.ruleB % two.ruleA).toBe(0);
      expect(two.ruleB).toBeLessThanOrEqual(TWO_RULES_RANGE.ruleMax);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices.filter((c) => c === q.answer)).toHaveLength(1);
      expect(q.choices.some((c) => /^no \d/.test(c))).toBe(false);
      expect(q.visual.kind === "scene" && q.visual.hands).toBe(false);
      if (two.ask === "missing") for (const c of q.choices) expect(Number(c)).toBeGreaterThanOrEqual(0);
    }
    expect(asks.missing).toBeGreaterThan(N * 0.25);
    expect(asks.relation).toBeGreaterThan(N * 0.2);
    expect(asks.pair).toBeGreaterThan(N * 0.2);
  });

  it("keeps the real slips among the tiles", () => {
    let swapped = 0;
    let additive = 0;
    let otherRow = 0;
    for (let i = 0; i < 300; i += 1) {
      const q = makeTwoRulesQuestion(rngFromSeed(`tr-slip-${i}`));
      const two = boardOf<PatternBoard>(q).two!;
      const { a, b } = twoRuleTerms(two);
      if (two.ask === "pair" && q.choices.includes(pairText(b[two.col]!, a[two.col]!))) swapped += 1;
      if (two.ask === "relation" && q.choices.includes(`+ ${two.ruleB - two.ruleA}`)) additive += 1;
      if (two.ask === "missing" && q.choices.includes(String((two.row === "a" ? b : a)[two.col]))) otherRow += 1;
    }
    expect(swapped).toBeGreaterThan(50);
    expect(additive).toBeGreaterThan(50);
    expect(otherRow).toBeGreaterThan(70);
  });

  it("writes a worksheet line and a worked example", () => {
    for (let i = 0; i < 40; i += 1) {
      const item = twoRulesSheet(rngFromSeed(`tr-sheet-${i}`));
      expect(item.prompt).toContain("?");
      expect(Number(item.answer)).toBeGreaterThan(0);
      expect(rollTwoRules(rngFromSeed(`tr-roll-${i}`)).count).toBe(5);
    }
    const q = makeTwoRulesQuestion(rngFromSeed("tr-teach"));
    expect(workedExample(q).frames.length).toBeGreaterThan(1);
  });
});

describe("grid: coordinate plane, quadrant I (5.G.A)", () => {
  it("keeps every point and tile on the 0–10 grid, with one right answer", () => {
    const asks = { read: 0, find: 0, pattern: 0 };
    for (let i = 0; i < N; i += 1) {
      const q = makePlaneQuestion(rngFromSeed(`pl-${i}`));
      const board = boardOf<GridBoard>(q);
      const plane = board.plane!;
      asks[plane.ask] += 1;
      expect(q.skill).toBe("grid:coords");
      expect(board.mode).toBe("coords");
      expect(q.answer).toBe(planeAnswer(plane));
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices.filter((c) => c === q.answer)).toHaveLength(1);
      for (const p of [...plane.points, plane.target]) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(PLANE_MAX);
        expect(p.y).toBeLessThanOrEqual(PLANE_MAX);
      }
      if (plane.ask === "find") {
        expect(q.choices).toEqual(["A", "B", "C", "D"]);
        const hit = plane.points.filter((p) => p.x === plane.target.x && p.y === plane.target.y);
        expect(hit).toHaveLength(1);
        expect(hit[0]!.label).toBe(q.answer);
        // The swapped point is always a decoy.
        expect(plane.points.some((p) => p.x === plane.target.y && p.y === plane.target.x)).toBe(true);
      } else {
        for (const c of q.choices) {
          const p = parsePair(c);
          expect(p, c).not.toBeNull();
          expect(p!.x).toBeLessThanOrEqual(PLANE_MAX);
          expect(p!.y).toBeLessThanOrEqual(PLANE_MAX);
        }
      }
      if (plane.ask === "pattern") {
        expect(plane.points).toHaveLength(3);
        expect(plane.target).toEqual({ x: plane.stepX * 3, y: plane.stepY * 3 });
      }
    }
    expect(asks.read).toBeGreaterThan(N * 0.2);
    expect(asks.find).toBeGreaterThan(N * 0.2);
    expect(asks.pattern).toBeGreaterThan(N * 0.15);
  });

  it("offers the swapped point as a slip when reading a point", () => {
    let swapped = 0;
    let reads = 0;
    for (let i = 0; i < 300; i += 1) {
      const q = makePlaneQuestion(rngFromSeed(`pl-swap-${i}`));
      const plane = boardOf<GridBoard>(q).plane!;
      if (plane.ask !== "read") continue;
      reads += 1;
      if (q.choices.includes(pairText(plane.target.y, plane.target.x))) swapped += 1;
    }
    expect(swapped).toBe(reads);
  });

  it("writes a worksheet line and a worked example in every locale", () => {
    const locales: Locale[] = ["en", "es", "pt", "fr", "zh", "hi", "ar"];
    try {
      for (const locale of locales) {
        setLocale(locale);
        for (let i = 0; i < 12; i += 1) {
          expect(parsePair(planeSheet(rngFromSeed(`pl-sheet-${i}`)).answer)).not.toBeNull();
          expect(rollPlane(rngFromSeed(`pl-roll-${i}`)).target.x).toBeLessThanOrEqual(PLANE_MAX);
          const q = makePlaneQuestion(rngFromSeed(`pl-teach-${locale}-${i}`));
          const example = workedExample(q);
          expect(example.frames.length).toBeGreaterThan(1);
          expect(example.caption.length).toBeGreaterThan(0);
          const t = makeTwoRulesQuestion(rngFromSeed(`tr-teach-${locale}-${i}`));
          expect(workedExample(t).frames.length).toBeGreaterThan(1);
        }
      }
    } finally {
      setLocale("en");
    }
  });
});
