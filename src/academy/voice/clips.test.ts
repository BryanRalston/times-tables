import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { GAMES } from "../games/registry";
import type { ChoiceQ } from "../games/types";
import { makeClockTask, makePayTask } from "../hands";
import { exampleFor } from "../round-flow";
import { yourTurnLine } from "../i18n";
import { hintCue, promptSpeech, speakable, workedExample } from "../teach";
import { voiceClipUrl, VOICE_FILES, VOICE_MODEL } from "./clips";
import { collectClipSpecs, collectSpokenLines, lineChunkErrors } from "./catalog";
import { idealPieces, planSpeech, speechChunkError } from "./plan";
import { numberWords, spokenText } from "./pronounce";

const lines = collectSpokenLines();
const specs = collectClipSpecs(lines);

describe("recorded voice", () => {
  it("turns math, clocks, and money into clip pieces", () => {
    expect(idealPieces("What is 7 plus 2?")?.map((piece) => piece.key)).toEqual(["what is", "7", "plus", "2"]);
    expect(idealPieces("3:00")?.map((piece) => piece.key)).toEqual(["3", "min:00"]);
    expect(idealPieces("It is half past 3.")?.map((piece) => piece.key)).toEqual(["it is half past", "3"]);
    expect(spokenText("7")).toBe("seven");
    expect(numberWords(42)).toBe("forty two");
    expect(spokenText("min:05")).toBe("oh five");
    expect(spokenText("what time is it")).toBe("what time is it?");
  });

  it("composes a line from words when the whole phrase clip is absent", () => {
    const has = (key: string) => ["what", "is", "7", "plus", "2"].includes(key);
    expect(planSpeech("What is 7 plus 2?", has)?.map((piece) => piece.key)).toEqual(["what", "is", "7", "plus", "2"]);
    expect(planSpeech("What is 7 plus 2?", (key) => key !== "plus" && has(key))).toBeNull();
  });

  it("builds clip URLs from the academy base", () => {
    expect(voiceClipUrl("core/seven.mp3", "/times-tables/academy/")).toBe("/times-tables/academy/voice/core/seven.mp3");
    expect(voiceClipUrl("core/seven.mp3", "/")).toBe("/voice/core/seven.mp3");
    expect(voiceClipUrl("lazy/cat.mp3", "/times-tables/academy")).toBe("/times-tables/academy/voice/lazy/cat.mp3");
  });

  it("names the voice model and its license", () => {
    expect(VOICE_MODEL.engine).toBe("Kokoro");
    expect(VOICE_MODEL.voice).toBe("af_heart");
    expect(VOICE_MODEL.license).toBe("Apache-2.0");
  });

  it("has a clip for every speakable line", () => {
    const errors = lineChunkErrors(lines);
    expect(errors.slice(0, 6)).toEqual([]);
    const missing: string[] = [];
    for (const spec of specs) {
      const file = VOICE_FILES[spec.key];
      if (!file) {
        missing.push(spec.key);
        continue;
      }
      const abs = resolve("academy/public/voice", file);
      if (!existsSync(abs) || statSync(abs).size < 200) missing.push(`${spec.key} -> ${file}`);
    }
    expect(missing.slice(0, 12)).toEqual([]);
    expect(missing).toHaveLength(0);

    const has = (key: string) => Object.prototype.hasOwnProperty.call(VOICE_FILES, key);
    const uncovered: string[] = [];
    const seen = new Set<string>();
    for (const row of lines) {
      if (seen.has(row.line)) continue;
      seen.add(row.line);
      const ideal = idealPieces(row.line);
      const plan = planSpeech(row.line, has);
      if (!ideal || !plan || plan.map((piece) => piece.key).join("|") !== ideal.map((piece) => piece.key).join("|")) {
        uncovered.push(row.line);
      }
    }
    expect(uncovered.slice(0, 8)).toEqual([]);
    expect(uncovered).toHaveLength(0);
  });

  it("can speak lines from games it did not sample, using the same clips", () => {
    const has = (key: string) => Object.prototype.hasOwnProperty.call(VOICE_FILES, key);
    const gaps: string[] = [];
    const seen = new Set<string>();

    function check(line: string) {
      if (seen.has(line)) return;
      seen.add(line);
      if (planSpeech(line, has)) return;
      const error = speechChunkError(line);
      gaps.push(error ? `${error} :: ${line}` : line);
    }

    function addChoice(question: ChoiceQ) {
      const prompt = promptSpeech(question);
      check(prompt);
      check(yourTurnLine(prompt));
      check(hintCue(question).speech);
      check(workedExample(question).speech);
      check(speakable(question.praise));
      check(speakable(question.almost));
    }

    for (const game of GAMES) {
      for (const level of game.levels) {
        for (let i = 0; i < 48; i += 1) {
          addChoice(game.makeQuestion(rngFromSeed(`voice-gap:${game.id}:${level.id}:${i}`), level.id, []));
        }
      }
    }
    for (const game of GAMES) {
      if (game.id !== "time" && game.id !== "money") continue;
      for (const level of game.levels) {
        for (let i = 0; i < 48; i += 1) {
          const task =
            game.id === "time"
              ? makeClockTask(level.id, rngFromSeed(`voice-gap:hands:${game.id}:${level.id}:${i}`))
              : makePayTask(level.id, rngFromSeed(`voice-gap:hands:${game.id}:${level.id}:${i}`));
          check(task.speech);
          check(yourTurnLine(task.speech));
          check(exampleFor(task).speech);
        }
      }
    }

    expect(gaps.slice(0, 8)).toEqual([]);
    expect(gaps).toHaveLength(0);
  });
});
