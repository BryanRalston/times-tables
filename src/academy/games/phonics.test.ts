import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { PHONICS_LEVELS, RHYME_FAMILIES, SOUND_BANK, blendOf, makePhonicsQuestion, phonicsGame } from "./phonics";
import type { ChoiceQ } from "./types";

function expectChoices(q: ChoiceQ) {
  expect(q.choices).toHaveLength(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
  for (const choice of q.choices) expect(choice.startsWith("no ")).toBe(false);
}

function bankWord(word: string) {
  return SOUND_BANK.find((row) => row.word === word);
}

describe("phonics questions", () => {
  it("matches letter sounds, rhymes, and CVC blends", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const level of PHONICS_LEVELS) {
        const q = makePhonicsQuestion(rngFromSeed(`phonics-${seed}-${level}`), level);
        expectChoices(q);
        if (q.visual.kind !== "scene" || q.visual.board.game !== "phonics") throw new Error(level);
        const board = q.visual.board;
        switch (board.mode) {
          case "sounds":
          case "begin": {
            expect(q.visual.hands).toBe(true);
            const answer = bankWord(q.answer);
            expect(answer?.letter).toBe(board.letter);
            expect(answer?.phoneme).toBe(board.phoneme);
            expect(q.visual.pictures?.[q.answer]).toBe(answer?.emoji);
            expect(q.visual.labels[q.answer]).toBe("");
            const phonemes = q.choices.map((choice) => bankWord(choice)?.phoneme);
            expect(new Set(phonemes).size).toBe(4);
            if (board.mode === "begin") expect(q.title).toContain(board.phoneme);
            break;
          }
          case "rhyme":
            expect(q.answer).not.toBe(board.cue);
            expect(q.answer.endsWith(board.family)).toBe(true);
            expect(board.cue.endsWith(board.family)).toBe(true);
            for (const choice of q.choices) {
              if (choice === q.answer) continue;
              expect(choice.endsWith(board.family)).toBe(false);
            }
            break;
          case "cvc":
            expect(board.word).toBe(q.answer);
            expect(board.letters).toBe(q.answer.toUpperCase().split("").join(" "));
            expect(board.blend).toBe(blendOf(q.answer));
            expect(q.answer).toMatch(/^[a-z]{3}$/);
            break;
          case "end":
            expect(q.answer).toBe(board.word[2]);
            expect(board.phoneme.length).toBeGreaterThan(0);
            expect(q.visual.labels[q.answer]).toContain(board.phoneme);
            break;
          default: {
            const neverBoard: never = board;
            throw new Error(String(neverBoard));
          }
        }
      }
    }
    expect(RHYME_FAMILIES.length).toBeGreaterThanOrEqual(8);
  });

  it("prints phonics worksheet answers a reader can check", () => {
    for (let seed = 0; seed < 8; seed += 1) {
      for (const level of phonicsGame.levels) {
        const row = phonicsGame.makeSheetItem(rngFromSeed(`phonics-sheet-${seed}-${level.id}`), level.id);
        const starts = row.prompt.match(/^Which word starts with the (\S+) sound: (.+)\?$/);
        if (starts) {
          const words = starts[2]!.split(", ");
          expect(words).toContain(row.answer);
          expect(bankWord(row.answer)?.phoneme).toBe(starts[1]);
          continue;
        }
        const rhyme = row.prompt.match(/^Which word rhymes with ([a-z]+): (.+)\?$/);
        if (rhyme) {
          expect(rhyme[2]!.split(", ")).toContain(row.answer);
          expect(row.answer.slice(-2)).toBe(rhyme[1]!.slice(-2));
          expect(row.answer).not.toBe(rhyme[1]);
          continue;
        }
        const blend = row.prompt.match(/^Blend ([a-z])-([a-z])-([a-z])\.$/);
        if (blend) {
          expect(row.answer).toBe(`${blend[1]}${blend[2]}${blend[3]}`);
          continue;
        }
        const end = row.prompt.match(/^What letter sound ends ([a-z]+)\?$/);
        expect(end).not.toBeNull();
        expect(row.answer).toBe(end?.[1]?.[2]);
      }
    }
  });
});
