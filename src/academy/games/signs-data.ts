import type { Rng } from "@/lib/rng";
import { easeOf, easeSpan } from "../adapt";
import { t } from "../i18n";
import type { SignLevel, SignMark, SignsBoard } from "./boards";
import { sceneQuestion } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

export const SIGN_LEVELS = ["to10", "tens", "hundreds", "big"] as const;

export interface SignsTask {
  kind: "signs";
  mode: SignLevel;
  left: number;
  right: number;
  mark: SignMark;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export function isSignLevel(value: unknown): value is SignLevel {
  return typeof value === "string" && (SIGN_LEVELS as readonly string[]).includes(value);
}

export function signTruth(left: number, right: number): SignMark {
  if (left < right) return "<";
  if (left > right) return ">";
  return "=";
}

export function signLabel(left: number, mark: SignMark, right: number): string {
  return `${left} ${mark} ${right}`;
}

export function signsMatch(task: SignsTask, picked: SignMark | null): boolean {
  return picked === task.mark;
}

function compareSpeech(left: number, right: number, places: boolean): string {
  if (left > 1000 || right > 1000) {
    if (places) {
      return t(
        "Look at the hundreds, then the tens",
        "Mira las centenas y luego las decenas",
        undefined,
        undefined,
        undefined,
        "। पहले सैकड़ा देखो, फिर दहाई",
      );
    }
    return t("Compare.", "Compara.", "Compare.", "Compare.", "比。", "। तुलना", "قارن");
  }
  return t(
    `Compare ${left} and ${right}.`,
    `Compara ${left} y ${right}.`,
    `Compare ${left} e ${right}.`,
    `Compare ${left} et ${right}.`,
    `比${left}和${right}。`,
    `${left} और ${right} तुलना`,
    `قارن ${left} و ${right}`,
  );
}

function signPraise(left: number, right: number, mark: SignMark): string {
  if (left > 1000 || right > 1000) {
    switch (mark) {
      case "=":
        return t("equals", "igual", "igual", "égal", "等于", "बराबर", "يساوي");
      case ">":
        return t("is greater", "es mayor", "é maior", "est plus grand", "更大", "बड़ी है", "أكبر");
      case "<":
        return t("is less", "es menor", "é menor", "est plus petit", "更小", "छोटी है", "أصغر");
      default: {
        const neverMark: never = mark;
        return neverMark;
      }
    }
  }
  switch (mark) {
    case "=":
      return t(
        `${left} equals ${right}`,
        `${left} igual ${right}`,
        `${left} igual ${right}`,
        `${left} égal ${right}`,
        `${left}等于${right}`,
        `${left} बराबर ${right}`,
        `${left} يساوي ${right}`,
      );
    case ">":
      return t(
        `${left} is greater`,
        `${left} es mayor`,
        `${left} é maior`,
        `${left} est plus grand`,
        `${left}更大`,
        `${left} बड़ी है`,
        `${left} أكبر`,
      );
    case "<":
      return t(
        `${left} is less`,
        `${left} es menor`,
        `${left} é menor`,
        `${left} est plus petit`,
        `${left}更小`,
        `${left} छोटी है`,
        `${left} أصغر`,
      );
    default: {
      const neverMark: never = mark;
      return neverMark;
    }
  }
}

export function signHint(mode: SignLevel): string {
  switch (mode) {
    case "to10":
      return t("Look at the pictures", "Mira los dibujos");
    case "tens":
      return t("Look at the tens", "Mira las decenas");
    case "hundreds":
    case "big":
      return t("Look at the hundreds, then the tens", "Mira las centenas y luego las decenas");
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
}

function bounds(mode: SignLevel, ease: ReturnType<typeof easeOf>): { lo: number; hi: number } {
  switch (mode) {
    case "to10":
      return easeSpan(1, 10, ease);
    case "tens":
      return easeSpan(10, 99, ease);
    case "hundreds":
      return easeSpan(100, 999, ease);
    case "big":
      return easeSpan(1000, 9999, ease);
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
}

function roll(mode: SignLevel, rng: Rng, ease: ReturnType<typeof easeOf>): SignsTask {
  const { lo, hi } = bounds(mode, ease);
  const wantEqual = rng.next() < 0.34 || lo === hi;
  const left = rng.int(lo, hi);
  let right = wantEqual ? left : rng.int(lo, hi);
  if (!wantEqual) {
    let guard = 0;
    while (right === left && guard < 8) {
      right = rng.int(lo, hi);
      guard += 1;
    }
    if (right === left && hi > lo) right = left === hi ? lo : Math.min(hi, left + 1);
  }
  const mark = signTruth(left, right);
  return {
    kind: "signs",
    mode,
    left,
    right,
    mark,
    speech: compareSpeech(left, right, left > 1000 && left % 2 === 0),
    skill: `signs:${mode}`,
    factKey: `${mode}:${left}:${mark}:${right}`,
    praise: signPraise(left, right, mark),
  };
}

export function makeSignsTask(level: string, rng: Rng, avoid?: string, prefer: readonly string[] = []): SignsTask {
  const safe: SignLevel = isSignLevel(level) ? level : "to10";
  const ease = easeOf(prefer);
  let task = roll(safe, rng, ease);
  for (let i = 0; i < 12 && avoid && task.factKey === avoid; i += 1) task = roll(safe, rng, ease);
  return task;
}

function signChoices(rng: Rng, task: SignsTask): string[] {
  const marks: SignMark[] = ["<", "=", ">"];
  const answer = signLabel(task.left, task.mark, task.right);
  const options = [answer];
  for (const mark of marks) {
    const label = signLabel(task.left, mark, task.right);
    if (!options.includes(label)) options.push(label);
  }
  if (options.length < 4) {
    const extra = task.left === task.right ? signLabel(task.left, "=", task.left + 1) : signLabel(task.right, "<", task.right);
    if (!options.includes(extra)) options.push(extra);
  }
  let bump = 1;
  while (options.length < 4 && bump < 6) {
    const extra = signLabel(task.left, "=", task.right + bump);
    if (!options.includes(extra)) options.push(extra);
    bump += 1;
  }
  return rng.shuffle(options.slice(0, 4));
}

export function trueSignCount(left: number, right: number, choices: readonly string[]): number {
  return choices.filter((choice) => choice === signLabel(left, signTruth(left, right), right)).length;
}

export function taskBoard(task: SignsTask): SignsBoard {
  return { game: "signs", mode: task.mode, left: task.left, right: task.right, mark: task.mark };
}

export function makeSignsQuestion(rng: Rng, level: string, prefer: readonly string[] = []): ChoiceQ {
  const task = makeSignsTask(level, rng, undefined, prefer);
  return sceneQuestion(rng, {
    game: "signs",
    title: task.speech,
    hint: signHint(task.mode),
    answer: signLabel(task.left, task.mark, task.right),
    choices: signChoices(rng, task),
    skill: task.skill,
    tags: ["signs", task.mode],
    solved: task.praise,
    picture: "signs",
    hands: false,
    quietChoices: true,
    labels: {},
    board: taskBoard(task),
    factKey: task.factKey,
  });
}

/** Hindi four-digit speech starts with a danda so it does not stick to "your turn". */
export function shownSignSpeech(speech: string): string {
  return speech.replace(/^।\s*/, "");
}

export function makeSignsSheet(rng: Rng, level: string): SheetItem {
  const task = makeSignsTask(level, rng);
  return { prompt: shownSignSpeech(task.speech), answer: signLabel(task.left, task.mark, task.right) };
}
