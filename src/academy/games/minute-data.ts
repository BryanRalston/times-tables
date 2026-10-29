import { formatClockTime } from "@/lib/clock";
import type { Rng } from "@/lib/rng";
import type { ClockTask } from "../hands";
import { t } from "../i18n";
import type { MinuteBoard, MinuteLevel } from "./boards";
import { buddyName, pickTalk } from "./flavor";
import { sceneQuestion, uniqueChoices } from "./pick";
import { timeTalk } from "./time";
import type { ChoiceQ, SheetItem } from "./types";

export const MINUTE_LEVELS = ["early", "half", "all"] as const;

const EARLY = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12] as const;
const HALF = [13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29] as const;

function allMinutes(): number[] {
  const minutes: number[] = [];
  for (let minute = 1; minute <= 59; minute += 1) {
    if (minute % 5 !== 0) minutes.push(minute);
  }
  return minutes;
}

export function isMinuteLevel(value: unknown): value is MinuteLevel {
  return typeof value === "string" && (MINUTE_LEVELS as readonly string[]).includes(value);
}

function minutesFor(mode: MinuteLevel): readonly number[] {
  switch (mode) {
    case "early":
      return EARLY;
    case "half":
      return HALF;
    case "all":
      return allMinutes();
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
}

export function minuteChoices(rng: Rng, hours: number, minutes: number): string[] {
  const answer = formatClockTime(hours, minutes);
  const nearest = Math.round(minutes / 5) * 5;
  const pool = [
    formatClockTime(hours, nearest),
    formatClockTime(hours + 1, minutes),
    formatClockTime(hours - 1, minutes),
    formatClockTime(hours, minutes + 1),
    formatClockTime(hours, minutes + 2),
    formatClockTime(hours, minutes - 1),
    formatClockTime(hours, minutes - 2),
  ];
  return uniqueChoices(rng, answer, pool);
}

function clockSpeech(phrase: string): string {
  return t(
    `Show ${phrase}. Drag the hands.`,
    `Muestra ${phrase}. Arrastra las manecillas.`,
    `Mostre ${phrase}. Arraste os ponteiros.`,
    `Montre ${phrase}. Glisse les aiguilles.`,
    `拨出${phrase}。拖动时针和分针。`,
    `${phrase} दिखाओ। सुइयाँ खींचो।`,
    `أظهر ${phrase}. اسحب العقارب.`,
  );
}

export function makeMinuteTask(level: string, rng: Rng, avoid?: string): ClockTask {
  const mode: MinuteLevel = isMinuteLevel(level) ? level : "early";
  const bag = minutesFor(mode);
  let hours = rng.int(1, 12);
  let minutes = rng.pick([...bag]);
  let fact = `${hours}:${String(minutes).padStart(2, "0")}`;
  let guard = 0;
  while (avoid && fact === avoid && guard < 16) {
    guard += 1;
    hours = rng.int(1, 12);
    minutes = rng.pick([...bag]);
    fact = `${hours}:${String(minutes).padStart(2, "0")}`;
  }
  return {
    kind: "clock",
    hours,
    minutes,
    snap: 1,
    speech: clockSpeech(timeTalk(hours, minutes)),
    skill: `minute:${mode}`,
    factKey: fact,
  };
}

export function taskBoard(task: ClockTask, mode: MinuteLevel): MinuteBoard {
  return { game: "minute", mode, hours: task.hours, minutes: task.minutes };
}

function asked(rng: Rng): string {
  const buddy = buddyName(rng);
  return pickTalk(rng, [
    ["What time is it?", "¿Qué hora es?"],
    [
      `${buddy} checks the clock. What time is it?`,
      `${buddy} mira el reloj. ¿Qué hora es?`,
      `${buddy} olha o relógio. Que horas são?`,
      `${buddy} regarde l'horloge. Quelle heure est-il ?`,
      `${buddy}看了看钟。现在几点？`,
      `${buddy} घड़ी देखता है। क्या समय हुआ है?`,
      `${buddy} ينظر إلى الساعة. كم الساعة؟`,
    ],
  ]);
}

export function minuteHint(): string {
  return t("Count the minutes past the hour", "Cuenta los minutos después de la hora");
}

export function makeMinuteQuestion(rng: Rng, level: string): ChoiceQ {
  const mode: MinuteLevel = isMinuteLevel(level) ? level : "early";
  const task = makeMinuteTask(mode, rng);
  const phrase = timeTalk(task.hours, task.minutes);
  const answer = formatClockTime(task.hours, task.minutes);
  return sceneQuestion(rng, {
    game: "minute",
    title: asked(rng),
    hint: minuteHint(),
    answer,
    choices: minuteChoices(rng, task.hours, task.minutes),
    skill: task.skill,
    tags: ["minute", mode],
    solved: phrase,
    picture: answer,
    hands: false,
    quietChoices: false,
    labels: {},
    board: taskBoard(task, mode),
    factKey: task.factKey,
  });
}

export function makeMinuteSheet(rng: Rng, level: string): SheetItem {
  const mode: MinuteLevel = isMinuteLevel(level) ? level : "early";
  const task = makeMinuteTask(mode, rng);
  return {
    prompt: t("What time is it?", "¿Qué hora es?"),
    answer: formatClockTime(task.hours, task.minutes),
    clock: { hours: task.hours, minutes: task.minutes },
  };
}
