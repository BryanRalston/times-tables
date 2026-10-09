import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { makeAddQuestion, type AddLevel } from "./games/add";
import { makeMoneyQuestion, type MoneyLevel } from "./games/money";
import { makeTimeQuestion, type TimeLevel } from "./games/time";
import { makeTimesQuestion, type TimesLevel } from "./games/times";
import type { AddVisual, ChoiceQ } from "./games/types";
import { greedyCoins, hintCue, promptSpeech, speakable, workedExample, type AddFrame, type MoneyFrame, type TimeFrame, type TimesFrame } from "./teach";

function addQ(partial: Partial<AddVisual> = {}): ChoiceQ {
  const visual: AddVisual = {
    kind: "add",
    op: "+",
    left: 3,
    right: 2,
    result: null,
    pink: 3,
    teal: 2,
    max: 10,
    hidden: 5,
    solved: "3 + 2 = 5",
    ...partial,
  };
  return {
    id: "add",
    game: "add",
    title: "Tap the missing number!",
    hint: "Count the dots",
    praise: `Yes! ${visual.solved}`,
    almost: `Almost! ${visual.solved}`,
    answer: String(visual.hidden),
    choices: ["3", "4", "5", "6"],
    skill: "add:within10",
    tags: [],
    visual,
  };
}

describe("worked examples", () => {
  it("counts dots, fills a ten frame, and jumps on a number line", () => {
    const example = workedExample(addQ());
    expect(example.speech).toContain("equals");
    const frames = example.frames as AddFrame[];
    expect(frames[0]).toMatchObject({ kind: "add", tealShown: 0, tenFilled: 3, caption: "Start with 3" });
    expect(frames[0]?.line).toEqual({ from: 3, to: 3, max: 10 });
    expect(frames.at(-1)).toMatchObject({ tealShown: 2, tenFilled: 5, caption: "3 + 2 = 5" });
    expect(frames.at(-1)?.line).toEqual({ from: 3, to: 5, max: 10 });
  });

  it("crosses out dots for subtraction", () => {
    const example = workedExample(
      addQ({
        op: "-",
        pink: 3,
        teal: 2,
        hidden: 3,
        solved: "5 − 2 = 3",
        max: 10,
      }),
    );
    const frames = example.frames as AddFrame[];
    expect(frames[0]).toMatchObject({ crossed: 0, tenFilled: 5, caption: "Start with 5" });
    expect(frames.at(-1)).toMatchObject({ crossed: 2, tenFilled: 3, caption: "5 − 2 = 3" });
    expect(frames.at(-1)?.line).toEqual({ from: 5, to: 3, max: 10 });
  });

  it("uses blocks and a number line past 20", () => {
    const frames = workedExample(
      addQ({
        pink: 40,
        teal: 30,
        hidden: 70,
        max: 100,
        solved: "40 + 30 = 70",
      }),
    ).frames as AddFrame[];
    expect(frames[0]?.tenFilled).toBeNull();
    expect(frames[0]?.blocks).toBe(true);
    expect(frames.at(-1)?.line).toEqual({ from: 40, to: 70, max: 70 });
  });

  it("builds equal groups up to the product", () => {
    const frames = workedExample({
      id: "times",
      game: "times",
      title: "Tap the answer!",
      hint: "3 groups of 4",
      praise: "Yes! 3 × 4 = 12",
      almost: "Almost! 3 × 4 = 12",
      answer: "12",
      choices: ["12", "7", "16", "9"],
      skill: "times:count",
      tags: ["table:3"],
      visual: { kind: "times", a: 3, b: 4, hidden: 12, solved: "3 × 4 = 12" },
    }).frames as TimesFrame[];
    expect(frames.map((frame) => frame.shownRows)).toEqual([1, 2, 3]);
    expect(frames[0]?.caption).toBe("1 group of 4");
    expect(frames.at(-1)?.caption).toBe("3 × 4 = 12");
  });

  it("moves the clock hands to the time", () => {
    const frames = workedExample({
      id: "time",
      game: "time",
      title: "What time is it?",
      hint: "The long hand points to 6 = half past",
      praise: "Yes! Half past 3",
      almost: "Almost! It is half past 3.",
      answer: "3:30",
      choices: ["3:30", "6:00", "3:00", "4:30"],
      skill: "time:half",
      tags: ["halfpast"],
      visual: { kind: "time", hours: 3, minutes: 30, level: "half" },
    }).frames as TimeFrame[];
    expect(frames.map((frame) => frame.handMinutes)).toEqual([0, 15, 30]);
    expect(frames.at(-1)?.caption).toBe("half past 3");
  });

  it("adds coins up to the total and names a coin", () => {
    const count = workedExample({
      id: "money",
      game: "money",
      title: "How much money?",
      hint: "Add the coins",
      praise: "Yes!",
      almost: "Almost!",
      answer: "6¢",
      choices: ["6¢", "5¢", "10¢", "1¢"],
      skill: "money:count",
      tags: ["coins"],
      visual: { kind: "money", mode: "count", coins: { penny: 1, nickel: 1, dime: 0, quarter: 0, dollar: 0 } },
    }).frames as MoneyFrame[];
    expect(count[0]).toMatchObject({ runningCents: 5, caption: "5¢ so far" });
    expect(count.at(-1)).toMatchObject({ runningCents: 6, caption: "6¢" });

    const nameQ: ChoiceQ = {
      id: "name",
      game: "money",
      title: "What coin is this?",
      hint: "Silver. It says 5.",
      praise: "Yes! That is a nickel.",
      almost: "Almost! That one is a nickel.",
      answer: "Nickel",
      choices: ["Penny", "Nickel", "Dime", "Quarter"],
      skill: "money:name",
      tags: ["coins"],
      visual: { kind: "money", mode: "name", coins: { penny: 0, nickel: 1, dime: 0, quarter: 0, dollar: 0 } },
    };
    const named = workedExample(nameQ);
    expect(named.frames[0]).toMatchObject({ kind: "money", caption: "A nickel is 5¢" });
    expect(hintCue(nameQ).caption).toContain("says 5");
    expect(greedyCoins(30)).toEqual(["quarter", "nickel"]);
  });

  it("gives every live question a hint and a worked example", () => {
    const rng = rngFromSeed("teach");
    const addLevels: AddLevel[] = ["within5", "within10", "within20", "tens", "within100"];
    const timesLevels: TimesLevel[] = ["count", "twos", "mix", "toTen"];
    const timeLevels: TimeLevel[] = ["hour", "half", "quarter", "fives"];
    const moneyLevels: MoneyLevel[] = ["name", "count", "make", "change", "dollars"];
    const questions = [
      ...addLevels.flatMap((level) => Array.from({ length: 6 }, () => makeAddQuestion(rng, level))),
      ...timesLevels.flatMap((level) => Array.from({ length: 4 }, () => makeTimesQuestion(rng, level))),
      ...timeLevels.flatMap((level) => Array.from({ length: 4 }, () => makeTimeQuestion(rng, level))),
      ...moneyLevels.flatMap((level) => Array.from({ length: 4 }, () => makeMoneyQuestion(rng, level))),
    ];
    expect(questions.length).toBeGreaterThan(40);
    for (const question of questions) {
      const example = workedExample(question);
      expect(example.frames.length).toBeGreaterThan(0);
      expect(example.frames[0]?.kind).toBe(question.visual.kind);
      expect(example.caption.length).toBeGreaterThan(0);
      expect(hintCue(question).caption.length).toBeGreaterThan(0);
      const line = promptSpeech(question);
      expect(line.length).toBeGreaterThan(8);
      if (question.choices.length > 0) {
        const labels = question.visual.kind === "money" ? question.visual.labels : undefined;
        const heard = question.choices.some((choice) => line.includes(speakable(labels?.[choice] ?? choice)));
        expect(heard).toBe(true);
      }
    }
  });

  it("speaks a fraction as words", () => {
    expect(speakable("1/2")).toBe("one half");
    expect(speakable("3/4")).toBe("three fourths");
    expect(speakable("2/8")).toBe("two eighths");
    expect(speakable("Shade 1/2 of it")).toBe("Shade one half of it");
  });

  it("speaks the question and every choice", () => {
    const line = promptSpeech(addQ());
    expect(line.toLowerCase()).toContain("missing number");
    expect(line).toContain("3");
    expect(line).toContain("5");
    expect(line).toContain("6");
  });
});
