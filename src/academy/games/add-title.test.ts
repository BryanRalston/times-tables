import { afterEach, describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { setLocale, type Locale } from "../i18n";
import { ADD_LEVELS, COUNT_ON_MAX, addCountLine, addHideOf, addTitleLines, countsUpByOnes, makeAddQuestion, type AddHide } from "./add";
import type { ChoiceQ } from "./types";

type AddVisual = Extract<ChoiceQ["visual"], { kind: "add" }>;
const SMALL_LEVELS = ["within5", "within10", "within20", "tens", "within100"] as const;
const SHAPES = ["+left", "+right", "+result", "-left", "-right", "-result"] as const;

function cards(level: (typeof ADD_LEVELS)[number], seeds = 160): { q: ChoiceQ; v: AddVisual }[] {
  const out: { q: ChoiceQ; v: AddVisual }[] = [];
  for (let seed = 0; seed < seeds; seed++) {
    for (const prefer of [[], ...SHAPES.map((s) => [`shape:${s}`])]) {
      const q = makeAddQuestion(rngFromSeed(`title-${level}-${seed}-${prefer.join()}`), level, prefer);
      if (q.visual.kind === "add") out.push({ q, v: q.visual });
    }
  }
  return out;
}

const COUNT_ON = /count on/i;

afterEach(() => setLocale("en"));

describe("Addition card titles match the hidden number", () => {
  it("never says Count on for a subtraction card", () => {
    let minus = 0;
    for (const level of SMALL_LEVELS) {
      for (const { q, v } of cards(level)) {
        if (v.op !== "-") continue;
        minus += 1;
        expect(q.title, `${v.solved} (${addHideOf(v)})`).not.toMatch(COUNT_ON);
      }
    }
    expect(minus).toBeGreaterThan(500);
  });

  it("asks what was taken away or what is left for each subtraction slot", () => {
    const seen = new Set<AddHide>();
    for (const level of SMALL_LEVELS) {
      for (const { q, v } of cards(level)) {
        if (v.op !== "-") continue;
        const hide = addHideOf(v);
        seen.add(hide);
        if (hide === "right") expect(q.title).toBe("How many were taken away?");
        else if (hide === "result") expect(q.title).toBe("What is left?");
        else expect(["Tap the missing number!", "What number is hiding?"]).toContain(q.title);
      }
    }
    expect([...seen].sort()).toEqual(["left", "result", "right"]);
  });

  it("keeps Count on only for a hidden addend in a sum within 20", () => {
    let countOn = 0;
    for (const level of SMALL_LEVELS) {
      for (const { q, v } of cards(level)) {
        if (!COUNT_ON.test(q.title)) continue;
        countOn += 1;
        expect(v.op).toBe("+");
        expect(addHideOf(v)).not.toBe("result");
        expect(v.pink + v.teal).toBeLessThanOrEqual(COUNT_ON_MAX);
        expect(v.hidden).toBeLessThanOrEqual(10);
      }
    }
    expect(countOn).toBeGreaterThan(20);
  });

  it("every title it can say is one of the lines for that slot", () => {
    for (const level of SMALL_LEVELS) {
      for (const { q, v } of cards(level, 40)) {
        const hide = addHideOf(v);
        const lines = addTitleLines(v.op, hide, v.pink + v.teal, hide === "right" ? v.pink : v.teal).map((line) => line[0]);
        expect(lines).toContain(q.title);
      }
    }
  });

  it("speaks the new subtraction titles in all 7 languages", () => {
    const want: Record<Locale, [string, string]> = {
      en: ["What is left?", "How many were taken away?"],
      es: ["¿Cuánto queda?", "¿Cuántos se quitaron?"],
      pt: ["Quanto sobrou?", "Quantos foram tirados?"],
      fr: ["Combien en reste-t-il ?", "Combien en a-t-on enlevé ?"],
      zh: ["还剩多少？", "拿走了多少？"],
      hi: ["कितने बचे?", "कितने हटाए गए?"],
      ar: ["كم بقي؟", "كم أُخِذ؟"],
    } as Record<Locale, [string, string]>;
    for (const [locale, [left, taken]] of Object.entries(want) as [Locale, [string, string]][]) {
      setLocale(locale);
      const result = makeAddQuestion(rngFromSeed(`lang-${locale}`), "within20", ["shape:-result"]);
      const right = makeAddQuestion(rngFromSeed(`lang-${locale}`), "within20", ["shape:-right"]);
      expect(result.title, locale).toBe(left);
      expect(right.title, locale).toBe(taken);
    }
  });
});

describe("Count-up hint on missing-number cards", () => {
  type V = Extract<ChoiceQ["visual"], { kind: "add" }>;
  const card = (op: "+" | "-", known: number, hidden: number, max: number): V =>
    op === "+"
      ? { kind: "add", op, left: known, right: null, result: known + hidden, pink: known, teal: hidden, max, hidden, solved: "" }
      : { kind: "add", op, left: known + hidden, right: null, result: known, pink: known, teal: hidden, max, hidden, solved: "" };

  it("keeps Start at X. Count up to Y. for a gap of 10 or less within 20", () => {
    expect(addCountLine(card("+", 13, 2, 100))).toBe("Start at 13. Count up to 15.");
    expect(addCountLine(card("+", 8, 2, 10))).toBe("Start at 8. Count up to 10.");
    expect(addCountLine(card("-", 7, 10, 20))).toBe("Start at 7. Count up to 17.");
    expect(addCountLine(card("+", 10, 10, 20))).toBe("Start at 10. Count up to 20.");
  });

  it("says Count the tens, then the ones for a gap over 10 or numbers over 20", () => {
    expect(addCountLine(card("+", 3, 15, 20))).toBe("Count the tens, then the ones.");
    expect(addCountLine(card("-", 2, 11, 20))).toBe("Count the tens, then the ones.");
    expect(addCountLine(card("-", 42, 40, 100))).toBe("Count the tens, then the ones.");
    expect(addCountLine(card("+", 83, 2, 100))).toBe("Count the tens, then the ones.");
  });

  it("matches every generated missing-number card", () => {
    for (const level of SMALL_LEVELS) {
      for (const { v } of cards(level, 60)) {
        const hide = addHideOf(v);
        const missing = v.op === "+" ? hide !== "result" : hide === "right";
        if (!missing) continue;
        const known = v.op === "+" ? (hide === "right" ? v.pink : v.teal) : v.pink;
        const total = v.pink + v.teal;
        const small = countsUpByOnes(known, total);
        expect(addCountLine(v)).toBe(small ? `Start at ${known}. Count up to ${total}.` : "Count the tens, then the ones.");
        if (COUNT_ON.test(addTitleLines(v.op, hide, total, known).map((l) => l[0]).join("|"))) expect(small).toBe(true);
      }
    }
  });

  it("is in all 7 languages", () => {
    const seen = new Set<string>();
    for (const locale of ["en", "es", "pt", "fr", "zh", "hi", "ar"] as Locale[]) {
      setLocale(locale);
      const line = addCountLine(card("-", 42, 40, 100));
      expect(line.length, locale).toBeGreaterThan(5);
      seen.add(line);
    }
    expect(seen.size).toBe(7);
  });
});
