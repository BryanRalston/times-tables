import type { Rng } from "@/lib/rng";

export { ADD_MAX, isAddLevel, makeAddQuestion, type AddLevel } from "./games/add";
export { fourChoices } from "./games/choices";
export { harderLevel, makeBossRound, makeQuestion, makeRound, makeSheet } from "./games/round";
export { TIME_MINUTES, fourTimeChoices, isTimeLevel, makeTimeQuestion, timeHint, timeTalk, type TimeLevel } from "./games/time";
export { TIMES_SPEC, isTimesLevel, makeTimesQuestion, nextTimesFact, type TimesLevel } from "./games/times";
export {
  MINUS,
  TIMES,
  type AddVisual,
  type ChoiceQ,
  type CoinPile,
  type MoneyVisual,
  type SheetItem,
  type TimeVisual,
  type TimesVisual,
  type Visual,
} from "./games/types";

/** How long a grown-up holds the button before the question appears. */
export const GROWNUP_HOLD_MS = 1200;

/** Two 2-digit factors. Kindergarten through grade 3 is not asked to multiply these. */
export function grownupGate(rng: Rng): { a: number; b: number; answer: number } {
  const a = rng.int(12, 48);
  const b = rng.int(12, 48);
  return { a, b, answer: a * b };
}

export function gateAnswerMatches(gate: { answer: number }, raw: string): boolean {
  if (!/^\d{1,4}$/.test(raw)) return false;
  return Number(raw) === gate.answer;
}
