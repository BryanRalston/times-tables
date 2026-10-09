import { COIN_CENTS, COIN_NAME, emptyPile, formatCents, pileCents } from "./games/money-model";
import { timeTalk } from "./games/time";
import type { AddVisual, ChoiceQ, CoinKind, CoinPile, MoneyVisual, TimeVisual, TimesVisual } from "./games/types";

export interface AddFrame {
  kind: "add";
  pink: number;
  teal: number;
  tealShown: number;
  crossed: number;
  op: "+" | "-";
  tenFilled: number | null;
  blocks: boolean;
  line: { from: number; to: number; max: number } | null;
  caption: string;
}

export interface TimesFrame {
  kind: "times";
  rows: number;
  cols: number;
  shownRows: number;
  caption: string;
}

export interface TimeFrame {
  kind: "time";
  hours: number;
  minutes: number;
  handMinutes: number;
  caption: string;
}

export interface MoneyFrame {
  kind: "money";
  coins: CoinKind[];
  runningCents: number;
  caption: string;
}

export interface WordFrame {
  kind: "sight" | "spell";
  show: string;
  caption: string;
}

export interface SceneFrame {
  kind: "scene";
  show: string;
  caption: string;
}

export type TeachFrame = AddFrame | TimesFrame | TimeFrame | MoneyFrame | WordFrame | SceneFrame;

export interface WorkedExample {
  speech: string;
  caption: string;
  frames: TeachFrame[];
}

const COIN_ORDER: CoinKind[] = ["dollar", "quarter", "dime", "nickel", "penny"];

const NUMBER_WORD = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

const FRACTION_WORD: Record<string, [string, string]> = {
  "2": ["half", "halves"],
  "3": ["third", "thirds"],
  "4": ["fourth", "fourths"],
  "6": ["sixth", "sixths"],
  "8": ["eighth", "eighths"],
};

/** "1/2" is spoken as "one half", so a voice does not say "slash". */
function speakFractions(text: string): string {
  return text.replace(/\b(\d+)\/(\d+)\b/g, (full, numText: string, denText: string) => {
    const pair = FRACTION_WORD[denText];
    if (!pair) return full;
    const num = Number(numText);
    const numWord = NUMBER_WORD[num] ?? numText;
    return `${numWord} ${num === 1 ? pair[0] : pair[1]}`;
  });
}

export function speakable(text: string): string {
  return speakFractions(text)
    .replace(/×/g, " times ")
    .replace(/−/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/=/g, " equals ")
    .replace(/¢/g, " cents")
    .replace(/\$(\d+)/g, "$1 dollars");
}

export function hintCue(question: ChoiceQ): { speech: string; caption: string } {
  const caption = question.hint.trim() || "Look at the picture.";
  return { speech: speakable(caption), caption };
}

export function choiceSpoken(question: ChoiceQ, choice: string): string {
  if (question.visual.kind === "money" && question.visual.labels?.[choice]) return question.visual.labels[choice];
  if (question.visual.kind === "scene") {
    if (question.visual.quietChoices) return "";
    return question.visual.labels[choice] ?? choice;
  }
  return choice;
}

/** Title plus each choice, so a child who cannot read can still pick by ear. */
export function promptSpeech(question: ChoiceQ): string {
  const title = speakable(question.title).trim();
  const lead = /[.!?]$/.test(title) ? title : `${title}.`;
  if (question.choices.length === 0) return lead;
  const heard = question.choices
    .map((choice) => speakable(choiceSpoken(question, choice)).trim())
    .filter((line) => line.length > 0);
  if (heard.length === 0) return lead;
  return `${lead} ${heard.join(". ")}`;
}

export function workedExample(question: ChoiceQ): WorkedExample {
  const frames = framesFor(question);
  const caption = frames[frames.length - 1]?.caption ?? question.almost;
  return { speech: speakable(caption), caption, frames };
}

function framesFor(question: ChoiceQ): TeachFrame[] {
  const visual = question.visual;
  switch (visual.kind) {
    case "add":
      return addFrames(visual);
    case "times":
      return timesFrames(visual);
    case "time":
      return timeFrames(visual);
    case "money":
      return moneyFrames(visual, question.answer);
    case "sight":
      return [
        {
          kind: "sight",
          show: visual.word,
          caption: visual.mode === "hear" ? `The word is ${visual.word}.` : visual.sentence || visual.word,
        },
      ];
    case "spell":
      return [
        {
          kind: "spell",
          show: visual.word,
          caption: visual.sentence ? `${visual.word}. ${visual.sentence}` : visual.word,
        },
      ];
    case "scene":
      return [
        {
          kind: "scene",
          show: visual.picture,
          caption: question.almost.replace(/^Almost!\s*/, ""),
        },
      ];
    default: {
      const neverVisual: never = visual;
      return neverVisual;
    }
  }
}

function lineMax(total: number): number {
  if (total <= 10) return 10;
  if (total <= 20) return 20;
  return Math.min(100, Math.max(10, Math.ceil(Math.max(total, 1) / 10) * 10));
}

function addFrames(visual: AddVisual): AddFrame[] {
  const total = visual.pink + visual.teal;
  const max = lineMax(Math.max(total, visual.max <= 20 ? visual.max : total));
  const ten = total <= 10;
  const blocks = total > 20;
  const line = total <= 100;
  if (visual.op === "+") {
    const frames: AddFrame[] = [
      addFrame(visual, 0, 0, ten ? visual.pink : null, blocks, line ? { from: visual.pink, to: visual.pink, max } : null, `Start with ${visual.pink}`),
    ];
    if (visual.teal > 1 && visual.teal <= 4) {
      frames.push(
        addFrame(
          visual,
          1,
          0,
          ten ? visual.pink + 1 : null,
          blocks,
          line ? { from: visual.pink, to: visual.pink + 1, max } : null,
          "Add 1",
        ),
      );
    }
    frames.push(
      addFrame(
        visual,
        visual.teal,
        0,
        ten ? total : null,
        blocks,
        line ? { from: visual.pink, to: total, max } : null,
        visual.solved,
      ),
    );
    return frames;
  }
  const frames: AddFrame[] = [
    addFrame(visual, visual.teal, 0, ten ? total : null, blocks, line ? { from: total, to: total, max } : null, `Start with ${total}`),
  ];
  if (visual.teal > 1 && visual.teal <= 4) {
    frames.push(
      addFrame(
        visual,
        visual.teal,
        1,
        ten ? total - 1 : null,
        blocks,
        line ? { from: total, to: total - 1, max } : null,
        "Take away 1",
      ),
    );
  }
  frames.push(
    addFrame(
      visual,
      visual.teal,
      visual.teal,
      ten ? visual.pink : null,
      blocks,
      line ? { from: total, to: visual.pink, max } : null,
      visual.solved,
    ),
  );
  return frames;
}

function addFrame(
  visual: AddVisual,
  tealShown: number,
  crossed: number,
  tenFilled: number | null,
  blocks: boolean,
  line: { from: number; to: number; max: number } | null,
  caption: string,
): AddFrame {
  return {
    kind: "add",
    pink: visual.pink,
    teal: visual.teal,
    tealShown,
    crossed,
    op: visual.op,
    tenFilled,
    blocks,
    line,
    caption,
  };
}

function timesFrames(visual: TimesVisual): TimesFrame[] {
  const rows = Math.max(1, visual.a);
  const steps = Math.min(rows, 4);
  const frames: TimesFrame[] = [];
  for (let i = 1; i <= steps; i++) {
    const shown = i === steps ? rows : i;
    frames.push({
      kind: "times",
      rows,
      cols: visual.b,
      shownRows: shown,
      caption: shown === rows ? visual.solved : `${shown} ${shown === 1 ? "group" : "groups"} of ${visual.b}`,
    });
  }
  return frames;
}

function timeFrames(visual: TimeVisual): TimeFrame[] {
  const phrase = timeTalk(visual.hours, visual.minutes);
  if (visual.minutes === 0) {
    return [
      { kind: "time", hours: visual.hours, minutes: 0, handMinutes: 0, caption: "The long hand is on 12" },
      { kind: "time", hours: visual.hours, minutes: 0, handMinutes: 0, caption: phrase },
    ];
  }
  const mid = Math.round(visual.minutes / 2);
  return [
    { kind: "time", hours: visual.hours, minutes: visual.minutes, handMinutes: 0, caption: "The long hand starts at 12" },
    { kind: "time", hours: visual.hours, minutes: visual.minutes, handMinutes: mid, caption: "The long hand moves" },
    { kind: "time", hours: visual.hours, minutes: visual.minutes, handMinutes: visual.minutes, caption: phrase },
  ];
}

export function greedyCoins(cents: number): CoinKind[] {
  const out: CoinKind[] = [];
  let left = Math.max(0, Math.floor(cents));
  for (const kind of COIN_ORDER) {
    const value = COIN_CENTS[kind];
    while (left >= value) {
      out.push(kind);
      left -= value;
    }
  }
  return out;
}

function coinsOf(pile: CoinPile): CoinKind[] {
  const out: CoinKind[] = [];
  for (const kind of COIN_ORDER) {
    for (let i = 0; i < pile[kind]; i++) out.push(kind);
  }
  return out;
}

function runningFrames(coins: CoinKind[], finalCaption: string): MoneyFrame[] {
  if (coins.length === 0) return [{ kind: "money", coins: [], runningCents: 0, caption: finalCaption }];
  const frames: MoneyFrame[] = [];
  const shown: CoinKind[] = [];
  let running = 0;
  const step = coins.length > 4 ? Math.ceil(coins.length / 3) : 1;
  for (let i = 0; i < coins.length; i++) {
    const kind = coins[i]!;
    shown.push(kind);
    running += COIN_CENTS[kind];
    if ((i + 1) % step === 0 || i === coins.length - 1) {
      frames.push({
        kind: "money",
        coins: [...shown],
        runningCents: running,
        caption: i === coins.length - 1 ? finalCaption : `${formatCents(running)} so far`,
      });
    }
  }
  return frames;
}

function moneyFrames(visual: MoneyVisual, answer: string): MoneyFrame[] {
  switch (visual.mode) {
    case "name": {
      const coins = coinsOf(visual.coins);
      const kind = coins[0] ?? "penny";
      const cents = COIN_CENTS[kind];
      return [
        {
          kind: "money",
          coins: [kind],
          runningCents: cents,
          caption: `A ${COIN_NAME[kind].toLowerCase()} is ${formatCents(cents)}`,
        },
      ];
    }
    case "make": {
      const pile = visual.piles?.[answer] ?? emptyPile();
      const total = visual.priceCents ?? pileCents(pile);
      return runningFrames(coinsOf(pile), `${formatCents(total)}`);
    }
    case "change": {
      const paid = pileCents(visual.coins);
      const price = visual.priceCents ?? 0;
      const change = Math.max(0, paid - price);
      return [
        { kind: "money", coins: coinsOf(visual.coins), runningCents: paid, caption: `You pay ${formatCents(paid)}` },
        { kind: "money", coins: [], runningCents: price, caption: `The price is ${formatCents(price)}` },
        { kind: "money", coins: greedyCoins(change), runningCents: change, caption: `Change is ${formatCents(change)}` },
      ];
    }
    case "count":
    case "dollars":
      return runningFrames(coinsOf(visual.coins), formatCents(pileCents(visual.coins)));
    default: {
      const neverMode: never = visual.mode;
      return neverMode;
    }
  }
}
