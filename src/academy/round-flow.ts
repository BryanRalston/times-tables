import type { Rng } from "@/lib/rng";
import { makeQuestion } from "./questions";
import type { ChoiceQ } from "./games/types";
import { t, weekdayLetter, weekdayName } from "./i18n";
import { weekDates } from "./model";
import { promptSpeech, workedExample, type WorkedExample } from "./teach";
import { handsExample, makeBuildTask, type BuildTask } from "./hands-build";
import { clockQuestion, makeClockTask, makePayTask, payQuestion, type ClockTask, type PayTask } from "./hands";

export type { ClockTask, PayTask };

export type RoundSlot = { kind: "choice"; question: ChoiceQ } | ClockTask | PayTask | BuildTask;

export interface MissPlan {
  /** Scored index → fact that must be asked again before the round ends. */
  returns: Record<number, string>;
  replay: boolean;
}

export function choiceFact(question: ChoiceQ): string {
  if (question.factKey) return question.factKey;
  const visual = question.visual;
  switch (visual.kind) {
    case "add":
      return visual.solved;
    case "time":
      return `${visual.hours}:${visual.minutes}`;
    case "money":
      return `${visual.mode}:${question.answer}`;
    case "times":
      return `${visual.a}×${visual.b}`;
    case "sight":
    case "spell":
      return visual.word;
    case "scene":
      return question.factKey ?? `${question.skill}:${question.answer}`;
    default: {
      const neverVisual: never = visual;
      return neverVisual;
    }
  }
}

export function slotFact(slot: RoundSlot): string {
  if (slot.kind === "choice") return choiceFact(slot.question);
  return slot.factKey;
}

export function speechFor(slot: RoundSlot): string {
  if (slot.kind === "choice") return promptSpeech(slot.question);
  return slot.speech;
}

export function exampleFor(slot: RoundSlot): WorkedExample {
  switch (slot.kind) {
    case "choice":
      return workedExample(slot.question);
    case "clock":
      return workedExample(clockQuestion(slot));
    case "pay":
      return workedExample(payQuestion(slot));
    default:
      return handsExample(slot);
  }
}

/**
 * Hands-on cards spread through a 10-card round. Three is the floor for a
 * full round; a shorter round still gets as many as it has cards.
 */
export function handsOnSlots(roundLength: number, minimum = 3): number[] {
  if (roundLength <= 0) return [];
  const want = Math.min(roundLength, Math.max(1, minimum));
  const slots: number[] = [];
  for (let i = 1; i <= want; i++) {
    const at = Math.round((i * (roundLength + 1)) / (want + 1)) - 1;
    const clamped = Math.max(0, Math.min(roundLength - 1, at));
    if (!slots.includes(clamped)) slots.push(clamped);
  }
  let cursor = 0;
  while (slots.length < want && cursor < roundLength) {
    if (!slots.includes(cursor)) slots.push(cursor);
    cursor += 1;
  }
  return slots.sort((a, b) => a - b);
}

/**
 * Put a missed fact on a later card, always before `roundLength` (card 10
 * when the round has 10). Hands-on slots stay hands-on unless every later
 * card is already taken. The last card replays itself.
 */
export function planReturn(
  asked: number,
  roundLength: number,
  taken: readonly number[],
  keep: readonly number[] = [],
): number {
  const last = Math.max(0, roundLength - 1);
  const askedSafe = Math.max(0, Math.min(last, Math.floor(asked)));
  const blocked = new Set(taken);
  const spare = new Set(keep);
  const later: number[] = [];
  for (let at = askedSafe + 1; at <= last; at++) {
    if (!blocked.has(at)) later.push(at);
  }
  const spaced = later.find((at) => at >= askedSafe + 2 && !spare.has(at));
  if (spaced !== undefined) return spaced;
  const open = later.find((at) => !spare.has(at));
  if (open !== undefined) return open;
  const soon = later.find((at) => at >= Math.min(last, askedSafe + 2));
  if (soon !== undefined) return soon;
  if (later[0] !== undefined) return later[0];
  return askedSafe;
}

export function scheduleMiss(
  asked: number,
  fact: string,
  roundLength: number,
  plan: MissPlan,
  keep: readonly number[] = [],
): MissPlan {
  const taken = Object.keys(plan.returns).map((key) => Number(key));
  const at = planReturn(asked, roundLength, taken, keep);
  if (at === asked) return { returns: plan.returns, replay: true };
  return { returns: { ...plan.returns, [at]: fact }, replay: plan.replay };
}

export function similarChoice(game: string, question: ChoiceQ, rng: Rng): ChoiceQ {
  const level = question.skill.startsWith(`${question.game}:`)
    ? question.skill.slice(question.game.length + 1)
    : question.skill;
  const fact = choiceFact(question);
  let next = makeQuestion(game, level, rng);
  for (let i = 0; i < 8; i++) {
    if (choiceFact(next) !== fact) return next;
    next = makeQuestion(game, level, rng);
  }
  return next;
}

export function similarSlot(game: string, slot: RoundSlot, rng: Rng): RoundSlot {
  switch (slot.kind) {
    case "clock": {
      const level = slot.skill.startsWith("time:") ? slot.skill.slice(5) : "hour";
      return makeClockTask(level, rng, slot.factKey);
    }
    case "pay": {
      const level = slot.skill.startsWith("money:") ? slot.skill.slice(6) : "count";
      return makePayTask(level, rng, slot.factKey);
    }
    case "choice":
      return { kind: "choice", question: similarChoice(game, slot.question, rng) };
    default: {
      const prefix = `${game}:`;
      const level = slot.skill.startsWith(prefix) ? slot.skill.slice(prefix.length) : slot.skill;
      return makeBuildTask(game, level, rng, slot.factKey);
    }
  }
}

export interface StickerDay {
  iso: string;
  name: string;
  letter: string;
  played: boolean;
  today: boolean;
}

/** Seven days. A played day earns a sticker. An empty day stays empty. */
export function weekStickers(secondsByDay: Record<string, number>, today: string): StickerDay[] {
  return weekDates(today).map((iso, index) => ({
    iso,
    name: weekdayName(index),
    letter: weekdayLetter(index),
    played: (secondsByDay[iso] ?? 0) > 0,
    today: iso === today,
  }));
}

/** How many days in this Monday–Sunday week have any play. A quiet day is not a miss. */
export function daysPlayedThisWeek(secondsByDay: Record<string, number>, today: string): number {
  return weekStickers(secondsByDay, today).filter((day) => day.played).length;
}

/**
 * Kid-facing caption for the weekly sticker card. Zero is an empty sheet,
 * not a broken run. The count resets when the week does.
 */
export function daysPlayedCaption(played: number): string {
  const n = Math.max(0, Math.floor(played));
  if (n <= 0) return t("Days played this week", "Días jugados esta semana");
  if (n === 1) return t("1 day played this week", "1 día jugado esta semana");
  return t(`${n} days played this week`, `${n} días jugados esta semana`);
}
