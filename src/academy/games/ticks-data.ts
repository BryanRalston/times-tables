import type { Rng } from "@/lib/rng";
import { getLocale, t } from "../i18n";
import type { TickBoard, TickLevel } from "./boards";
import { pickTalk } from "./flavor";
import { sceneQuestion, uniqueChoices } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

export const TICK_LEVELS = ["fourths", "sixths", "eighths", "past"] as const;

const FOURTHS = ["1/2", "1/4", "2/4", "3/4"] as const;
const SIXTHS = ["1/3", "2/3", "1/6", "2/6", "3/6", "4/6", "5/6"] as const;
const EIGHTHS = ["1/8", "2/8", "3/8", "4/8", "5/8", "6/8", "7/8"] as const;
const PAST = ["3/2", "5/4", "6/4", "7/4", "4/4", "2/2"] as const;

export interface TickTask {
  kind: "ticks";
  mode: TickLevel;
  num: number;
  den: number;
  whole: 1 | 2;
  answer: string;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export function isTickLevel(value: unknown): value is TickLevel {
  return typeof value === "string" && (TICK_LEVELS as readonly string[]).includes(value);
}

export function ticksMatch(task: TickTask, index: number): boolean {
  return index === task.num;
}

function poolFor(mode: TickLevel): readonly string[] {
  switch (mode) {
    case "fourths":
      return FOURTHS;
    case "sixths":
      return SIXTHS;
    case "eighths":
      return EIGHTHS;
    case "past":
      return PAST;
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
}

function partsOf(text: string): { num: number; den: number } {
  const [num, den] = text.split("/").map(Number);
  return { num: num ?? 1, den: den ?? 2 };
}

export function tickHint(): string {
  return t("Read the tick under the dot", "Lee la marca debajo del punto");
}

export function makeTickTask(level: string, rng: Rng, avoid?: string): TickTask {
  const mode: TickLevel = isTickLevel(level) ? level : "fourths";
  const pool = poolFor(mode);
  let answer = rng.pick([...pool]);
  for (let i = 0; i < 8 && avoid && answer === avoid.split(":").at(-1); i += 1) answer = rng.pick([...pool]);
  const { num, den } = partsOf(answer);
  const whole: 1 | 2 = mode === "past" ? 2 : 1;
  return {
    kind: "ticks",
    mode,
    num,
    den,
    whole,
    answer,
    speech: getLocale() === "hi" ? `। ${answer}` : answer,
    skill: `ticks:${mode}`,
    factKey: `${mode}:${answer}`,
    praise: answer,
  };
}

export function taskBoard(task: TickTask): TickBoard {
  return { game: "ticks", mode: task.mode, num: task.num, den: task.den, whole: task.whole };
}

export function makeTickQuestion(rng: Rng, level: string): ChoiceQ {
  const task = makeTickTask(level, rng);
  const asked = pickTalk(rng, [
    ["Which fraction is the dot?", "¿Qué fracción es el punto?"],
    ["Read the tick under the dot", "Lee la marca debajo del punto"],
  ]);
  return sceneQuestion(rng, {
    game: "ticks",
    title: getLocale() === "hi" ? `। ${asked}` : asked,
    hint: tickHint(),
    answer: task.answer,
    choices: uniqueChoices(rng, task.answer, poolFor(task.mode)),
    skill: task.skill,
    tags: ["ticks", task.mode],
    solved: task.answer,
    picture: task.answer,
    hands: false,
    quietChoices: false,
    labels: {},
    board: taskBoard(task),
    factKey: task.factKey,
  });
}

export function tickSheetPrompt(whole: number, parts: number, mark: number): string {
  return t(
    `A number line from 0 to ${whole} is split into ${parts} equal parts. The dot is on mark ${mark}. What fraction?`,
    `Una recta de 0 a ${whole} está partida en ${parts} partes iguales. El punto está en la marca ${mark}. ¿Qué fracción?`,
    `Uma reta de 0 a ${whole} está dividida em ${parts} partes iguais. O ponto está na marca ${mark}. Que fração?`,
    `Une droite de 0 à ${whole} est partagée en ${parts} parts égales. Le point est sur la marque ${mark}. Quelle fraction ?`,
    `一条从0到${whole}的数轴平均分成${parts}份。点在第${mark}个刻度。是几分之几？`,
    `0 से ${whole} तक की संख्या रेखा ${parts} बराबर हिस्सों में बँटी है। बिंदु निशान ${mark} पर है। कौन सा भिन्न?`,
    `خط أعداد من 0 إلى ${whole} مقسوم إلى ${parts} أجزاء متساوية. النقطة على العلامة ${mark}. ما الكسر؟`,
  );
}

export function makeTickSheet(rng: Rng, level: string): SheetItem {
  const task = makeTickTask(level, rng);
  const parts = task.den * task.whole;
  return { prompt: tickSheetPrompt(task.whole, parts, task.num), answer: task.answer };
}
