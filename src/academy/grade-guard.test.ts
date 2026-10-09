import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { openingIndex, startLadder, stepLadder } from "./adapt";
import { GAMES } from "./games/registry";
import { pileCents } from "./games/money-model";
import { sightWords, type SightList } from "./games/sight-data";
import { spellWords, type SpellLevel } from "./games/spell-data";
import { TIME_MINUTES, type TimeLevel } from "./games/time";
import { TIMES_SPEC, type TimesLevel } from "./games/times";
import { FRACTION_DENOMINATORS, GRADE_BANDS, playWindow } from "./grade-map";
import { makeClockTask, makePayTask } from "./hands";
import type { Grade } from "./model";
import { nextPlacement } from "./placement";
import { blankChild } from "./storage";
import type { ChoiceQ } from "./games/types";

const GRADES: Grade[] = ["K", "1", "2", "3"];
const SAMPLES = 200;
const FIVES_ONLY = [5, 10, 20, 25, 35, 40, 50, 55];

function skillLevel(question: ChoiceQ): string {
  const cut = question.skill.lastIndexOf(":");
  return cut < 0 ? question.skill : question.skill.slice(cut + 1);
}

function assertQuestion(grade: Grade, level: string, question: ChoiceQ): void {
  expect(skillLevel(question)).toBe(level);
  const visual = question.visual;
  switch (visual.kind) {
    case "add": {
      const max = level === "within5" ? 5 : level === "within10" ? 10 : level === "within20" ? 20 : 100;
      expect(visual.pink).toBeGreaterThanOrEqual(0);
      expect(visual.teal).toBeGreaterThanOrEqual(0);
      if (visual.op === "+") {
        expect(visual.pink + visual.teal).toBeLessThanOrEqual(max);
      } else {
        expect(visual.pink + visual.teal).toBeLessThanOrEqual(max);
        expect(visual.pink).toBeGreaterThanOrEqual(0);
      }
      if (level === "tens") {
        expect(visual.pink + visual.teal).toBeGreaterThanOrEqual(10);
        if (visual.op === "+") {
          expect(visual.pink < 10 || visual.teal < 10 || visual.pink % 10 === 0 || visual.teal % 10 === 0).toBe(true);
        } else {
          expect(visual.teal < 10 || visual.teal % 10 === 0).toBe(true);
        }
      }
      if (grade === "K" || grade === "1") expect(level).not.toBe("within100");
      break;
    }
    case "times": {
      expect(visual.a * visual.b).toBe(Number(question.answer));
      expect(visual.a * visual.b).toBeLessThanOrEqual(100);
      const spec = TIMES_SPEC[level as TimesLevel];
      expect(spec.factors.includes(visual.a) || spec.factors.includes(visual.b)).toBe(true);
      expect(visual.b).toBeLessThanOrEqual(spec.max);
      if (level === "count") expect(visual.a * visual.b).toBeLessThanOrEqual(20);
      if (grade !== "3") expect([6, 7, 8, 9]).not.toContain(visual.a);
      if (grade !== "3") expect([6, 7, 8, 9]).not.toContain(visual.b);
      if (grade === "K") throw new Error("kindergarten is not served multiplication");
      break;
    }
    case "time": {
      expect(visual.hours).toBeGreaterThanOrEqual(1);
      expect(visual.hours).toBeLessThanOrEqual(12);
      expect(TIME_MINUTES[level as TimeLevel]).toContain(visual.minutes);
      expect(visual.minutes % 5).toBe(0);
      if (grade === "K") expect(visual.minutes).toBe(0);
      if (grade === "1") expect(FIVES_ONLY).not.toContain(visual.minutes);
      break;
    }
    case "money": {
      expect(visual.coins.dollar).toBeGreaterThanOrEqual(0);
      if (grade === "K") expect(visual.mode).toBe("name");
      if (grade === "1") expect(["name", "count", "make"]).toContain(visual.mode);
      if (grade === "K" || grade === "1") {
        expect(visual.mode).not.toBe("change");
        expect(visual.mode).not.toBe("dollars");
        expect(visual.coins.dollar).toBe(0);
      }
      if (visual.mode === "name") {
        const shown = (["penny", "nickel", "dime", "quarter", "dollar"] as const).filter((kind) => visual.coins[kind] > 0);
        expect(shown).toEqual([shown[0]]);
        expect(visual.coins.dollar).toBe(0);
      }
      if (visual.mode === "count") {
        expect(pileCents(visual.coins)).toBeGreaterThan(0);
        expect(pileCents(visual.coins)).toBeLessThanOrEqual(50);
        expect(visual.coins.quarter).toBeLessThanOrEqual(1);
        expect(visual.coins.dollar).toBe(0);
      }
      if (visual.mode === "change") {
        const paid = pileCents(visual.coins);
        expect(paid).toBeLessThanOrEqual(100);
        expect(visual.priceCents ?? 0).toBeGreaterThan(0);
        expect(visual.priceCents ?? 0).toBeLessThan(paid);
      }
      if (visual.mode === "dollars") {
        expect(visual.coins.dollar).toBeGreaterThan(0);
        expect(visual.coins.dollar).toBeLessThanOrEqual(2);
        expect(pileCents(visual.coins)).toBeLessThanOrEqual(300);
      }
      break;
    }
    case "sight": {
      const list = sightWords(level as SightList);
      expect(list.some((word) => word.word === visual.word)).toBe(true);
      if (grade === "K" || grade === "1") {
        expect(visual.mode).not.toBe("fill");
        expect(question.answer).toBe(visual.word);
        if (visual.mode === "match") expect(visual.pictures?.[question.answer]).toBeTruthy();
      }
      break;
    }
    case "spell": {
      const list = spellWords(level as SpellLevel);
      expect(list.some((word) => word.word === visual.word)).toBe(true);
      expect(question.answer).toBe(visual.word);
      if (level === "patterns") expect(visual.showSentence).toBe(true);
      else expect(visual.showSentence).toBe(false);
      if (grade === "K" || grade === "1") expect(visual.showSentence).toBe(false);
      break;
    }
    default: {
      const neverVisual: never = visual;
      throw new Error(`Unhandled question kind: ${String(neverVisual)}`);
    }
  }
}

describe("grade bands", () => {
  it("maps every registered game and keeps the start inside that game", () => {
    for (const game of GAMES) {
      const bands = GRADE_BANDS[game.id];
      expect(bands).toBeTruthy();
      for (const grade of GRADES) {
        const row = bands?.[grade];
        expect(row?.standards.length).toBeGreaterThan(0);
        expect(game.isLevel(row?.start)).toBe(true);
        expect(game.defaultLevel(grade)).toBe(row?.start);
        for (const level of row?.levels ?? []) expect(game.isLevel(level)).toBe(true);
        const allowed = playWindow(game.levels.map((level) => level.id), game.id, grade, false);
        if (row?.offer === "later") expect(allowed.ids).toEqual([]);
        else expect(allowed.ids).toContain(row?.start);
      }
    }
    expect(FRACTION_DENOMINATORS).toEqual([2, 3, 4, 6, 8]);
  });

  it("lets adaptive play drift one level and stops there unless challenge ahead is on", () => {
    const add = GAMES.find((game) => game.id === "add");
    expect(add).toBeTruthy();
    const ids = add!.levels.map((level) => level.id);
    const band = playWindow(ids, "add", "K", false);
    expect(band.ids).toEqual(["within5", "within10", "within20"]);
    expect(playWindow(ids, "add", "K", true).ids.at(-1)).toBe("within100");
    let ladder = startLadder(openingIndex(ids.indexOf(band.start), 0, false, { min: band.min, max: band.max }));
    for (let i = 0; i < 12; i++) {
      ladder = stepLadder(ladder, ids.length, true, { min: band.min, max: band.max });
      expect(ladder.index).toBeGreaterThanOrEqual(band.min);
      expect(ladder.index).toBeLessThanOrEqual(band.max);
    }
    expect(ids[ladder.index]).not.toBe("within100");
    expect(ids[ladder.index]).not.toBe("tens");
  });

  it("does not place a kindergartner into times tables", () => {
    const child = blankChild({ name: "Ada", grade: "K" });
    expect(nextPlacement(child).game).not.toBe("times");
    expect(child.journey.areaId).not.toBe("times");
  });

  it("keeps 200 questions inside each grade", () => {
    for (const game of GAMES) {
      for (const grade of GRADES) {
        const allowed = playWindow(game.levels.map((level) => level.id), game.id, grade, false);
        if (allowed.offer === "later") {
          expect(allowed.ids).toEqual([]);
          continue;
        }
        for (let i = 0; i < SAMPLES; i++) {
          const level = allowed.ids[i % allowed.ids.length]!;
          const question = game.makeQuestion(rngFromSeed(`${game.id}-${grade}-${level}-${i}`), level);
          expect(question.game).toBe(game.id);
          expect(question.choices).toHaveLength(4);
          expect(question.choices).toContain(question.answer);
          assertQuestion(grade, level, question);
          if (game.id === "time") {
            const clock = makeClockTask(level, rngFromSeed(`clock-${grade}-${level}-${i}`));
            expect(TIME_MINUTES[level as TimeLevel]).toContain(clock.minutes);
            if (grade === "K") expect(clock.minutes).toBe(0);
            if (grade === "1") expect(FIVES_ONLY).not.toContain(clock.minutes);
          }
          if (game.id === "money") {
            const pay = makePayTask(level, rngFromSeed(`pay-${grade}-${level}-${i}`));
            expect(pay.cents).toBeGreaterThan(0);
            expect(pay.cents).toBeLessThanOrEqual(grade === "3" || grade === "2" ? 200 : 75);
            if (level === "name") expect(pay.bank).toHaveLength(1);
            if (grade === "K" || grade === "1") expect(pay.cents).toBeLessThanOrEqual(75);
          }
        }
      }
    }
  });
});
