import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { describePile, formatCents, pileCents } from "./money-model";
import { MONEY_LEVELS, isMoneyLevel, makeMoneyQuestion, moneyGame, type MoneyLevel } from "./money";
import type { MoneyVisual } from "./types";

function visual(level: MoneyLevel, seed: number): MoneyVisual {
  const q = makeMoneyQuestion(rngFromSeed(`${level}-${seed}`), level);
  expect(q.game).toBe("money");
  expect(q.choices).toHaveLength(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
  expect(q.praise.startsWith("Yes!")).toBe(true);
  expect(q.almost.startsWith("Almost!")).toBe(true);
  expect(q.visual.kind).toBe("money");
  return q.visual as MoneyVisual;
}

describe("money questions", () => {
  it("starts each grade on a K–3 level", () => {
    expect(moneyGame.defaultLevel("K")).toBe("name");
    expect(moneyGame.defaultLevel("1")).toBe("count");
    expect(moneyGame.defaultLevel("2")).toBe("make");
    expect(moneyGame.defaultLevel("3")).toBe("dollars");
    expect(MONEY_LEVELS).toEqual(["name", "count", "make", "change", "dollars"]);
    expect(isMoneyLevel("change")).toBe(true);
    expect(isMoneyLevel("nope")).toBe(false);
  });

  it("names one coin and counts a pile of pennies, nickels, dimes, and quarters", () => {
    for (let seed = 1; seed <= 16; seed++) {
      const named = visual("name", seed);
      expect(named.mode).toBe("name");
      const shown = (["penny", "nickel", "dime", "quarter", "dollar"] as const).filter((kind) => named.coins[kind] > 0);
      expect(shown).toHaveLength(1);
      expect(named.coins[shown[0]!]).toBe(1);
      expect(named.coins.dollar).toBe(0);
      const q = makeMoneyQuestion(rngFromSeed(`name-${seed}`), "name");
      expect(q.answer).toMatch(/Penny|Nickel|Dime|Quarter/);

      const counted = visual("count", seed);
      expect(counted.mode).toBe("count");
      const total = pileCents(counted.coins);
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(100);
      expect(counted.coins.dollar).toBe(0);
      const countQ = makeMoneyQuestion(rngFromSeed(`count-${seed}`), "count");
      expect(countQ.answer).toBe(formatCents(total));
      expect(describePile(counted.coins).length).toBeGreaterThan(0);
    }
  });

  it("asks which coin group makes an amount", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const q = makeMoneyQuestion(rngFromSeed(`make-${seed}`), "make");
      const row = q.visual as MoneyVisual;
      expect(row.mode).toBe("make");
      expect(row.priceCents).toBeGreaterThan(0);
      const piles = row.piles ?? {};
      expect(pileCents(piles[q.answer]!)).toBe(row.priceCents);
      for (const [key, pile] of Object.entries(piles)) {
        expect(pile.dollar).toBe(0);
        if (key !== q.answer) expect(pileCents(pile)).not.toBe(row.priceCents);
      }
    }
  });

  it("makes change within a dollar", () => {
    for (let seed = 1; seed <= 16; seed++) {
      const q = makeMoneyQuestion(rngFromSeed(`change-${seed}`), "change");
      const row = q.visual as MoneyVisual;
      const paid = pileCents(row.coins);
      expect(row.mode).toBe("change");
      expect(paid).toBeGreaterThan(0);
      expect(paid).toBeLessThanOrEqual(100);
      expect(row.priceCents).toBeGreaterThan(0);
      expect(row.priceCents).toBeLessThan(paid);
      expect(q.answer).toBe(formatCents(paid - row.priceCents!));
    }
  });

  it("reads dollars and cents for the grade 3 level", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const q = makeMoneyQuestion(rngFromSeed(`dollars-${seed}`), "dollars");
      const row = q.visual as MoneyVisual;
      const total = pileCents(row.coins);
      expect(row.mode).toBe("dollars");
      expect(row.coins.dollar).toBeGreaterThan(0);
      expect(total).toBeGreaterThan(100);
      expect(total % 100).not.toBe(0);
      expect(q.answer).toBe(formatCents(total));
      expect(q.answer.startsWith("$")).toBe(true);
    }
  });
});
