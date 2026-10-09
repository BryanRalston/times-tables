import type { Rng } from "@/lib/rng";

export { ADD_MAX, isAddLevel, makeAddQuestion, type AddLevel } from "./games/add";
export { fourChoices } from "./games/choices";
export { makeQuestion, makeRound, makeSheet } from "./games/round";
export { TIME_MINUTES, fourTimeChoices, isTimeLevel, makeTimeQuestion, timeHint, timeTalk, type TimeLevel } from "./games/time";
export { TIMES_SPEC, isTimesLevel, makeTimesQuestion, nextTimesFact, type TimesLevel } from "./games/times";
export { MINUS, TIMES, type AddVisual, type ChoiceQ, type SheetItem, type TimeVisual, type TimesVisual, type Visual } from "./games/types";

export function grownupGate(rng: Rng): { a: number; b: number; answer: number } {
  const a = rng.int(6, 12);
  const b = rng.int(5, 9);
  return { a, b, answer: a + b };
}
