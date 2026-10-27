import type { Rng } from "@/lib/rng";
import { easeOf, easeSpan } from "../adapt";
import { t } from "../i18n";
import type { JumpLevel, JumpsBoard } from "./boards";
import { nearChoices, sceneQuestion } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

export const JUMP_LEVELS = ["ten", "hundred", "thousand"] as const;

export interface JumpTask {
  kind: "jumps";
  mode: JumpLevel;
  start: number;
  step: 10 | 100 | 1000;
  dir: "more" | "less";
  answer: number;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export function isJumpLevel(value: unknown): value is JumpLevel {
  return typeof value === "string" && (JUMP_LEVELS as readonly string[]).includes(value);
}

export function jumpsMatch(task: JumpTask, value: number): boolean {
  return value === task.answer;
}

function jumpSpeech(start: number, step: number, dir: JumpTask["dir"]): string {
  if (step >= 1000 || start > 1000) {
    if (dir === "more") {
      return t(
        "What is 1000 more?",
        "¿Cuánto es 1000 más?",
        "Quanto é 1000 mais?",
        "Combien font 1000 plus ?",
        "1000加，是多少？",
        "1000 जमा । कितना है",
        "كم 1000 زائد",
      );
    }
    return t(
      "What is 1000 less?",
      "¿Cuánto es 1000 menos?",
      "Quanto é 1000 menos?",
      "Combien font 1000 moins ?",
      "1000减，是多少？",
      "1000 घटा । कितना है",
      "كم 1000 ناقص",
    );
  }
  if (dir === "more") {
    return t(
      `What is ${step} more than ${start}?`,
      `¿Cuánto es ${start} más ${step}?`,
      `Quanto é ${start} mais ${step}?`,
      `Combien font ${start} plus ${step} ?`,
      `${start}加${step}是多少？`,
      `${start} जमा ${step} कितना है`,
      `كم ${start} زائد ${step}`,
    );
  }
  return t(
    `What is ${start} minus ${step}?`,
    `¿Cuánto es ${start} menos ${step}?`,
    `Quanto é ${start} menos ${step}?`,
    `Combien font ${start} moins ${step} ?`,
    `${start}减${step}是多少？`,
    `${start} घटा ${step} कितना है`,
    `كم ${start} ناقص ${step}`,
  );
}

function nextPraise(n: number): string {
  return t(
    `The next number is ${n}`,
    `El número que sigue es ${n}`,
    `O próximo número é ${n}`,
    `Le nombre suivant est ${n}`,
    `下一个数是${n}`,
    `अगली संख्या ${n} है`,
    `العدد التالي ${n}`,
  );
}

function shortPraise(dir: JumpTask["dir"]): string {
  if (dir === "more") return t("more", "más", "mais", "plus", "加", "जमा", "زائد");
  return t("less", "menos", "menos", "moins", "减", "घटा", "ناقص");
}

export function jumpHint(mode: JumpLevel): string {
  switch (mode) {
    case "ten":
      return t("Look at the tens", "Mira las decenas");
    case "hundred":
    case "thousand":
      return t("Look at the hundreds, then the tens", "Mira las centenas y luego las decenas");
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
}

function roll(mode: JumpLevel, rng: Rng, ease: ReturnType<typeof easeOf>): JumpTask {
  const dir: JumpTask["dir"] = rng.next() < 0.5 ? "more" : "less";
  let start = 10;
  let step: JumpTask["step"] = 10;
  switch (mode) {
    case "ten": {
      step = 10;
      const span = easeSpan(dir === "more" ? 10 : 10, dir === "more" ? 90 : 99, ease);
      start = rng.int(span.lo, span.hi);
      break;
    }
    case "hundred": {
      step = 100;
      const span = easeSpan(100, dir === "more" ? 900 : 1000, ease);
      start = rng.int(span.lo, span.hi);
      break;
    }
    case "thousand": {
      step = 1000;
      const span = easeSpan(1000, dir === "more" ? 8999 : 9999, ease);
      start = rng.int(span.lo, span.hi);
      break;
    }
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
  const answer = dir === "more" ? start + step : start - step;
  return {
    kind: "jumps",
    mode,
    start,
    step,
    dir,
    answer,
    speech: jumpSpeech(start, step, dir),
    skill: `jumps:${mode}`,
    factKey: `${mode}:${dir}:${start}:${step}`,
    praise: answer > 1000 ? shortPraise(dir) : nextPraise(answer),
  };
}

export function makeJumpTask(level: string, rng: Rng, avoid?: string, prefer: readonly string[] = []): JumpTask {
  const safe: JumpLevel = isJumpLevel(level) ? level : "ten";
  const ease = easeOf(prefer);
  let task = roll(safe, rng, ease);
  for (let i = 0; i < 12 && avoid && task.factKey === avoid; i += 1) task = roll(safe, rng, ease);
  return task;
}

export function taskBoard(task: JumpTask): JumpsBoard {
  return { game: "jumps", mode: task.mode, start: task.start, step: task.step, dir: task.dir, answer: task.answer };
}

export function makeJumpQuestion(rng: Rng, level: string, prefer: readonly string[] = []): ChoiceQ {
  const task = makeJumpTask(level, rng, undefined, prefer);
  const quiet = task.mode === "thousand" || task.answer > 1000 || task.start > 1000;
  const hi = quiet ? 9999 : 1000;
  return sceneQuestion(rng, {
    game: "jumps",
    title: task.speech,
    hint: jumpHint(task.mode),
    answer: String(task.answer),
    choices: nearChoices(rng, task.answer, 0, hi, [task.answer + task.step, task.answer - task.step, task.start]),
    skill: task.skill,
    tags: ["jumps", task.mode, task.dir],
    solved: task.praise,
    picture: "jumps",
    hands: false,
    quietChoices: quiet,
    labels: {},
    board: taskBoard(task),
    factKey: task.factKey,
  });
}

export function makeJumpSheet(rng: Rng, level: string): SheetItem {
  const task = makeJumpTask(level, rng);
  return { prompt: `${task.speech} ${task.start}`, answer: String(task.answer) };
}
