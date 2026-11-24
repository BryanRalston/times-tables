import { afterEach, describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { setLocale, type Locale } from "../i18n";
import { speakable } from "../voice/speakable";
import type { ChoiceQ } from "./types";
import { fractionsCard, variablesCard } from "./cards";
import { fractionsGame } from "./fractions";
import { variablesGame } from "./variables";
import {
  EXPONENT_FACTS,
  FRAC_DIV_FACTS,
  GCF_FACTS,
  LCM_FACTS,
  gcd,
  lcm,
  exprPalLine,
  makeExponentsQuestion,
  makeExprEvalQuestion,
  makeFracDivQuestion,
  makeGcfLcmQuestion,
} from "./grade6";

function scene(q: ChoiceQ) {
  if (q.visual.kind !== "scene") throw new Error("scene");
  return q.visual.board;
}

function plain(text: string): string {
  return text.replace(/[\u2066\u2069]/g, "");
}

function assertCard(q: ChoiceQ) {
  expect(q.choices).toHaveLength(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
  expect(q.choices.filter((choice) => choice === q.answer)).toHaveLength(1);
  expect(q.title.length).toBeGreaterThan(0);
  expect(q.hint.length).toBeGreaterThan(0);
  const blob = `${q.title} ${q.hint} ${q.answer} ${q.choices.join(" ")} ${q.praise ?? ""}`;
  expect(blob).not.toMatch(/(?<![0-9])-\d/);
}

describe("grade 6 expressions (6.EE.A)", () => {
  afterEach(() => setLocale("en"));

  it("evaluates a letter with small whole numbers, or matches an equivalent expression", () => {
    const kinds = new Set<string>();
    for (let seed = 0; seed < 400; seed += 1) {
      const q = makeExprEvalQuestion(rngFromSeed(`ex-${seed}`));
      const board = scene(q);
      if (board.game !== "variables" || board.mode !== "exprEval") throw new Error("board");
      expect(q.skill).toBe("variables:exprEval");
      assertCard(q);
      kinds.add(board.ask ?? "");
      const expr = plain(board.expr ?? "");
      expect(expr.length).toBeGreaterThan(0);
      if (board.ask === "value") {
        expect(board.a).toBeGreaterThan(0);
        expect(Number(q.answer)).toBe(board.c);
        expect(Number(q.answer)).toBeGreaterThan(0);
        expect(q.choices.every((choice) => /^\d+$/.test(choice))).toBe(true);
        expect(q.choices.every((choice) => Number(choice) >= 0)).toBe(true);
      } else {
        expect(q.answer).toMatch(/[xny]/);
        expect(q.choices.every((choice) => choice !== expr)).toBe(true);
      }
    }
    expect([...kinds].sort()).toEqual(["match", "value"]);
  });
});

describe("grade 6 exponents (6.EE.A.1)", () => {
  it("asks small whole-number powers with the real slips nearby", () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 300; seed += 1) {
      const q = makeExponentsQuestion(rngFromSeed(`pow-${seed}`));
      const board = scene(q);
      if (board.game !== "variables" || board.mode !== "exponents") throw new Error("board");
      expect(q.skill).toBe("variables:exponents");
      assertCard(q);
      const expr = plain(board.expr ?? "");
      const [base, exp] = expr.split("^").map(Number);
      expect(EXPONENT_FACTS.some((row) => row[0] === base && row[1] === exp && row[2] === Number(q.answer))).toBe(true);
      expect(Number(q.answer)).toBe(base ** exp);
      // The classic slip (base times exponent) is usually among the tiles.
      seen.add(expr);
      expect(q.choices.every((choice) => Number(choice) >= 0)).toBe(true);
    }
    expect(seen.size).toBeGreaterThan(8);
  });

  it("prints exponent titles as superscripts and speaks them in every locale", () => {
    const locales: Locale[] = ["en", "es", "pt", "fr", "zh", "hi", "ar"];
    for (const locale of locales) {
      setLocale(locale);
      const q = makeExponentsQuestion(rngFromSeed(`pow-title-${locale}`));
      expect(q.title, locale).toMatch(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/);
      expect(q.title, locale).not.toMatch(/\d\^\d/);
      expect(q.hint, locale).toContain("2³");
      expect(q.hint, locale).not.toContain("2^3");
      const heard = speakable(q.title);
      expect(heard, locale).not.toMatch(/\d\^\d/);
      expect(heard, locale).not.toMatch(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/);
      expect(heard, locale).toMatch(/squared|to the power of|al cuadrado|a la potencia de|ao quadrado|elevado a|au carré|à la puissance|的平方|次方|का वर्ग|की घात|تربيع|أس/);
    }
    setLocale("en");
  });
});

describe("grade 6 fraction division (6.NS.A)", () => {
  it("asks how many of one fraction fit in another, with a whole-number answer", () => {
    for (let seed = 0; seed < 300; seed += 1) {
      const q = makeFracDivQuestion(rngFromSeed(`fd-${seed}`));
      const board = scene(q);
      if (board.game !== "fractions" || board.mode !== "fracDiv") throw new Error("board");
      expect(q.skill).toBe("fractions:fracDiv");
      assertCard(q);
      expect(FRAC_DIV_FACTS.some((row) => row[0] === board.num && row[1] === board.den && row[2] === board.num2 && row[3] === board.den2 && row[4] === Number(q.answer))).toBe(true);
      expect((board.num / board.den) / (board.num2 / board.den2)).toBeCloseTo(Number(q.answer), 9);
      expect(Number.isInteger(Number(q.answer))).toBe(true);
      expect(Number(q.answer)).toBeGreaterThan(0);
      expect(q.hint.toLowerCase()).toMatch(/fit|caben|cabem|tiennent|放下|समाते|يدخل/);
    }
  });
});

describe("grade 6 GCF and LCM (6.NS.B)", () => {
  it("asks greatest common factor or least common multiple of friendly pairs", () => {
    const kinds = new Set<string>();
    for (let seed = 0; seed < 300; seed += 1) {
      const q = makeGcfLcmQuestion(rngFromSeed(`gf-${seed}`));
      const board = scene(q);
      if (board.game !== "patterns" || board.mode !== "gcfLcm" || !board.factor) throw new Error("board");
      expect(q.skill).toBe("patterns:gcfLcm");
      assertCard(q);
      const fact = board.factor;
      kinds.add(fact.kind);
      expect(fact.a).toBeGreaterThan(0);
      expect(fact.b).toBeGreaterThan(0);
      if (fact.kind === "gcf") {
        expect(gcd(fact.a, fact.b)).toBe(Number(q.answer));
        expect(GCF_FACTS.some((row) => row.a === fact.a && row.b === fact.b && row.value === Number(q.answer))).toBe(true);
      } else {
        expect(lcm(fact.a, fact.b)).toBe(Number(q.answer));
        expect(LCM_FACTS.some((row) => row.a === fact.a && row.b === fact.b && row.value === Number(q.answer))).toBe(true);
      }
      expect(q.choices.every((choice) => Number(choice) > 0)).toBe(true);
    }
    expect([...kinds].sort()).toEqual(["gcf", "lcm"]);
  });
});

describe("grade 6 cards stay in every locale and never go negative", () => {
  const locales: Locale[] = ["en", "es", "pt", "fr", "zh", "hi", "ar"];
  afterEach(() => setLocale("en"));

  it("keeps four distinct tiles and no negative numbers", () => {
    for (const locale of locales) {
      setLocale(locale);
      for (let i = 0; i < (locale === "en" ? 40 : 20); i += 1) {
        assertCard(makeExprEvalQuestion(rngFromSeed(`loc-ex-${locale}-${i}`)));
        assertCard(makeExponentsQuestion(rngFromSeed(`loc-pow-${locale}-${i}`)));
        assertCard(makeFracDivQuestion(rngFromSeed(`loc-fd-${locale}-${i}`)));
        assertCard(makeGcfLcmQuestion(rngFromSeed(`loc-gf-${locale}-${i}`)));
      }
    }
  });
});

describe("grade 6 pal lines and pills", () => {
  it("gives expressions and exponents a fitting pal line in every locale", () => {
    const locales = ["en", "es", "pt", "fr", "zh", "hi", "ar"] as const;
    try {
      for (const locale of locales) {
        setLocale(locale);
        const swap = exprPalLine({ mode: "exprEval", ask: "value", letter: "x" });
        const match = exprPalLine({ mode: "exprEval", ask: "match", letter: "x" });
        const exp = exprPalLine({ mode: "exponents", ask: "value", letter: "" });
        expect(swap.length).toBeGreaterThan(4);
        expect(match.length).toBeGreaterThan(4);
        expect(exp.length).toBeGreaterThan(4);
        expect(swap).not.toMatch(/Count with me|Cuenta conmigo|Cuenta conmigo/i);
        expect(exp.toLowerCase()).not.toContain("count with me");
      }
    } finally {
      setLocale("en");
    }
    setLocale("en");
    expect(exprPalLine({ mode: "exprEval", ask: "value", letter: "x" })).toBe("Swap in the number for the letter.");
    expect(exprPalLine({ mode: "exprEval", ask: "match", letter: "x" })).toBe("Count the letters.");
    expect(exprPalLine({ mode: "exponents", ask: "value", letter: "" })).toBe("Multiply it by itself.");
  });

  it("labels grade 6 levels with short pills", () => {
    const expr = variablesCard.levels.find((row) => row.id === "exprEval")!;
    const exp = variablesCard.levels.find((row) => row.id === "exponents")!;
    const div = fractionsCard.levels.find((row) => row.id === "fracDiv")!;
    expect(variablesCard.pill(expr)).toBe("Expressions · 7");
    expect(variablesCard.pill(exp)).toBe("Exponents · 8");
    expect(fractionsCard.pill(div)).toBe("Fractions · 11");
    expect(variablesGame.pill(expr)).toBe("Expressions · 7");
    expect(variablesGame.pill(exp)).toBe("Exponents · 8");
    expect(fractionsGame.pill(div)).toBe("Fractions · 11");
    expect(variablesGame.pill(expr)).not.toContain("What is missing");
    expect(variablesGame.pill(expr)).not.toContain("Level");
  });
});
