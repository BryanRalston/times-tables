import { describe, expect, it } from "vitest";
import { formatClockTime } from "@/lib/clock";
import { timesKey } from "@/lib/practice";
import { rngFromSeed } from "@/lib/rng";
import { squisheeById } from "@/lib/squishees";
import { SQUAD_IDS } from "./model";
import {
  ADD_MAX,
  MINUS,
  TIME_MINUTES,
  TIMES,
  TIMES_SPEC,
  fourChoices,
  fourTimeChoices,
  GROWNUP_HOLD_MS,
  gateAnswerMatches,
  grownupGate,
  makeAddQuestion,
  makeRound,
  makeSheet,
  makeTimeQuestion,
  makeTimesQuestion,
  timeHint,
  timeTalk,
  type AddVisual,
  type ChoiceQ,
} from "./questions";
import type { AddLevel, TimeLevel, TimesLevel } from "./questions";

const ADD_LEVELS: AddLevel[] = ["within5", "within10", "within20", "tens", "within100"];
const TIME_LEVELS: TimeLevel[] = ["hour", "half", "quarter", "fives"];
const TIMES_LEVELS: TimesLevel[] = ["count", "twos", "mix", "toTen"];

function assertAdd(q: ChoiceQ, level: AddLevel) {
  expect(q.game).toBe("add");
  expect(q.choices).toHaveLength(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
  const visual = q.visual as AddVisual;
  expect(visual.kind).toBe("add");
  expect(q.answer).toBe(String(visual.hidden));
  expect([visual.left, visual.right, visual.result].filter((n) => n == null)).toHaveLength(1);
  expect(visual.pink).toBeGreaterThanOrEqual(0);
  expect(visual.teal).toBeGreaterThanOrEqual(0);
  const left = visual.left ?? visual.hidden;
  const right = visual.right ?? visual.hidden;
  const result = visual.result ?? visual.hidden;
  if (visual.op === "+") {
    expect(left + right).toBe(result);
    expect(result).toBeLessThanOrEqual(ADD_MAX[level]);
    expect(visual.pink + visual.teal).toBe(result);
  } else {
    expect(left - right).toBe(result);
    expect(left).toBeLessThanOrEqual(ADD_MAX[level]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(visual.pink).toBe(result);
    expect(visual.teal).toBe(right);
  }
  if (level === "tens") {
    expect(Math.max(visual.pink, visual.teal, visual.op === "+" ? visual.pink + visual.teal : visual.pink + visual.teal)).toBeGreaterThanOrEqual(10);
    if (visual.op === "+") {
      expect(visual.pink < 10 || visual.teal < 10 || visual.pink % 10 === 0 || visual.teal % 10 === 0).toBe(true);
    } else {
      expect(visual.teal < 10 || visual.teal % 10 === 0).toBe(true);
    }
  }
  expect(visual.solved).toContain(q.answer);
  expect(q.praise.startsWith("Yes!")).toBe(true);
  expect(q.almost.startsWith("Almost!")).toBe(true);
}

describe("academy question generators", () => {
  it("builds four unique choices and keeps the answer", () => {
    expect(new Set(fourChoices(rngFromSeed(1), 5, [4, 6, 21]))).toEqual(new Set(["5", "4", "6", "21"]));
    expect(new Set(fourTimeChoices(rngFromSeed(2), 3, 30))).toEqual(new Set(["3:30", "6:30", "3:00", "4:30"]));
  });

  it("names half hours, quarters, and the wrap from 12:45", () => {
    expect(timeTalk(3, 0)).toBe("3 o'clock");
    expect(timeTalk(3, 30)).toBe("half past 3");
    expect(timeTalk(3, 15)).toBe("quarter past 3");
    expect(timeTalk(3, 45)).toBe("quarter to 4");
    expect(timeTalk(12, 45)).toBe("quarter to 1");
    expect(timeTalk(7, 25)).toBe("7:25");
    expect(timeHint(3, 30)).toBe("The long hand points to 6 = half past");
  });

  it("keeps add and subtract inside each level with a countable model", () => {
    for (const level of ADD_LEVELS) {
      for (let seed = 1; seed <= 24; seed++) {
        assertAdd(makeAddQuestion(rngFromSeed(`${level}-${seed}`), level), level);
      }
      const round = makeRound("add", level, rngFromSeed(level), 10);
      expect(round).toHaveLength(10);
      for (const q of round) assertAdd(q, level);
    }
  });

  it("reuses times facts inside the level and tags the fact key", () => {
    for (const level of TIMES_LEVELS) {
      const spec = TIMES_SPEC[level];
      for (let seed = 1; seed <= 20; seed++) {
        const q = makeTimesQuestion(rngFromSeed(`${level}-${seed}`), level, ["7×8", "6×7"]);
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.choices).toContain(q.answer);
        expect(q.visual.kind).toBe("times");
        if (q.visual.kind !== "times") continue;
        expect(q.answer).toBe(String(q.visual.a * q.visual.b));
        expect(q.visual.a).toBeGreaterThanOrEqual(1);
        expect(q.visual.b).toBeGreaterThanOrEqual(1);
        expect(q.visual.b).toBeLessThanOrEqual(spec.max);
        expect(spec.factors.includes(q.visual.a) || spec.factors.includes(q.visual.b)).toBe(true);
        expect(q.factKey).toBe(timesKey(q.visual.a, q.visual.b));
        expect(q.praise).toContain(q.answer);
      }
    }
  });

  it("reads the clock only at the minutes that level allows", () => {
    for (const level of TIME_LEVELS) {
      const allowed = new Set(TIME_MINUTES[level]);
      for (let seed = 1; seed <= 16; seed++) {
        const q = makeTimeQuestion(rngFromSeed(`${level}-${seed}`), level);
        expect(q.visual.kind).toBe("time");
        if (q.visual.kind !== "time") continue;
        expect(q.visual.hours).toBeGreaterThanOrEqual(1);
        expect(q.visual.hours).toBeLessThanOrEqual(12);
        expect(allowed.has(q.visual.minutes)).toBe(true);
        expect(q.answer).toBe(formatClockTime(q.visual.hours, q.visual.minutes));
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.choices).toContain(q.answer);
        expect(q.praise.startsWith("Yes!")).toBe(true);
      }
    }
    const half = makeTimeQuestion(rngFromSeed("half-fixed"), "half");
    if (half.visual.kind === "time" && half.visual.minutes === 30) {
      expect(half.hint).toContain("half past");
    }
  });

  it("prints worksheet problems that match their answer key", () => {
    const times = makeSheet({ game: "times", level: "toTen", rng: rngFromSeed(4), count: 16, focus: 7 });
    expect(times).toHaveLength(16);
    for (const item of times) {
      expect(item.prompt).toContain("7");
      expect(item.prompt).toContain(TIMES);
      const match = item.prompt.match(/^(\d+)\s*×\s*(\d+)\s*=\s*$/);
      expect(match).toBeTruthy();
      expect(item.answer).toBe(String(Number(match![1]) * Number(match![2])));
      expect(Number(match![1]) === 7 || Number(match![2]) === 7).toBe(true);
    }

    const add = makeSheet({ game: "add", level: "within20", rng: rngFromSeed(5), count: 16 });
    expect(add).toHaveLength(16);
    for (const item of add) {
      const match = item.prompt.match(/^(\d+)\s*([+−])\s*(\d+)\s*=\s*$/);
      expect(match).toBeTruthy();
      const a = Number(match![1]);
      const b = Number(match![3]);
      const op = match![2];
      expect(op === "+" ? a + b : a - b).toBe(Number(item.answer));
      expect(a).toBeLessThanOrEqual(20);
      expect(b).toBeLessThanOrEqual(20);
      if (op === MINUS) expect(a).toBeGreaterThanOrEqual(b);
    }

    const clocks = makeSheet({ game: "time", level: "half", rng: rngFromSeed(6), count: 6 });
    expect(clocks).toHaveLength(6);
    for (const item of clocks) {
      expect(item.clock).toBeTruthy();
      expect(item.answer).toBe(formatClockTime(item.clock!.hours, item.clock!.minutes));
      expect([0, 30]).toContain(item.clock!.minutes);
    }
  });

  it("asks a grown-up to multiply two 2-digit numbers", () => {
    expect(GROWNUP_HOLD_MS).toBeGreaterThanOrEqual(1000);
    for (let seed = 1; seed <= 40; seed++) {
      const gate = grownupGate(rngFromSeed(seed));
      expect(gate.a).toBeGreaterThanOrEqual(12);
      expect(gate.a).toBeLessThanOrEqual(48);
      expect(gate.b).toBeGreaterThanOrEqual(12);
      expect(gate.b).toBeLessThanOrEqual(48);
      expect(gate.answer).toBe(gate.a * gate.b);
      expect(gate.answer).not.toBe(gate.a + gate.b);
      expect(gateAnswerMatches(gate, String(gate.answer))).toBe(true);
      expect(gateAnswerMatches(gate, String(gate.a + gate.b))).toBe(false);
      expect(gateAnswerMatches(gate, "")).toBe(false);
    }
  });

  it("points the squad at squishee art already in the repo", () => {
    expect(SQUAD_IDS).toHaveLength(24);
    for (const id of SQUAD_IDS) {
      expect(squisheeById(id)?.file.endsWith(".png")).toBe(true);
    }
  });
});
