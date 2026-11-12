import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { setLocale, type Locale } from "../i18n";
import { workedExample } from "../teach";
import {
  BIG_MULTI_MAX,
  DECIMAL_OPS_MAX,
  LONG_DIV_RANGE,
  bigMultiSheet,
  decimalOpsSheet,
  decimalPlaces,
  decimalThink,
  hundredthsText,
  longDivSheet,
  makeBigMultiQuestion,
  makeDecimalOpsQuestion,
  makeLongDivQuestion,
  placeParts,
  rollDecimalFact,
} from "./grade5-ops";

const N = 500;

function boardOf<T>(q: { visual: { kind: string } & Record<string, unknown> }): T {
  if (q.visual.kind !== "scene") throw new Error("scene");
  return (q.visual as unknown as { board: T }).board;
}

describe("grade 5 number helpers", () => {
  it("prints hundredths in the shortest exact form", () => {
    expect(hundredthsText(705)).toBe("7.05");
    expect(hundredthsText(270)).toBe("2.7");
    expect(hundredthsText(300)).toBe("3");
    expect(hundredthsText(12)).toBe("0.12");
    expect(hundredthsText(5)).toBe("0.05");
    expect(decimalPlaces(705)).toBe(2);
    expect(decimalPlaces(270)).toBe(1);
    expect(decimalPlaces(300)).toBe(0);
  });

  it("splits a number into place parts", () => {
    expect(placeParts(347)).toEqual([300, 40, 7]);
    expect(placeParts(306)).toEqual([300, 6]);
    expect(placeParts(26)).toEqual([20, 6]);
  });

  it("turns decimal × and ÷ into a whole-number fact", () => {
    expect(decimalThink({ op: "×", left: 235, right: 300, result: 705, unit: 100 }).line).toBe("235 × 3 = 705");
    expect(decimalThink({ op: "÷", left: 480, right: 400, result: 120, unit: 10 }).line).toBe("48 ÷ 4 = 12");
    expect(decimalThink({ op: "÷", left: 280, right: 40, result: 700, unit: 10 }).line).toBe("28 ÷ 4 = 7");
    expect(decimalThink({ op: "×", left: 30, right: 40, result: 12, unit: 100 }).line).toBe("3 × 4 = 12");
  });
});

describe("times: multiply by 2 digits (5.NBT.B.5)", () => {
  it("serves 2- or 3-digit × 2-digit with the right product and four distinct tiles", () => {
    let three = 0;
    for (let i = 0; i < N; i += 1) {
      const q = makeBigMultiQuestion(rngFromSeed(`bm-${i}`));
      const board = boardOf<{ a: number; b: number }>(q);
      expect(q.skill).toBe("times:bigMulti");
      expect(q.answer).toBe(String(board.a * board.b));
      expect(board.a % 10).not.toBe(0);
      expect(board.b % 10).not.toBe(0);
      expect(board.b).toBeGreaterThanOrEqual(12);
      expect(board.b).toBeLessThanOrEqual(BIG_MULTI_MAX.b);
      expect(board.a * board.b).toBeLessThanOrEqual(BIG_MULTI_MAX.product);
      if (board.a >= 100) three += 1;
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
      for (const c of q.choices) expect(Number.isInteger(Number(c)) && Number(c) > 0).toBe(true);
      expect(q.visual.kind === "scene" && q.visual.hands).toBe(false);
    }
    expect(three).toBeGreaterThan(N * 0.3);
    expect(three).toBeLessThan(N * 0.8);
  });

  it("keeps a classic slip among the tiles", () => {
    let slips = 0;
    for (let i = 0; i < 200; i += 1) {
      const q = makeBigMultiQuestion(rngFromSeed(`bm-slip-${i}`));
      const p = Number(q.answer);
      if (q.choices.some((c) => Math.abs(Number(c) - p) === 100)) slips += 1;
    }
    expect(slips).toBe(200);
  });

  it("prints a worksheet row with its answer", () => {
    const item = bigMultiSheet(rngFromSeed("bm-sheet"));
    const [a, b] = item.prompt.replace(" =", "").split(" × ").map(Number);
    expect(item.answer).toBe(String(a! * b!));
  });
});

describe("share: divide by 2 digits (5.NBT.B.6)", () => {
  it("serves whole-number quotients with two-digit divisors and an honest remainder", () => {
    let withRemainder = 0;
    for (let i = 0; i < N; i += 1) {
      const q = makeLongDivQuestion(rngFromSeed(`ld-${i}`));
      const board = boardOf<{ total: number; plates: number; each: number; leftover: number; mode: string }>(q);
      expect(board.mode).toBe("longDiv");
      expect(q.skill).toBe("share:longDiv");
      expect(board.plates).toBeGreaterThanOrEqual(LONG_DIV_RANGE.divisorMin);
      expect(board.plates).toBeLessThanOrEqual(LONG_DIV_RANGE.divisorMax);
      expect(board.plates % 10).not.toBe(0);
      expect(board.total).toBeLessThanOrEqual(LONG_DIV_RANGE.dividendMax);
      expect(board.total).toBe(board.plates * board.each + board.leftover);
      expect(board.leftover).toBeLessThan(board.plates);
      expect(q.answer).toBe(board.leftover ? `${board.each} remainder ${board.leftover}` : String(board.each));
      if (board.leftover) withRemainder += 1;
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
      for (const c of q.choices) expect(/remainder/.test(c)).toBe(board.leftover > 0);
    }
    expect(withRemainder).toBeGreaterThan(N * 0.35);
    expect(withRemainder).toBeLessThan(N * 0.75);
  });

  it("prints a worksheet row", () => {
    const item = longDivSheet(rngFromSeed("ld-sheet"));
    expect(item.prompt).toMatch(/^\d+ ÷ \d\d =$/);
  });
});

describe("add: decimal operations to hundredths (5.NBT.B.7)", () => {
  it("covers all four operations and keeps every value to hundredths under 100", () => {
    const ops = new Map<string, number>();
    for (let i = 0; i < N * 2; i += 1) {
      const fact = rollDecimalFact(rngFromSeed(`dec-${i}`));
      ops.set(fact.op, (ops.get(fact.op) ?? 0) + 1);
      for (const n of [fact.left, fact.right, fact.result]) {
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThan(0);
        expect(n).toBeLessThanOrEqual(DECIMAL_OPS_MAX);
      }
      if (fact.op === "+") expect(fact.left + fact.right).toBe(fact.result);
      if (fact.op === "-") expect(fact.left - fact.right).toBe(fact.result);
      if (fact.op === "×") expect(fact.left * fact.right).toBe(fact.result * 100);
      if (fact.op === "÷") expect(fact.result * fact.right).toBe(fact.left * 100);
    }
    for (const op of ["+", "-", "×", "÷"]) expect(ops.get(op) ?? 0, op).toBeGreaterThan(N * 0.25);
  });

  it("offers one right decimal and three different-valued slips", () => {
    let misaligned = 0;
    for (let i = 0; i < N; i += 1) {
      const q = makeDecimalOpsQuestion(rngFromSeed(`decq-${i}`));
      expect(q.skill).toBe("add:decimalOps");
      const values = q.choices.map((c) => Math.round(Number(c) * 100));
      expect(new Set(values).size).toBe(4);
      expect(q.choices).toContain(q.answer);
      for (const c of q.choices) expect(c).toMatch(/^\d+(\.\d{1,2})?$/);
      // A point slip (×10 or ÷10) shows up on most cards.
      const right = Math.round(Number(q.answer) * 100);
      if (values.some((v) => v === right * 10 || v * 10 === right)) misaligned += 1;
    }
    expect(misaligned).toBeGreaterThan(N * 0.3);
  });

  it("prints a worksheet row", () => {
    const item = decimalOpsSheet(rngFromSeed("dec-sheet"));
    expect(item.prompt).toMatch(/[+−×÷]/);
    expect(item.answer).toMatch(/^\d+(\.\d{1,2})?$/);
  });
});

describe("grade 5 slice 3 copy", () => {
  const LOCALES: Locale[] = ["en", "es", "pt", "fr", "zh", "hi", "ar"];

  it("has a title, hint, and worked example in every locale", () => {
    try {
      for (const locale of LOCALES) {
        setLocale(locale);
        for (const make of [makeBigMultiQuestion, makeLongDivQuestion, makeDecimalOpsQuestion]) {
          for (let i = 0; i < 30; i += 1) {
            const q = make(rngFromSeed(`copy-${locale}-${i}`));
            expect(q.title.trim().length).toBeGreaterThan(0);
            expect(q.hint.trim().length).toBeGreaterThan(0);
            const example = workedExample(q);
            expect(example.frames.length).toBeGreaterThanOrEqual(2);
            if (locale !== "en") expect(q.hint).not.toMatch(/^(Split each|Line up|Think in|How many)/);
            if (locale === "ar") {
              // Math stays in one left-to-right run.
              if (/[×÷+−]/.test(q.title)) expect(q.title).toContain("\u2066");
            }
          }
        }
      }
    } finally {
      setLocale("en");
    }
  });
});
