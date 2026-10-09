import type { Rng } from "@/lib/rng";
import { emptyPile, formatCents, pileCents, type CoinPile } from "./games/money-model";
import { TIME_MINUTES, isTimeLevel, timeTalk, type TimeLevel } from "./games/time";
import type { ChoiceQ, CoinKind } from "./games/types";
import { greedyCoins, speakable } from "./teach";

export interface ClockTask {
  kind: "clock";
  hours: number;
  minutes: number;
  /** 60 means o'clock: only the hour hand moves. */
  snap: number;
  speech: string;
  skill: string;
  factKey: string;
}

export interface PayTask {
  kind: "pay";
  cents: number;
  bank: CoinKind[];
  speech: string;
  skill: string;
  factKey: string;
}

export function clockSnap(level: string): number {
  switch (level) {
    case "hour":
      return 60;
    case "half":
      return 30;
    case "quarter":
      return 15;
    case "fives":
      return 5;
    default:
      return 60;
  }
}

function hour12(hours: number): number {
  const wrapped = ((Math.trunc(hours) % 12) + 12) % 12;
  return wrapped === 0 ? 12 : wrapped;
}

export function clockMatches(task: Pick<ClockTask, "hours" | "minutes">, hours: number, minutes: number): boolean {
  return hour12(hours) === hour12(task.hours) && minutes === task.minutes;
}

export function payMatches(cents: number, pile: CoinPile): boolean {
  return pileCents(pile) === Math.max(0, Math.floor(cents));
}

/**
 * Drag around the clock. Near the middle moves the hour hand. Near the edge
 * moves the minute hand, except on o'clock cards, which only set the hour.
 */
export function dragClock(opts: {
  dx: number;
  dy: number;
  radius: number;
  snap: number;
  hours: number;
  minutes: number;
}): { hours: number; minutes: number } {
  const deg = (Math.atan2(opts.dx, -opts.dy) * 180) / Math.PI;
  const norm = ((deg % 360) + 360) % 360;
  const dist = Math.hypot(opts.dx, opts.dy);
  const minuteHand = opts.snap < 60 && dist > Math.max(1, opts.radius) * 0.55;
  if (!minuteHand) {
    let next = Math.round(norm / 30) % 12;
    if (next <= 0) next = 12;
    return { hours: next, minutes: opts.snap >= 60 ? 0 : opts.minutes };
  }
  const raw = norm / 6;
  const step = Math.max(1, opts.snap);
  let minutes = Math.round(raw / step) * step;
  if (minutes >= 60) minutes = 0;
  return { hours: hour12(opts.hours), minutes };
}

export function stepClock(
  hours: number,
  minutes: number,
  snap: number,
  dir: 1 | -1,
  hand: "hour" | "minute",
): { hours: number; minutes: number } {
  if (snap >= 60 || hand === "hour") {
    let next = hour12(hours) + dir;
    if (next > 12) next = 1;
    if (next < 1) next = 12;
    return { hours: next, minutes: snap >= 60 ? 0 : minutes };
  }
  const step = Math.max(1, snap);
  let nextMin = minutes + dir * step;
  let nextHour = hour12(hours);
  if (nextMin >= 60) {
    nextMin = 0;
    nextHour = nextHour === 12 ? 1 : nextHour + 1;
  } else if (nextMin < 0) {
    nextMin = 60 - step;
    nextHour = nextHour === 1 ? 12 : nextHour - 1;
  }
  return { hours: nextHour, minutes: nextMin };
}

function minutesFor(level: TimeLevel, rng: Rng): number {
  const choices = TIME_MINUTES[level];
  return rng.pick([...choices]);
}

export function makeClockTask(level: string, rng: Rng, avoid?: string): ClockTask {
  const safe: TimeLevel = isTimeLevel(level) ? level : "hour";
  const snap = clockSnap(safe);
  let hours = rng.int(1, 12);
  let minutes = minutesFor(safe, rng);
  let fact = `${hours}:${minutes}`;
  let guard = 0;
  while (avoid && fact === avoid && guard < 16) {
    guard += 1;
    hours = rng.int(1, 12);
    if (guard % 3 === 0) minutes = minutesFor(safe, rng);
    fact = `${hours}:${minutes}`;
  }
  const phrase = timeTalk(hours, minutes);
  return {
    kind: "clock",
    hours,
    minutes,
    snap,
    speech: `Show ${phrase}. Drag the hands.`,
    skill: `time:${safe}`,
    factKey: fact,
  };
}

const PAY_PLANS: Record<string, { cents: number; bank: CoinKind[] }[]> = {
  name: [
    { cents: 1, bank: ["penny"] },
    { cents: 5, bank: ["nickel"] },
    { cents: 10, bank: ["dime"] },
    { cents: 25, bank: ["quarter"] },
  ],
  count: [
    { cents: 5, bank: ["penny", "nickel"] },
    { cents: 10, bank: ["penny", "nickel", "dime"] },
    { cents: 25, bank: ["nickel", "dime", "quarter"] },
  ],
  make: [
    { cents: 15, bank: ["penny", "nickel", "dime"] },
    { cents: 30, bank: ["nickel", "dime", "quarter"] },
    { cents: 40, bank: ["dime", "quarter"] },
    { cents: 50, bank: ["dime", "quarter"] },
  ],
  change: [
    { cents: 15, bank: ["penny", "nickel", "dime"] },
    { cents: 30, bank: ["nickel", "dime", "quarter"] },
    { cents: 40, bank: ["dime", "quarter"] },
    { cents: 50, bank: ["dime", "quarter"] },
  ],
  dollars: [
    { cents: 100, bank: ["quarter", "dollar"] },
    { cents: 125, bank: ["quarter", "dollar"] },
    { cents: 150, bank: ["dime", "quarter", "dollar"] },
  ],
};

export function makePayTask(level: string, rng: Rng, avoid?: string): PayTask {
  const plans = PAY_PLANS[level] ?? PAY_PLANS.count!;
  let pick = rng.pick(plans);
  let guard = 0;
  while (avoid && String(pick.cents) === avoid && plans.length > 1 && guard < 8) {
    guard += 1;
    pick = rng.pick(plans);
  }
  return {
    kind: "pay",
    cents: pick.cents,
    bank: pick.bank,
    speech: `Pay ${speakable(formatCents(pick.cents))}. Drag the coins.`,
    skill: `money:${level in PAY_PLANS ? level : "count"}`,
    factKey: String(pick.cents),
  };
}

function pileFromCoins(coins: CoinKind[]): CoinPile {
  const pile = emptyPile();
  for (const kind of coins) pile[kind] += 1;
  return pile;
}

export function clockQuestion(task: ClockTask): ChoiceQ {
  const answer = `${hour12(task.hours)}:${String(task.minutes).padStart(2, "0")}`;
  return {
    id: `clock-${task.factKey}`,
    game: "time",
    title: `Show ${timeTalk(task.hours, task.minutes)}`,
    hint: "Drag the hands",
    praise: timeTalk(task.hours, task.minutes),
    almost: timeTalk(task.hours, task.minutes),
    answer,
    choices: [],
    skill: task.skill,
    tags: [],
    factKey: task.factKey,
    visual: {
      kind: "time",
      hours: task.hours,
      minutes: task.minutes,
      level: task.skill.startsWith("time:") ? task.skill.slice(5) : "hour",
    },
  };
}

export function payQuestion(task: PayTask): ChoiceQ {
  const coins = greedyCoins(task.cents);
  const pile = pileFromCoins(coins);
  return {
    id: `pay-${task.factKey}`,
    game: "money",
    title: `Pay ${formatCents(task.cents)}`,
    hint: "Drag the coins",
    praise: formatCents(task.cents),
    almost: formatCents(task.cents),
    answer: formatCents(task.cents),
    choices: [],
    skill: task.skill,
    tags: ["coins"],
    factKey: task.factKey,
    visual: { kind: "money", mode: "count", coins: pile },
  };
}
