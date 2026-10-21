import { formatClockTime } from "@/lib/clock";
import type { Rng } from "@/lib/rng";
import { getLocale, t } from "../i18n";
import { buddyName, pickTalk } from "./flavor";
import { timeCard } from "./cards";
import { AnalogClock, SquisheeImg, cx } from "../ui/bits";
import { qid } from "./choices";
import { makeElapsedQuestion } from "./span";
import { type ChoiceQ, type GameModule, type SheetItem } from "./types";

export const TIME_LEVELS = ["hour", "half", "quarter", "fives", "elapsed"] as const;
export type TimeLevel = (typeof TIME_LEVELS)[number];

export const TIME_MINUTES: Record<TimeLevel, readonly number[]> = {
  hour: [0],
  half: [0, 30],
  quarter: [0, 15, 30, 45],
  fives: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
  elapsed: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
};

export function isTimeLevel(v: unknown): v is TimeLevel {
  return typeof v === "string" && (TIME_LEVELS as readonly string[]).includes(v);
}

function capPhrase(phrase: string): string {
  if (!phrase) return phrase;
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

export function timeTalk(hours: number, minutes: number): string {
  if (getLocale() === "es") {
    if (minutes === 0) return `${hours} en punto`;
    if (minutes === 30) return `${hours} y media`;
    if (minutes === 15) return `${hours} y cuarto`;
    if (minutes === 45) {
      const next = hours === 12 ? 1 : hours + 1;
      return `cuarto para las ${next}`;
    }
    return formatClockTime(hours, minutes);
  }
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
  if (minutes === 30) return t("The long hand points to 6 = half past", "La manecilla larga apunta al 6. Eso es y media.");
  if (minutes === 0) return t("The long hand points to 12 = o'clock", "La manecilla larga apunta al 12. Eso es en punto.");
  if (minutes === 15) return t("The long hand points to 3 = quarter past", "La manecilla larga apunta al 3. Eso es y cuarto.");
  if (minutes === 45) return t("The long hand points to 9 = quarter to", "La manecilla larga apunta al 9. Eso es cuarto para.");
  return t(`The long hand points to ${number}. Count by fives.`, `La manecilla larga apunta al ${number}. Cuenta de 5 en 5.`);
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

const MINUTE_BY_IDEA: Record<string, number> = {
  oclock: 0,
  halfpast: 30,
  quarterpast: 15,
  quarterto: 45,
};

/** The minute a weak idea asks for, when this level can show it. */
export function preferredMinute(level: TimeLevel, prefer: readonly string[]): number | null {
  const allowed = new Set<number>(TIME_MINUTES[level]);
  for (const key of prefer) {
    const minute = MINUTE_BY_IDEA[key];
    if (minute != null && allowed.has(minute)) return minute;
  }
  return null;
}

function timeTags(minutes: number): string[] {
  if (minutes === 0) return ["oclock"];
  if (minutes === 30) return ["halfpast"];
  if (minutes === 15) return ["quarterpast"];
  if (minutes === 45) return ["quarterto"];
  return ["fives"];
}

export function makeTimeQuestion(rng: Rng, level: TimeLevel, prefer: readonly string[] = []): ChoiceQ {
  if (level === "elapsed") return makeElapsedQuestion(rng);
  const hours = rng.int(1, 12);
  const minutes = preferredMinute(level, prefer) ?? rng.pick(TIME_MINUTES[level]);
  const phrase = timeTalk(hours, minutes);
  const answer = formatClockTime(hours, minutes);
  return {
    id: qid(rng),
    game: "time",
    title: (() => {
      const buddy = buddyName(rng);
      return pickTalk(rng, [
        ["What time is it?", "¿Qué hora es?"],
        [`${buddy} checks the clock. What time is it?`, `${buddy} mira el reloj. ¿Qué hora es?`],
      ]);
    })(),
    hint: timeHint(hours, minutes),
    praise: t(`Yes! ${capPhrase(phrase)}`, `¡Sí! ${capPhrase(phrase)}`),
    almost: t(`Almost! It is ${phrase}.`, `¡Casi! Son las ${phrase}.`),
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
    prompt: t("What time is it?", "¿Qué hora es?"),
    answer: formatClockTime(hours, minutes),
    clock: { hours, minutes },
  };
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
            <figcaption>{t("What time is it?", "¿Qué hora es?")} __________</figcaption>
          </figure>
        ) : null,
      )}
    </div>
  );
}

export const timeGame = {
  ...timeCard,
  makeQuestion: (rng, level, prefer) => makeTimeQuestion(rng, isTimeLevel(level) ? level : "hour", prefer),
  makeSheetItem: sheetItem,
  Prompt: TimePrompt,
  Aside: TimeAside,
  SheetBody: TimeSheet,
} satisfies GameModule;
