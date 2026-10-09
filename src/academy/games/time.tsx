import { formatClockTime } from "@/lib/clock";
import type { Rng } from "@/lib/rng";
import { buddyName, pickLine } from "./flavor";
import { bandFor } from "../grade-map";
import type { Grade } from "../model";
import { AnalogClock, SquisheeImg, cx } from "../ui/bits";
import { qid } from "./choices";
import { type ChoiceQ, type GameModule, type SheetItem } from "./types";

export const TIME_LEVELS = ["hour", "half", "quarter", "fives"] as const;
export type TimeLevel = (typeof TIME_LEVELS)[number];

export const TIME_MINUTES: Record<TimeLevel, readonly number[]> = {
  hour: [0],
  half: [0, 30],
  quarter: [0, 15, 30, 45],
  fives: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
};

const LEVELS = [
  { id: "hour", label: "Hours", num: 1 },
  { id: "half", label: "Half hours", num: 2 },
  { id: "quarter", label: "Quarter hours", num: 3 },
  { id: "fives", label: "5 minutes", num: 4 },
] as const;

const BARS = [
  { key: "time:hour", label: "Time: hours" },
  { key: "time:half", label: "Time: half hour" },
  { key: "time:quarter", label: "Time: quarter hour" },
  { key: "time:fives", label: "Time: 5 minutes" },
];

const CHIPS = [
  { key: "oclock", label: "O'clock" },
  { key: "halfpast", label: "Half past" },
  { key: "quarterpast", label: "Quarter past" },
  { key: "quarterto", label: "Quarter to" },
  { key: "time:hour", label: "Hours" },
  { key: "time:half", label: "Half hours" },
  { key: "time:quarter", label: "Quarter hours" },
  { key: "time:fives", label: "5 minutes" },
];

export function isTimeLevel(v: unknown): v is TimeLevel {
  return typeof v === "string" && (TIME_LEVELS as readonly string[]).includes(v);
}

function defaultLevel(grade: Grade): TimeLevel {
  const start = bandFor("time", grade)?.start;
  if (isTimeLevel(start)) return start;
  switch (grade) {
    case "K":
      return "hour";
    case "1":
      return "half";
    case "2":
      return "quarter";
    case "3":
      return "fives";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

function capPhrase(phrase: string): string {
  if (!phrase) return phrase;
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

export function timeTalk(hours: number, minutes: number): string {
  if (minutes === 0) return `${hours} o'clock`;
  if (minutes === 30) return `half past ${hours}`;
  if (minutes === 15) return `quarter past ${hours}`;
  if (minutes === 45) {
    const next = hours === 12 ? 1 : hours + 1;
    return `quarter to ${next}`;
  }
  return formatClockTime(hours, minutes);
}

export function timeHint(_hours: number, minutes: number): string {
  const pointed = Math.round(minutes / 5) % 12;
  const number = pointed === 0 ? 12 : pointed;
  if (minutes === 30) return "The long hand points to 6 = half past";
  if (minutes === 0) return "The long hand points to 12 = o'clock";
  if (minutes === 15) return "The long hand points to 3 = quarter past";
  if (minutes === 45) return "The long hand points to 9 = quarter to";
  return `The long hand points to ${number}. Count by fives.`;
}

export function fourTimeChoices(rng: Rng, hours: number, minutes: number): string[] {
  const correct = formatClockTime(hours, minutes);
  const pool: string[] = [];
  const push = (h: number, m: number) => {
    if (pool.length >= 3) return;
    const label = formatClockTime(h, m);
    if (label === correct || pool.includes(label)) return;
    pool.push(label);
  };
  const pointed = Math.round(minutes / 5) % 12;
  const asHour = pointed === 0 ? 12 : pointed;
  push(asHour, minutes);
  if (minutes === 15) push(hours, 45);
  else if (minutes === 45) push(hours, 15);
  else if (minutes === 30) push(hours, 0);
  else if (minutes === 0) push(hours, 30);
  else push(hours, 0);
  push(hours + 1, minutes);
  push(hours, minutes + 5);
  push(hours, minutes - 5);
  push(hours - 1, minutes);
  push(asHour, 0);
  let extra = 0;
  while (pool.length < 3 && extra < 24) {
    extra += 1;
    push(hours, extra);
    push((hours + extra) % 12 || 12, 0);
  }
  return rng.shuffle([correct, ...pool.slice(0, 3)]);
}

function timeTags(minutes: number): string[] {
  if (minutes === 0) return ["oclock"];
  if (minutes === 30) return ["halfpast"];
  if (minutes === 15) return ["quarterpast"];
  if (minutes === 45) return ["quarterto"];
  return ["fives"];
}

export function makeTimeQuestion(rng: Rng, level: TimeLevel): ChoiceQ {
  const hours = rng.int(1, 12);
  const minutes = rng.pick(TIME_MINUTES[level]);
  const phrase = timeTalk(hours, minutes);
  const answer = formatClockTime(hours, minutes);
  return {
    id: qid(rng),
    game: "time",
    title: pickLine(rng, ["What time is it?", `${buddyName(rng)} checks the clock. What time is it?`]),
    hint: timeHint(hours, minutes),
    praise: `Yes! ${capPhrase(phrase)}`,
    almost: `Almost! It is ${phrase}.`,
    answer,
    choices: fourTimeChoices(rng, hours, minutes),
    skill: `time:${level}`,
    tags: timeTags(minutes),
    visual: { kind: "time", hours, minutes, level },
  };
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const safe = isTimeLevel(level) ? level : "half";
  const hours = rng.int(1, 12);
  const minutes = rng.pick(TIME_MINUTES[safe]);
  return {
    prompt: "What time is it?",
    answer: formatClockTime(hours, minutes),
    clock: { hours, minutes },
  };
}

function labelFor(rows: { key: string; label: string }[], key: string): string | null {
  return rows.find((row) => row.key === key)?.label ?? null;
}

export function TimeAside({ question }: { question: ChoiceQ }) {
  if (question.visual.kind !== "time") return null;
  return <AnalogClock hours={question.visual.hours} minutes={question.visual.minutes} />;
}

export function TimePrompt({ question, mascot, happy }: { question: ChoiceQ; reveal: boolean; mascot: string; happy: boolean }) {
  return (
    <div className="ac-time-copy">
      <div>
        <h1>{question.title}</h1>
        <p className="ac-hint">{question.hint}</p>
      </div>
      <SquisheeImg id={mascot} className={cx("ac-mascot", happy && "is-happy")} />
    </div>
  );
}

export function TimeSheet({ items }: { items: SheetItem[] }) {
  return (
    <div className="ac-clock-grid">
      {items.map((item, i) =>
        item.clock ? (
          <figure key={`${item.answer}-${i}`}>
            <AnalogClock hours={item.clock.hours} minutes={item.clock.minutes} />
            <figcaption>What time is it? __________</figcaption>
          </figure>
        ) : null,
      )}
    </div>
  );
}

export const timeGame = {
  id: "time",
  title: "Telling Time",
  audience: "Grade 1–3",
  tint: "sun",
  mascot: "melon",
  sheetSlug: "telling-time",
  sheetScreen: "sheet-time",
  blurb:
    "Free printable telling-time practice for grades K–3. Analog clocks to the hour, half hour, quarter hour, and 5 minutes, with an answer key.",
  sheetCount: 6,
  layout: "wide",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "half",
  isLevel: isTimeLevel,
  pill: (level) => `Telling Time · ${level.label}`,
  makeQuestion: (rng, level) => makeTimeQuestion(rng, isTimeLevel(level) ? level : "hour"),
  makeSheetItem: sheetItem,
  Prompt: TimePrompt,
  Aside: TimeAside,
  SheetBody: TimeSheet,
  bars: BARS,
  chips: CHIPS,
  skillLabel: (key) => labelFor(BARS, key) ?? labelFor(CHIPS, key),
  chipLabel: (key) => labelFor(CHIPS, key),
} satisfies GameModule;
