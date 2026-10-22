import { rngFromSeed } from "@/lib/rng";
import { bookEntries } from "../buddy/cast";
import { personaOf, STORY_STARS } from "../buddy/persona";
import { bossForGame } from "../bosses";
import { show, starLead, t, yourTurnLine } from "../i18n";
import { ALL_SIGHT } from "../games/sight-data";
import { blendOf, RHYME_FAMILIES, SOUND_BANK } from "../games/phonics";
import { ALL_SPELL } from "../games/spell-data";
import { GAMES } from "../games/registry";
import { blankOut } from "../games/words";
import { graphClipLines } from "../games/graph-data";
import { makeHandsTask } from "../hands-build";
import { makeClockTask, makePayTask } from "../hands";
import { exampleFor } from "../round-flow";
import { hintCue, promptSpeech, speakable, workedExample } from "../teach";
import type { ChoiceQ } from "../games/types";
import { traceLines } from "../trace/lines";
import { idealPieces, speechChunkError } from "./plan";
import { spokenText } from "./pronounce";

export interface SpokenLine {
  line: string;
  game: string;
}

export interface ClipSpec {
  key: string;
  say: string;
  core: boolean;
  games: readonly string[];
}

const SAMPLES = 32;
const HAND_SAMPLES = 16;
const NUMBER_MAX = 1000;

/** Games whose clips ship in the first offline cache. Sight words and the rest load with the game. */
export const CORE_VOICE_GAMES = new Set(["add", "time", "ui", "buddy", "boss"]);

const BUBBLES = ["The hint can help.", "Let's look together.", "Three stars!", "Your turn!"] as const;

function push(lines: SpokenLine[], line: string, game: string) {
  const text = line.trim();
  if (!text) return;
  lines.push({ line: text, game });
}

function addChoice(lines: SpokenLine[], question: ChoiceQ, game: string) {
  const prompt = promptSpeech(question);
  push(lines, prompt, game);
  push(lines, yourTurnLine(prompt), game);
  push(lines, hintCue(question).speech, game);
  push(lines, workedExample(question).speech, game);
  push(lines, speakable(question.praise), game);
  push(lines, speakable(question.almost), game);
}

function explicitLines(): SpokenLine[] {
  const lines: SpokenLine[] = [];
  for (const game of GAMES) {
    push(lines, show(game.title), "ui");
    const boss = bossForGame(game.id);
    push(lines, boss.taunt, "boss");
    push(lines, boss.friendly, "boss");
  }
  push(lines, show("Pick a buddy!"), "ui");
  push(lines, show("Yes!"), "ui");
  push(lines, show("Almost!"), "ui");
  for (const line of BUBBLES) push(lines, show(line), "buddy");
  for (const entry of bookEntries()) {
    const persona = personaOf(entry.id);
    push(lines, persona.line, "buddy");
    push(lines, persona.streak, "buddy");
    push(lines, persona.count, "buddy");
    push(lines, persona.work, "buddy");
    push(lines, entry.name, "buddy");
  }
  push(lines, personaOf("someone-new").line, "buddy");
  for (const star of STORY_STARS) {
    push(lines, starLead(star.name, star.trait), "problems");
    push(lines, star.pal, "problems");
    push(lines, star.name, "problems");
  }
  for (const word of ALL_SIGHT) {
    push(lines, word.word, "sight");
    push(lines, word.sentence, "sight");
    push(lines, blankOut(word.sentence, word.word).replaceAll("___", "blank"), "sight");
    push(lines, t(`Listen. ${word.word}.`, `Escucha. ${word.word}.`, `Ouça. ${word.word}.`), "sight");
    push(lines, t(`Yes! ${word.word}`, `¡Sí! ${word.word}`, `Sim! ${word.word}`), "sight");
    push(lines, t(`Almost! The word is ${word.word}.`, `¡Casi! La palabra es ${word.word}.`, `Quase! A palavra é ${word.word}.`), "sight");
  }
  for (const word of ALL_SPELL) {
    push(lines, word.word, "spelling");
    push(lines, word.sentence, "spelling");
    push(lines, `${word.word}. ${word.sentence}`, "spelling");
    push(lines, t(`Yes! ${word.word}`, `¡Sí! ${word.word}`, `Sim! ${word.word}`), "spelling");
    push(lines, t(`Almost! ${word.word}. ${word.sentence}`, `¡Casi! ${word.word}. ${word.sentence}`, `Quase! ${word.word}. ${word.sentence}`), "spelling");
  }
  for (const row of SOUND_BANK) {
    push(lines, row.phoneme, "phonics");
    push(lines, row.word, "phonics");
    push(lines, `${row.letter} ${row.phoneme}`, "phonics");
    push(lines, `${row.letter.toLowerCase()} ${row.phoneme}`, "phonics");
    push(lines, t(`${row.letter} says ${row.phoneme}, like ${row.word}`, `${row.letter} dice ${row.phoneme}, como ${row.word}`, `${row.letter} diz ${row.phoneme}, como ${row.word}`), "phonics");
  }
  for (const row of traceLines()) push(lines, t(row.en, row.es), row.game);
  for (const family of RHYME_FAMILIES) {
    for (const word of family.words) {
      push(lines, word, "phonics");
      push(lines, blendOf(word), "phonics");
    }
  }
  for (const line of graphClipLines()) push(lines, line, "graphs");
  return lines;
}

/** Every line the Academy can speak, plus praise, almost, titles, and buddy lines. */
export function collectSpokenLines(): SpokenLine[] {
  const lines = explicitLines();
  for (const game of GAMES) {
    for (const level of game.levels) {
      for (let i = 0; i < SAMPLES; i += 1) {
        const question = game.makeQuestion(rngFromSeed(`${game.id}:${level.id}:${i}`), level.id, []);
        addChoice(lines, question, game.id);
      }
    }
  }
  const time = GAMES.find((game) => game.id === "time");
  if (time) {
    for (const level of time.levels) {
      for (let i = 0; i < HAND_SAMPLES; i += 1) {
        const task = makeClockTask(level.id, rngFromSeed(`hands:time:${level.id}:${i}`));
        push(lines, task.speech, "time");
        push(lines, yourTurnLine(task.speech), "time");
        push(lines, exampleFor(task).speech, "time");
      }
    }
  }
  const money = GAMES.find((game) => game.id === "money");
  if (money) {
    for (const level of money.levels) {
      for (let i = 0; i < HAND_SAMPLES; i += 1) {
        const task = makePayTask(level.id, rngFromSeed(`hands:money:${level.id}:${i}`));
        push(lines, task.speech, "money");
        push(lines, yourTurnLine(task.speech), "money");
        push(lines, exampleFor(task).speech, "money");
      }
    }
  }
  const graphs = GAMES.find((game) => game.id === "graphs");
  if (graphs) {
    for (const level of graphs.levels) {
      for (let i = 0; i < HAND_SAMPLES; i += 1) {
        const task = makeHandsTask("graphs", level.id, rngFromSeed(`hands:graphs:${level.id}:${i}`));
        push(lines, task.speech, "graphs");
        push(lines, yourTurnLine(task.speech), "graphs");
        push(lines, exampleFor(task).speech, "graphs");
      }
    }
  }
  return lines;
}

export function lineChunkErrors(lines: readonly SpokenLine[]): { line: string; game: string; error: string }[] {
  const errors: { line: string; game: string; error: string }[] = [];
  for (const row of lines) {
    if (idealPieces(row.line)) continue;
    errors.push({ line: row.line, game: row.game, error: speechChunkError(row.line) ?? "no clips" });
  }
  return errors;
}

function touch(games: Map<string, Set<string>>, key: string, game: string) {
  const set = games.get(key);
  if (set) set.add(game);
  else games.set(key, new Set([game]));
}

function coreKey(key: string, games: ReadonlySet<string>): boolean {
  if (key.startsWith("min:")) return true;
  if (/^\d+$/.test(key) && Number(key) <= 100) return true;
  for (const game of games) {
    if (CORE_VOICE_GAMES.has(game)) return true;
  }
  return false;
}

/**
 * Spanish clips that install with the app. Same lines as English core voice,
 * plus Times Tables prompts and every number through 1,000 that Add and Times
 * can say. Other games stay on the runtime cache.
 */
export function isSpanishPrecacheKey(key: string, games: ReadonlySet<string>): boolean {
  if (coreKey(key, games)) return true;
  if (/^\d+$/.test(key) && Number(key) <= NUMBER_MAX) return true;
  return games.has("times");
}

/** Phrase clips for known lines, plus every word, number, and minute those lines compose from. */
export function collectClipSpecs(lines: readonly SpokenLine[] = collectSpokenLines()): ClipSpec[] {
  const games = new Map<string, Set<string>>();
  for (const row of lines) {
    const pieces = idealPieces(row.line);
    if (!pieces) continue;
    for (const piece of pieces) {
      touch(games, piece.key, row.game);
      if (piece.key.includes(" ")) {
        for (const word of piece.key.split(" ")) touch(games, word, row.game);
      }
    }
  }
  for (let n = 0; n <= NUMBER_MAX; n += 1) touch(games, String(n), n <= 100 ? "ui" : "place");
  touch(games, "thousand", "place");
  touch(games, "million", "place");
  for (let minutes = 0; minutes < 60; minutes += 1) {
    touch(games, `min:${String(minutes).padStart(2, "0")}`, "time");
  }
  const specs: ClipSpec[] = [];
  for (const [key, used] of games) {
    specs.push({ key, say: spokenText(key), core: coreKey(key, used), games: [...used].sort() });
  }
  specs.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return specs;
}
