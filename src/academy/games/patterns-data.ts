import type { Rng } from "@/lib/rng";
import { t } from "../i18n";
import type { PatternBoard, PatternLevel } from "./boards";
import { nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

export const PATTERN_LEVELS = ["tens", "fives", "twos", "hundreds", "rule", "grow"] as const;

const RULES = [2, 3, 4, 5, 10] as const;

export interface PatternTask {
  kind: "pattern";
  mode: PatternLevel;
  terms: number[];
  step: number;
  answer: number;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export function isPatternLevel(value: unknown): value is PatternLevel {
  return typeof value === "string" && (PATTERN_LEVELS as readonly string[]).includes(value);
}

export function ruleLabel(step: number): string {
  return t(`add ${step}`, `suma ${step}`, `some ${step}`, `ajoute ${step}`, `加${step}`, `${step} जोड़ो`, `أضف ${step}`);
}

function nextTitle(a: number, b: number, c: number): string {
  return t(
    `What comes next? ${a}, ${b}, ${c}.`,
    `¿Qué sigue? ${a}, ${b}, ${c}.`,
    `O que vem depois? ${a}, ${b}, ${c}.`,
    `Qu'est-ce qui vient ensuite ? ${a}, ${b}, ${c}.`,
    `下一个是多少？${a}，${b}，${c}。`,
    `आगे क्या आएगा? ${a}, ${b}, ${c}.`,
    `ماذا يأتي بعد ذلك؟ ${a}، ${b}، ${c}.`,
  );
}

function ruleTitle(a: number, b: number, c: number, d: number): string {
  return t(
    `${a}, ${b}, ${c}, ${d}. What is the rule?`,
    `${a}, ${b}, ${c}, ${d}. ¿Cuál es la regla?`,
    `${a}, ${b}, ${c}, ${d}. Qual é a regra?`,
    `${a}, ${b}, ${c}, ${d}. Quelle est la règle ?`,
    `${a}，${b}，${c}，${d}。规律是什么？`,
    `${a}, ${b}, ${c}, ${d}. नियम क्या है?`,
    `${a}، ${b}، ${c}، ${d}. ما القاعدة؟`,
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

function rulePraise(step: number): string {
  return t(
    `The rule is add ${step}`,
    `La regla es sumar ${step}`,
    `A regra é somar ${step}`,
    `La règle est d'ajouter ${step}`,
    `规律是加${step}`,
    `नियम है ${step} जोड़ना`,
    `القاعدة هي أضف ${step}`,
  );
}

export function patternHint(): string {
  return t("Look at the jump.", "Mira el salto.", "Olhe o salto.", "Regarde le saut.", "看一看每次跳多少。", "छलांग देखो।", "انظر إلى القفزة.");
}

function series(step: number, start: number, shown: number): number[] {
  return Array.from({ length: shown }, (_, index) => start + step * index);
}

function roll(level: PatternLevel, rng: Rng): PatternTask {
  switch (level) {
    case "tens": {
      const start = rng.int(0, 7) * 10;
      const terms = series(10, start, 4);
      const shown = terms.slice(0, 3);
      return pack(level, shown, 10, terms[3] ?? start + 30);
    }
    case "fives": {
      const start = rng.int(0, 17) * 5;
      const terms = series(5, start, 4);
      return pack(level, terms.slice(0, 3), 5, terms[3] ?? start + 15);
    }
    case "twos": {
      const start = rng.int(0, 18) * 2;
      const terms = series(2, start, 4);
      return pack(level, terms.slice(0, 3), 2, terms[3] ?? start + 6);
    }
    case "hundreds": {
      const start = rng.int(0, 7) * 100;
      const terms = series(100, start, 4);
      return pack(level, terms.slice(0, 3), 100, terms[3] ?? start + 300);
    }
    case "rule": {
      const step = rng.pick(RULES);
      const start = rng.int(1, Math.max(1, 60 - step * 3));
      const terms = series(step, start, 4);
      return pack(level, terms.slice(0, 3), step, terms[3] ?? start + step * 3);
    }
    case "grow": {
      const step = rng.pick(RULES);
      const start = rng.int(1, Math.max(1, 40 - step * 3));
      const terms = series(step, start, 4);
      return pack(level, terms, step, step);
    }
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function pack(mode: PatternLevel, terms: number[], step: number, answer: number): PatternTask {
  const speech = mode === "grow" ? ruleTitle(terms[0] ?? 0, terms[1] ?? 0, terms[2] ?? 0, terms[3] ?? 0) : nextTitle(terms[0] ?? 0, terms[1] ?? 0, terms[2] ?? 0);
  return {
    kind: "pattern",
    mode,
    terms,
    step,
    answer,
    speech,
    skill: `patterns:${mode}`,
    factKey: `${mode}:${terms.join("-")}:${step}`,
    praise: mode === "grow" ? rulePraise(step) : nextPraise(answer),
  };
}

export function makePatternTask(level: string, rng: Rng, avoid?: string): PatternTask {
  const safe: PatternLevel = isPatternLevel(level) ? level : "tens";
  let task = roll(safe, rng);
  for (let i = 0; i < 12 && avoid && task.factKey === avoid; i += 1) task = roll(safe, rng);
  return task;
}

export function patternMatches(task: PatternTask, picked: number | null): boolean {
  return picked === task.answer;
}

function choicesFor(rng: Rng, task: PatternTask): string[] {
  if (task.mode === "grow") {
    const pool = RULES.filter((step) => step !== task.step).map((step) => ruleLabel(step));
    return uniqueChoices(rng, ruleLabel(task.step), pool);
  }
  return nearChoices(rng, task.answer, 0, 1000, [task.answer + task.step, task.answer - task.step, task.answer + 1]);
}

export function taskBoard(task: PatternTask): PatternBoard {
  return { game: "patterns", mode: task.mode, terms: task.terms, step: task.step, answer: task.answer };
}

export function makePatternQuestion(rng: Rng, level: string): ChoiceQ {
  const task = makePatternTask(level, rng);
  const answer = task.mode === "grow" ? ruleLabel(task.step) : String(task.answer);
  return sceneQuestion(rng, {
    game: "patterns",
    title: task.speech,
    hint: patternHint(),
    answer,
    choices: choicesFor(rng, task),
    skill: task.skill,
    tags: ["patterns", task.mode],
    solved: task.praise,
    picture: "pattern",
    hands: true,
    quietChoices: task.mode === "grow",
    labels: {},
    board: taskBoard(task),
    factKey: task.factKey,
  });
}

export function makePatternSheet(rng: Rng, level: string): SheetItem {
  const task = makePatternTask(level, rng);
  const answer = task.mode === "grow" ? ruleLabel(task.step) : String(task.answer);
  return { prompt: task.speech, answer };
}
