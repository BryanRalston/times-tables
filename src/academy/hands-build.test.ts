import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { GAMES } from "./games/registry";
import { TIMES_SPEC, type TimesLevel } from "./games/times";
import { FRACTION_DENOMINATORS } from "./grade-map";
import {
  arrayMatches,
  blocksMatches,
  countMatches,
  frameMatches,
  handsExample,
  lettersMatch,
  makeBuildTask,
  makeHandsTask,
  measureMatches,
  phonicsMatches,
  shadeMatches,
  shapeMatches,
  sightMatches,
  storyMatches,
  type ArrayTask,
  type BlocksTask,
  type BuildTask,
  type CountTask,
  type FrameTask,
  type HandsTask,
  type LetterTask,
  type MeasureTask,
  type PhonicsTask,
  type ShadeTask,
  type ShapeTask,
  type SightTask,
  type StoryTask,
} from "./hands-build";
import { exampleFor, similarSlot } from "./round-flow";

const SAMPLES = 24;

function canSpell(word: string, labels: readonly string[]): boolean {
  const pool = labels.map((label) => label.toLowerCase());
  for (const letter of word.toLowerCase()) {
    const at = pool.indexOf(letter);
    if (at < 0) return false;
    pool.splice(at, 1);
  }
  return true;
}

function builtOf(task: BuildTask): boolean {
  switch (task.kind) {
    case "array":
      return arrayMatches(task, Array.from({ length: task.rows }, () => task.cols));
    case "frame":
      return frameMatches(task, task.change);
    case "count":
      return countMatches(task, task.mode === "teen" ? task.target - 10 : task.target);
    case "blocks":
      return blocksMatches(task, { hundreds: task.hundreds, tens: task.tens, ones: task.ones });
    case "shade":
      return shadeMatches(
        task,
        Array.from({ length: task.den }, (_, index) => index < task.num),
      );
    case "letters":
      return lettersMatch(task, task.word.split(""));
    case "sight":
      return sightMatches(task, task.word);
    case "phonics":
      return phonicsMatches(task, task.mode === "blend" ? task.answer.split("") : [task.answer]);
    case "measure":
      return measureMatches(task, task.target);
    case "shapes":
      return shapeMatches(task, task.answer);
    case "story":
      return storyMatches(task, rightStory(task));
    default: {
      const neverTask: never = task;
      return neverTask;
    }
  }
}

function wrongOf(task: BuildTask): boolean {
  switch (task.kind) {
    case "array":
      return arrayMatches(task, Array.from({ length: task.rows }, () => task.decoy));
    case "frame":
      return frameMatches(task, task.change + 1);
    case "count":
      return countMatches(task, task.mode === "teen" ? task.target : task.target + 1);
    case "blocks":
      return blocksMatches(task, { hundreds: task.hundreds, tens: task.tens, ones: task.ones + 1 });
    case "shade":
      return shadeMatches(
        task,
        Array.from({ length: task.den }, () => false),
      );
    case "letters":
      return lettersMatch(task, [...task.word.split(""), "x"]);
    case "sight":
      return sightMatches(task, null);
    case "phonics":
      return phonicsMatches(task, []);
    case "measure":
      return measureMatches(task, task.target === 1 ? 2 : task.target - 1);
    case "shapes":
      return shapeMatches(task, null);
    case "story":
      return storyMatches(task, { groups: [task.a + 9], away: 0, bins: [[1]] });
    default: {
      const neverTask: never = task;
      return neverTask;
    }
  }
}

function rightStory(task: StoryTask) {
  switch (task.mode) {
    case "join":
      return { groups: [task.a, task.b], away: 0, bins: [] as number[][] };
    case "take":
      return { groups: [], away: task.b, bins: [] as number[][] };
    case "groups":
      return { groups: Array.from({ length: task.a }, () => task.b), away: 0, bins: [] as number[][] };
    case "share":
      return {
        groups: [],
        away: 0,
        bins: Array.from({ length: task.b }, () => Array.from({ length: task.a / task.b }, () => 1)),
      };
    default: {
      const neverMode: never = task.mode;
      return neverMode;
    }
  }
}

function assertBounds(task: HandsTask, level: string): void {
  expect(task.speech.length).toBeGreaterThan(0);
  expect(task.factKey.length).toBeGreaterThan(0);
  expect(task.speech).not.toMatch(/[×÷¢]/);
  switch (task.kind) {
    case "clock":
    case "pay":
      break;
    case "array":
      assertArray(task, level);
      break;
    case "frame":
      assertFrame(task, level);
      break;
    case "count":
      assertCount(task, level);
      break;
    case "blocks":
      assertBlocks(task, level);
      break;
    case "shade":
      assertShade(task, level);
      break;
    case "letters":
      assertLetters(task, level);
      break;
    case "sight":
      assertSight(task, level);
      break;
    case "phonics":
      assertPhonics(task, level);
      break;
    case "measure":
      assertMeasure(task, level);
      break;
    case "shapes":
      assertShapes(task);
      break;
    case "story":
      assertStory(task, level);
      break;
    default: {
      const neverTask: never = task;
      throw new Error(String(neverTask));
    }
  }
}

function assertArray(task: ArrayTask, level: string): void {
  const spec = TIMES_SPEC[level as TimesLevel];
  expect(spec.factors.includes(task.rows) || spec.factors.includes(task.cols)).toBe(true);
  expect(task.rows).toBeGreaterThanOrEqual(1);
  expect(task.cols).toBeGreaterThanOrEqual(1);
  expect(task.decoy).not.toBe(task.cols);
  expect(task.rows * task.cols).toBeLessThanOrEqual(level === "count" ? 20 : 100);
  if (level !== "toTen") {
    expect([6, 7, 8, 9]).not.toContain(task.rows);
    expect([6, 7, 8, 9]).not.toContain(task.cols);
  }
}

function assertFrame(task: FrameTask, level: string): void {
  const max = level === "within5" ? 5 : level === "within10" ? 10 : level === "within20" ? 20 : 99;
  expect(task.change).toBeGreaterThanOrEqual(1);
  expect(task.target).toBe(task.op === "+" ? task.start + task.change : task.start - task.change);
  expect(task.target).toBeGreaterThanOrEqual(0);
  expect(task.target).toBeLessThanOrEqual(max);
  expect(task.start).toBeLessThanOrEqual(max);
  if (level === "tens" || level === "within100") {
    expect(task.model).toBe("blocks");
    expect(task.start).toBeGreaterThanOrEqual(10);
    expect(task.start).toBeLessThanOrEqual(99);
    if (task.change % 10 === 0) expect(task.target % 10).toBe(task.start % 10);
    else if (task.op === "+") expect(task.start % 10 + task.change).toBeLessThanOrEqual(9);
    else expect(task.start % 10).toBeGreaterThanOrEqual(task.change);
  } else {
    expect(task.model).toBe("ten");
    expect(task.cells === 10 || task.cells === 20).toBe(true);
  }
}

function assertCount(task: CountTask, level: string): void {
  if (level === "tenframe" || level === "build") {
    expect(task.mode).toBe("ten");
    expect(task.target).toBeGreaterThanOrEqual(1);
    expect(task.target).toBeLessThanOrEqual(level === "build" ? 10 : 20);
  } else if (level === "to20") {
    expect(task.mode).toBe("teen");
    expect(task.target).toBeGreaterThanOrEqual(11);
    expect(task.target).toBeLessThanOrEqual(20);
  } else {
    expect(task.mode).toBe("pile");
    expect(task.target).toBeGreaterThanOrEqual(1);
    expect(task.target).toBeLessThanOrEqual(level === "subitize" ? 6 : 10);
  }
}

function assertBlocks(task: BlocksTask, level: string): void {
  if (level === "round100") {
    expect(task.hundreds).toBeGreaterThanOrEqual(1);
    expect(task.hundreds).toBeLessThanOrEqual(9);
    expect(task.tens).toBe(0);
    expect(task.ones).toBe(0);
    return;
  }
  expect(task.hundreds).toBe(0);
  expect(task.tens).toBeGreaterThanOrEqual(1);
  expect(task.tens).toBeLessThanOrEqual(9);
  expect(task.ones).toBeGreaterThanOrEqual(0);
  expect(task.ones).toBeLessThanOrEqual(9);
  if (level === "round10") expect(task.ones).toBe(0);
}

function assertShade(task: ShadeTask, level: string): void {
  expect(FRACTION_DENOMINATORS).toContain(task.den);
  expect(task.num).toBeGreaterThanOrEqual(1);
  expect(task.num).toBeLessThanOrEqual(task.den);
  if (level === "parts") expect([2, 4]).toContain(task.den);
  if (level === "unit" || level === "line" || level === "compare") expect([2, 3, 4]).toContain(task.den);
  if (level === "unit") expect(task.num).toBe(1);
  expect(task.speech).not.toContain("/");
}

function assertLetters(task: LetterTask, level: string): void {
  expect(task.word.length).toBeGreaterThanOrEqual(3);
  expect(task.word.length).toBeLessThanOrEqual(6);
  expect(canSpell(task.word, task.tiles.map((tile) => tile.label))).toBe(true);
  expect(task.showSentence).toBe(level === "patterns");
  if (task.showSentence) expect(task.sentence).toContain("___");
}

function assertSight(task: SightTask, level: string): void {
  expect(task.choices).toContain(task.word);
  expect(new Set(task.choices).size).toBe(task.choices.length);
  expect(task.choices.length).toBeGreaterThanOrEqual(2);
  const sentence = level === "second" || level === "third";
  expect(task.mode).toBe(sentence ? "sentence" : "picture");
  if (sentence) expect(task.sentence).toContain("___");
  else expect(task.emoji.length).toBeGreaterThan(0);
}

function assertPhonics(task: PhonicsTask, level: string): void {
  if (level === "sounds" || level === "begin") {
    expect(task.mode).toBe("letter");
    const word = task.factKey.split(":")[1] ?? "";
    expect(word.length).toBeGreaterThan(2);
    expect(task.speech.toLowerCase().includes(word.toLowerCase())).toBe(false);
    expect(task.tiles.some((tile) => tile.label.toLowerCase() === task.answer.toLowerCase())).toBe(true);
    return;
  }
  if (level === "rhyme") {
    expect(task.mode).toBe("rhyme");
    expect(task.answer).not.toBe(task.prompt);
    expect(task.answer.slice(-2)).toBe(task.prompt.slice(-2));
    expect(task.tiles.some((tile) => tile.label === task.answer)).toBe(true);
    return;
  }
  if (level === "cvc") {
    expect(task.mode).toBe("blend");
    expect(task.answer).toMatch(/^[a-z]{3}$/);
    expect(canSpell(task.answer, task.tiles.map((tile) => tile.label))).toBe(true);
    return;
  }
  expect(task.mode).toBe("end");
  expect(task.answer).toMatch(/^[a-z]$/);
  expect(task.tiles.some((tile) => tile.label === task.answer)).toBe(true);
  expect(`${task.prompt}${task.answer}`).toMatch(/^[a-z]{3}$/);
}

function assertMeasure(task: MeasureTask, level: string): void {
  expect(task.target).toBeGreaterThanOrEqual(1);
  if (level === "compare") {
    expect(task.mode).toBe("compare");
    expect(task.bars).toHaveLength(2);
    expect(new Set(task.bars).size).toBe(2);
    expect(task.bars).toContain(task.target);
    expect(task.target).toBe(task.ask === "longest" ? Math.max(...task.bars) : Math.min(...task.bars));
    return;
  }
  if (level === "ruler") {
    expect(task.mode).toBe("ruler");
    expect(task.target).toBeLessThanOrEqual(6);
    expect(task.speech).not.toMatch(/\d/);
    return;
  }
  if (level === "picture" || level === "bar") {
    expect(task.mode).toBe("graph");
    expect(task.target).toBeLessThanOrEqual(6);
    return;
  }
  expect(task.mode).toBe("more");
  expect(task.bars).toHaveLength(2);
  expect(task.target).toBe((task.bars[0] ?? 0) - (task.bars[1] ?? 0));
}

function assertShapes(task: ShapeTask): void {
  expect(task.options).toContain(task.answer);
  expect(new Set(task.options).size).toBe(task.options.length);
  expect(task.options.length).toBeGreaterThanOrEqual(2);
  if (task.mode === "parts") expect(["halves", "thirds", "fourths"]).toContain(task.answer);
}

function assertStory(task: StoryTask, level: string): void {
  if (level === "sub") {
    expect(task.mode).toBe("take");
    expect(task.b).toBeGreaterThanOrEqual(1);
    expect(task.b).toBeLessThanOrEqual(task.a);
    return;
  }
  if (level === "div") {
    expect(task.mode).toBe("share");
    expect([2, 3]).toContain(task.b);
    expect(task.a % task.b).toBe(0);
    expect(task.a / task.b).toBeGreaterThanOrEqual(1);
    expect(task.a / task.b).toBeLessThanOrEqual(4);
    return;
  }
  if (level === "mult" || level === "picture") {
    expect(task.mode).toBe("groups");
    expect(task.a).toBeGreaterThanOrEqual(1);
    expect(task.a).toBeLessThanOrEqual(4);
    expect(task.b).toBeGreaterThanOrEqual(1);
    expect(task.b).toBeLessThanOrEqual(4);
    expect(task.decoy).not.toBe(task.b);
    return;
  }
  expect(task.mode).toBe("join");
  expect(task.a + task.b).toBeLessThanOrEqual(10);
  expect(task.pieces.map((piece) => piece.size).sort((a, b) => a - b)).toEqual(
    [task.a, task.b, task.decoy].sort((a, b) => a - b),
  );
  expect(task.decoy).not.toBe(task.a);
  expect(task.decoy).not.toBe(task.b);
}

describe("hands-on card generators", () => {
  it("builds a checked model for every game level and shows it again on a miss", () => {
    for (const game of GAMES) {
      for (const level of game.levels) {
        for (let i = 0; i < SAMPLES; i++) {
          const rng = rngFromSeed(`${game.id}-${level.id}-${i}`);
          const task = makeHandsTask(game.id, level.id, rng);
          expect(task.skill).toBe(`${game.id}:${level.id}`);
          assertBounds(task, level.id);
          if (task.kind === "clock" || task.kind === "pay") {
            const shown = exampleFor(task);
            expect(shown.frames.length).toBeGreaterThan(0);
            expect(shown.speech.length).toBeGreaterThan(0);
            continue;
          }
          expect(builtOf(task)).toBe(true);
          expect(wrongOf(task)).toBe(false);
          const shown = handsExample(task);
          expect(shown.frames.length).toBeGreaterThan(0);
          expect(shown.frames.every((frame) => frame.caption.length > 0)).toBe(true);
          expect(shown.speech.length).toBeGreaterThan(0);
          const again = makeBuildTask(game.id, level.id, rng, task.factKey);
          expect(again.factKey).not.toBe(task.factKey);
          expect(again.skill).toBe(task.skill);
        }
      }
    }
  });

  it("retries a hands-on card at the same level with a new build", () => {
    for (const game of GAMES) {
      if (game.id === "time" || game.id === "money") continue;
      const level = game.levels[0]!.id;
      const task = makeBuildTask(game.id, level, rngFromSeed(`${game.id}-retry`));
      const next = similarSlot(game.id, task, rngFromSeed(`${game.id}-retry-next`));
      expect(next.kind).toBe(task.kind);
      if (next.kind !== "choice") expect(next.skill).toBe(`${game.id}:${level}`);
    }
  });

  it("has no hands-on builder for an unknown game", () => {
    expect(() => makeBuildTask("time", "hour", rngFromSeed("nope"))).toThrow(/No hands-on card/);
  });
});
