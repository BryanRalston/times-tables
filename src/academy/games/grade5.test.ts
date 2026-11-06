import { afterEach, describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { setLocale, type Locale } from "../i18n";
import { evalOrder } from "./variables.test";
import { makeFracTimesQuestion, makeOrderOpsQuestion, makeThousandthsQuestion, rollOrderForm, simplestFraction, thousandthsText } from "./grade5";
import type { ChoiceQ } from "./types";

function scene(q: ChoiceQ) {
  if (q.visual.kind !== "scene") throw new Error("scene");
  return q.visual.board;
}

function plain(text: string): string {
  return text.replace(/[\u2066\u2069]/g, "");
}

describe("grade 5 decimals to thousandths", () => {
  afterEach(() => setLocale("en"));

  it("prints thousandths with the right digits", () => {
    expect(thousandthsText(4837, 3)).toBe("4.837");
    expect(thousandthsText(4837, 2)).toBe("4.83");
    expect(thousandthsText(4800, 1)).toBe("4.8");
    expect(thousandthsText(5, 3)).toBe("0.005");
  });

  it("asks value, rounding, and ordering with one right answer", () => {
    const kinds = new Set<string>();
    for (let seed = 0; seed < 300; seed += 1) {
      const q = makeThousandthsQuestion(rngFromSeed(`th-${seed}`));
      const board = scene(q);
      if (board.game !== "place" || board.mode !== "thousandths") throw new Error("board");
      kinds.add(board.ask);
      expect(q.skill).toBe("place:thousandths");
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
      if (board.ask === "value") {
        const digit = Number(/the (\d) in/.exec(q.title)?.[1]);
        const frac = board.text.split(".")[1] ?? "";
        const at = frac.indexOf(String(digit)) + 1;
        expect(at).toBe(board.place);
        expect(Number(q.answer)).toBeCloseTo(digit / 10 ** at, 9);
        expect(new Set(frac.split("")).size).toBe(3);
      }
      if (board.ask === "round") {
        const text = /Round (\d\.\d{3}) to the nearest (tenth|hundredth)/.exec(q.title);
        expect(text).toBeTruthy();
        const places = text?.[2] === "tenth" ? 1 : 2;
        const scaled = Number(text?.[1]) * 10 ** places;
        expect(Number(q.answer)).toBeCloseTo(Math.floor(scaled + 0.5 + 1e-9) / 10 ** places, 9);
        // No two choices are the same amount.
        expect(new Set(q.choices.map(Number)).size).toBe(4);
      }
      if (board.ask === "greatest") {
        const values = q.choices.map(Number);
        const wantMax = q.factKey?.includes(":max:") === true;
        expect(Number(q.answer)).toBe(wantMax ? Math.max(...values) : Math.min(...values));
        expect(new Set(values).size).toBe(4);
      }
    }
    expect([...kinds].sort()).toEqual(["greatest", "round", "value"]);
  });
});

describe("grade 5 multiply fractions", () => {
  it("gives simplest-form products and whole-number products", () => {
    expect(simplestFraction(6, 12)).toBe("1/2");
    expect(simplestFraction(8, 4)).toBe("2");
    let wholeSeen = false;
    let fracSeen = false;
    for (let seed = 0; seed < 300; seed += 1) {
      const q = makeFracTimesQuestion(rngFromSeed(`ft-${seed}`));
      const board = scene(q);
      if (board.game !== "fractions" || board.mode !== "fracTimes") throw new Error("board");
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
      if (board.whole > 0) {
        wholeSeen = true;
        expect(Number(q.answer)).toBe((board.num * board.whole) / board.den);
        expect(q.title).toContain(`${board.num}/${board.den} × ${board.whole}`);
      } else {
        fracSeen = true;
        expect(q.answer).toBe(simplestFraction(board.num * board.num2, board.den * board.den2));
        const amounts = q.choices.map((choice) => {
          const [n, d] = choice.split("/").map(Number);
          return n! / d!;
        });
        expect(new Set(amounts.map((a) => a.toFixed(6))).size).toBe(4);
      }
    }
    expect(wholeSeen && fracSeen).toBe(true);
  });
});

describe("grade 5 order of operations", () => {
  afterEach(() => setLocale("en"));

  it("changes the answer when the parentheses are ignored, and evaluates correctly", () => {
    for (let seed = 0; seed < 400; seed += 1) {
      const form = rollOrderForm(rngFromSeed(`oo-form-${seed}`));
      expect(evalOrder(form.expr)).toBe(form.value);
      expect(form.value).toBeGreaterThanOrEqual(1);
      expect(form.value).toBeLessThanOrEqual(100);
      expect(form.ignoring).not.toBe(form.value);
      expect(form.expr).toContain("(");
      expect(form.expr.match(/[+−×]/g)?.length ?? 0).toBeLessThanOrEqual(3);
    }
  });

  it("always offers the answer you get by ignoring the parentheses", () => {
    let values = 0;
    let matches = 0;
    for (let seed = 0; seed < 400; seed += 1) {
      const q = makeOrderOpsQuestion(rngFromSeed(`oo-${seed}`));
      const board = scene(q);
      if (board.game !== "variables" || board.mode !== "orderOps") throw new Error("board");
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
      if (board.ask === "value") {
        values += 1;
        expect(Number(q.answer)).toBe(evalOrder(board.expr ?? ""));
        const expr = (board.expr ?? "").replace(/[()]/g, "");
        expect(q.choices).toContain(String(evalOrder(expr)));
      } else {
        matches += 1;
        expect(plain(q.answer)).toBe(board.expr);
        for (const choice of q.choices) {
          if (choice !== q.answer) expect(evalOrder(choice)).not.toBe(-1);
        }
        const title = q.title;
        const nums = (title.match(/\d+/g) ?? []).map(Number);
        const a = evalOrder(board.expr ?? "");
        expect(a).toBe(board.c);
        // The right expression uses exactly the numbers in the words.
        expect([...(board.expr ?? "").match(/\d+/g) ?? []].map(Number).sort()).toEqual([...nums].sort());
      }
    }
    expect(values).toBeGreaterThan(100);
    expect(matches).toBeGreaterThan(100);
  });

  it("keeps printed math in a left-to-right run in Arabic and every title filled in all 7 languages", () => {
    const locales: Locale[] = ["en", "es", "pt", "fr", "zh", "hi", "ar"];
    for (const locale of locales) {
      setLocale(locale);
      for (let seed = 0; seed < 30; seed += 1) {
        for (const q of [makeThousandthsQuestion(rngFromSeed(`l-${seed}`)), makeFracTimesQuestion(rngFromSeed(`l-${seed}`)), makeOrderOpsQuestion(rngFromSeed(`l-${seed}`))]) {
          expect(q.title.trim().length).toBeGreaterThan(5);
          expect(q.hint.trim().length).toBeGreaterThan(5);
          expect(q.title).not.toContain("undefined");
          expect(q.hint).not.toContain("undefined");
          if (locale === "ar" && q.skill === "variables:orderOps" && /[()]/.test(q.answer)) {
            expect(q.answer.startsWith("\u2066")).toBe(true);
            expect(q.answer.endsWith("\u2069")).toBe(true);
          }
          if (locale !== "ar") expect(`${q.title}${q.answer}`).not.toMatch(/[\u2066\u2069]/);
        }
      }
    }
  });
});
