import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { setLocale } from "../i18n";
import {
  BALANCE_RANGE,
  balanceChoices,
  equationHolds,
  equationText,
  isBalanceLevel,
  makeBalanceQuestion,
  makeBalanceSheet,
  rollBalance,
} from "./balance-data";

const LEVELS = ["addsub", "times", "divide", "mix"] as const;

describe("Balance Scale questions", () => {
  it("keeps every equation true with positive whole numbers and four distinct tiles", () => {
    for (const level of LEVELS) {
      expect(isBalanceLevel(level)).toBe(true);
      for (const prefer of [[], ["ease:gentle"], ["ease:steady"], ["ease:firm"]]) {
        for (let i = 0; i < 120; i += 1) {
          const rng = rngFromSeed(`balance-${level}-${prefer.join(":")}-${i}`);
          const board = rollBalance(rng, level, prefer);
          expect(equationHolds(board)).toBe(true);
          expect(board.mode).toBe(level);
          if (level === "addsub") expect(["add", "sub"]).toContain(board.op);
          if (level === "times") expect(board.op).toBe("times");
          if (level === "divide") expect(board.op).toBe("divide");
          if (prefer.includes("ease:gentle") && level === "mix") expect(["add", "sub"]).toContain(board.op);
          const question = makeBalanceQuestion(rngFromSeed(`balance-q-${level}-${prefer.join(":")}-${i}`), level, prefer);
          expect(question.game).toBe("balance");
          expect(question.skill).toBe(`balance:${level}`);
          expect(question.choices).toHaveLength(4);
          expect(new Set(question.choices).size).toBe(4);
          expect(question.choices).toContain(question.answer);
          expect(question.visual.kind).toBe("scene");
          if (question.visual.kind === "scene" && question.visual.board.game === "balance") {
            expect(equationHolds(question.visual.board)).toBe(true);
            expect(question.answer).toBe(String(question.visual.board.x));
          }
          for (const choice of question.choices) expect(Number(choice)).toBeGreaterThan(0);
        }
      }
    }
  });

  it("uses smaller numbers on Easy and larger numbers on Hard", () => {
    const xs = { gentle: [] as number[], firm: [] as number[] };
    for (const ease of ["gentle", "firm"] as const) {
      for (let i = 0; i < 80; i += 1) {
        const board = rollBalance(rngFromSeed(`balance-size-${ease}-${i}`), "addsub", [`ease:${ease}`]);
        xs[ease].push(board.x, board.p, board.q);
        if (ease === "gentle") expect(board.q).toBeLessThanOrEqual(BALANCE_RANGE.addsub.gentle.qMax);
        if (ease === "firm") expect(board.q).toBeLessThanOrEqual(BALANCE_RANGE.addsub.firm.qMax);
      }
    }
    const avg = (ns: number[]) => ns.reduce((a, b) => a + b, 0) / ns.length;
    expect(avg(xs.firm)).toBeGreaterThan(avg(xs.gentle));
  });

  it("never writes a negative in the equation, the tiles, or the sheet", () => {
    try {
      for (const locale of ["en", "es", "pt", "fr", "zh", "hi", "ar"] as const) {
        setLocale(locale);
        for (const level of LEVELS) {
          for (let i = 0; i < 40; i += 1) {
            const question = makeBalanceQuestion(rngFromSeed(`balance-neg-${locale}-${level}-${i}`), level, ["ease:firm"]);
            const blob = `${question.title} ${question.hint} ${question.answer} ${question.choices.join(" ")} ${equationText(question.visual.kind === "scene" && question.visual.board.game === "balance" ? question.visual.board : { op: "add", p: 1, q: 2 })}`;
            expect(blob).not.toMatch(/(?<![0-9./xnyXNY ])-\d/);
            expect(blob).not.toMatch(/−\d/);
            const sheet = makeBalanceSheet(rngFromSeed(`balance-sheet-${locale}-${level}-${i}`), level);
            expect(sheet.prompt.length).toBeGreaterThan(0);
            expect(Number(sheet.answer)).toBeGreaterThan(0);
            expect(`${sheet.prompt} ${sheet.answer}`).not.toMatch(/−\d/);
          }
        }
      }
    } finally {
      setLocale("en");
    }
  });

  it("ships Imagine scale pieces as transparent webp", () => {
    const dir = join(dirname(fileURLToPath(import.meta.url)), "../art/scale");
    for (const name of ["beam", "stand", "pan", "cap"]) {
      const file = join(dir, `${name}.webp`);
      expect(existsSync(file), file).toBe(true);
      const bytes = readFileSync(file);
      expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
      expect(bytes.length).toBeGreaterThan(400);
      expect(bytes.length).toBeLessThan(80_000);
    }
  });

  it("fills four numeric tiles from nearby slips", () => {
    const board = rollBalance(rngFromSeed("balance-slips"), "addsub", []);
    const choices = balanceChoices(rngFromSeed("balance-slips-c"), board);
    expect(choices).toHaveLength(4);
    expect(choices).toContain(String(board.x));
    expect(new Set(choices).size).toBe(4);
  });
});
