import type { Rng } from "@/lib/rng";
import { STORY_STARS } from "./buddy/persona";
import { arabicFraction, countedNoun, frenchFraction, getLocale, hindiFraction, partPhrase, portugueseFraction, shapeWithArticle, shapeWord, spanishFraction, spanishShaded, starPlace, t, thingName, yesDetail } from "./i18n";
import { blockPhrase, countName, roundHalfUp } from "./games/boards";
import { isAddLevel } from "./games/add";
import { isCountLevel } from "./games/count";
import { isFractionLevel } from "./games/fractions";
import { isMeasureLevel } from "./games/measure";
import { PHONEME, RHYME_FAMILIES, SOUND_BANK, blendOf, isPhonicsLevel } from "./games/phonics";
import { isPlaceLevel } from "./games/place";
import { isProblemLevel } from "./games/problems";
import {
  isVariableLevel,
  praiseFor,
  rollVariable,
  variableAnswer,
  variableCaptions,
  variableKey,
  type VariableLevel,
} from "./games/variables";
import { isShapeLevel } from "./games/shapes";
import { sightWords, type SightList } from "./games/sight-data";
import { isSpellLevel, spellWords } from "./games/spell-data";
import { fourChoices } from "./games/choices";
import { MINUS, type ChoiceQ } from "./games/types";
import { isTimesLevel, nextTimesFact } from "./games/times";
import { makeClockTask, makePayTask, type ClockTask, type PayTask } from "./hands";
import { tracePraise, traceSpeech } from "./trace/lines";
import { makeGraphsTask, type GraphsTask } from "./games/graph-data";
import { makeGridTask, type GridTask } from "./games/grid-data";
import { makePatternTask, type PatternTask } from "./games/patterns-data";
import { makeShareTask, type ShareTask } from "./games/share-data";
import { workedExample, type ModelArt, type WorkedExample } from "./teach";
import { blankOut, buildTiles, countWord, extraLetters } from "./games/words";

export interface HandTile {
  id: string;
  label: string;
}

export interface ArrayTask {
  kind: "array";
  rows: number;
  cols: number;
  decoy: number;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface FrameTask {
  kind: "frame";
  op: "+" | "-";
  start: number;
  change: number;
  target: number;
  /** Ten-frames for sums through 20. Rods and cubes for tens and ones. */
  model: "ten" | "blocks";
  cells: 10 | 20;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface CountTask {
  kind: "count";
  /** pile: drag every counter. teen: a ten is already there. ten: fill a ten-frame. */
  mode: "pile" | "teen" | "ten";
  target: number;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface BlocksTask {
  kind: "blocks";
  hundreds: number;
  tens: number;
  ones: number;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface ShadeTask {
  kind: "shade";
  num: number;
  den: number;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface LetterTask {
  kind: "letters";
  word: string;
  tiles: HandTile[];
  sentence: string;
  showSentence: boolean;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface SightTask {
  kind: "sight";
  mode: "picture" | "sentence";
  word: string;
  emoji: string;
  sentence: string;
  choices: string[];
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface PhonicsTask {
  kind: "phonics";
  mode: "letter" | "rhyme" | "blend" | "end";
  answer: string;
  /** Emoji, cue word, or the letters already in place. */
  prompt: string;
  tiles: HandTile[];
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface MeasureTask {
  kind: "measure";
  mode: "compare" | "ruler" | "graph" | "more";
  target: number;
  /** Two bar lengths for compare. Left and right counts for how-many-more. */
  bars: number[];
  ask: "longest" | "shortest" | "";
  emoji: string;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface ShapeTask {
  kind: "shapes";
  mode: "name" | "sides" | "parts" | "symmetry" | "place" | "grid" | "join";
  answer: string;
  prompt: string;
  options: string[];
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
  rows?: number;
  cols?: number;
  pieces?: string[];
}

export interface StoryPiece {
  id: string;
  size: number;
}

export interface TraceTask {
  kind: "trace";
  glyph: string;
  form: "numeral" | "upper" | "lower";
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface BlankTask {
  kind: "blank";
  mode: VariableLevel;
  op: "+" | "-" | "×" | "÷";
  extraOp: "+" | "-";
  a: number;
  b: number;
  c: number;
  box: "left" | "right" | "result" | "extra";
  answer: number;
  tiles: number[];
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface StoryTask {
  kind: "story";
  mode: "join" | "take" | "groups" | "share";
  a: number;
  b: number;
  thing: string;
  emoji: string;
  decoy: number;
  pieces: StoryPiece[];
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export type BuildTask =
  | ArrayTask
  | FrameTask
  | CountTask
  | BlocksTask
  | ShadeTask
  | LetterTask
  | SightTask
  | PhonicsTask
  | MeasureTask
  | ShapeTask
  | StoryTask
  | BlankTask
  | TraceTask
  | GraphsTask
  | ShareTask
  | GridTask
  | PatternTask;

export type HandsTask = ClockTask | PayTask | BuildTask;

export interface StoryBuilt {
  groups: number[];
  away: number;
  bins: number[][];
}

export interface BlocksBuilt {
  hundreds: number;
  tens: number;
  ones: number;
}

const SIGHT_LISTS: readonly SightList[] = ["preprimer", "primer", "first", "second", "third", "fourth"];
const NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const FRACTION_NAME: Record<number, [string, string]> = {
  2: ["half", "halves"],
  3: ["third", "thirds"],
  4: ["fourth", "fourths"],
  6: ["sixth", "sixths"],
  5: ["fifth", "fifths"],
  8: ["eighth", "eighths"],
  10: ["tenth", "tenths"],
  12: ["twelfth", "twelfths"],
};
const EQUIVALENT_PAIRS: ReadonlyArray<readonly [number, number, number, number]> = [
  [1, 2, 2, 4],
  [1, 2, 3, 6],
  [1, 2, 4, 8],
  [2, 4, 1, 2],
  [2, 6, 1, 3],
  [4, 8, 1, 2],
  [3, 6, 1, 2],
  [2, 8, 1, 4],
];
const THINGS = [
  { name: "apples", emoji: "🍎" },
  { name: "fish", emoji: "🐟" },
  { name: "stars", emoji: "⭐" },
  { name: "cookies", emoji: "🍪" },
] as const;
const FLAT_SHAPES = ["circle", "triangle", "square", "rectangle"] as const;
const SOLID_SHAPES = ["cube", "sphere", "cone", "cylinder"] as const;
const SIDE_SHAPES: ReadonlyArray<readonly [string, number]> = [
  ["triangle", 3],
  ["square", 4],
  ["pentagon", 5],
  ["hexagon", 6],
];
const PARTS = ["halves", "thirds", "fourths", "unequal"] as const;

function fresh<T>(avoid: string | undefined, make: () => T, key: (item: T) => string): T {
  let item = make();
  for (let i = 0; i < 12 && avoid && key(item) === avoid; i++) item = make();
  return item;
}

function base(game: string, level: string, factKey: string, speech: string, praise: string) {
  return { speech, skill: `${game}:${level}`, factKey, praise };
}

function numberWord(n: number): string {
  return NUMBERS[n] ?? String(n);
}

function symmetryClue(clue: string): string {
  switch (clue) {
    case "4 lines of symmetry":
      return t("4 lines of symmetry", "4 líneas de simetría", "4 linhas de simetria");
    case "2 lines of symmetry":
      return t("2 lines of symmetry", "2 líneas de simetría", "2 linhas de simetria");
    case "3 lines of symmetry":
      return t("3 lines of symmetry", "3 líneas de simetría", "3 linhas de simetria");
    default:
      return clue;
  }
}

function fractionPhrase(num: number, den: number): string {
  if (getLocale() === "fr") return frenchFraction(num, den);
  if (getLocale() === "pt") return portugueseFraction(num, den);
  if (getLocale() === "es") return spanishFraction(num, den);
  if (getLocale() === "ar") return arabicFraction(num, den);
  if (getLocale() === "hi") return hindiFraction(num, den);
  const pair = FRACTION_NAME[den];
  if (!pair) return `${num} of ${den}`;
  return `${numberWord(num)} ${num === 1 ? pair[0] : pair[1]}`;
}

function tilesFrom(labels: readonly string[]): HandTile[] {
  return labels.map((label, index) => ({ id: `${index}-${label}`, label }));
}

export function arrayMatches(task: ArrayTask, rows: readonly number[]): boolean {
  return rows.length === task.rows && rows.every((n) => n === task.cols);
}

export function frameMatches(task: FrameTask, placed: number): boolean {
  return placed === task.change;
}

export function countMatches(task: CountTask, placed: number): boolean {
  if (task.mode === "teen") return placed === task.target - 10;
  return placed === task.target;
}

export function blocksMatches(task: BlocksTask, built: BlocksBuilt): boolean {
  return built.hundreds === task.hundreds && built.tens === task.tens && built.ones === task.ones;
}

export function shadeMatches(task: ShadeTask, shaded: readonly boolean[]): boolean {
  return shaded.length === task.den && shaded.filter(Boolean).length === task.num;
}

export function lettersMatch(task: LetterTask, placed: readonly string[]): boolean {
  return placed.join("") === task.word;
}

export function sightMatches(task: SightTask, placed: string | null): boolean {
  return placed === task.word;
}

export function phonicsMatches(task: PhonicsTask, placed: readonly string[]): boolean {
  if (task.mode === "blend") return placed.join("") === task.answer;
  return placed.length === 1 && placed[0]!.toLowerCase() === task.answer.toLowerCase();
}

export function measureMatches(task: MeasureTask, placed: number): boolean {
  return placed === task.target;
}

export function shapeMatches(task: ShapeTask, placed: string | null): boolean {
  return placed === task.answer;
}

export function storyMatches(task: StoryTask, built: StoryBuilt): boolean {
  switch (task.mode) {
    case "join": {
      const want = [task.a, task.b].sort((x, y) => x - y);
      const got = [...built.groups].sort((x, y) => x - y);
      return want.length === got.length && want.every((n, i) => n === got[i]);
    }
    case "take":
      return built.away === task.b;
    case "groups":
      return built.groups.length === task.a && built.groups.every((n) => n === task.b);
    case "share": {
      const each = task.b === 0 ? -1 : task.a / task.b;
      return built.bins.length === task.b && built.bins.every((bin) => bin.length === each);
    }
    default: {
      const neverMode: never = task.mode;
      return neverMode;
    }
  }
}

function makeArrayTask(level: string, rng: Rng, avoid?: string): ArrayTask {
  const safe = isTimesLevel(level) ? level : "count";
  return fresh(avoid, () => {
    const fact = nextTimesFact(rng, safe);
    const rows = Math.min(fact.a, fact.b);
    const cols = Math.max(fact.a, fact.b);
    const decoy = cols >= 10 ? cols - 1 : cols + 1;
    const praise = t(
      `Yes! ${rows} ${rows === 1 ? "row" : "rows"} of ${cols}.`,
      `¡Sí! ${rows} ${rows === 1 ? "fila" : "filas"} de ${cols}.`, `Sim! ${rows} ${rows === 1 ? "linha" : "linhas"} de ${cols}.`,
    `Oui ! ${rows} ${rows === 1 ? "ligne" : "lignes"} de ${cols}.`, `对！${rows}行，每行${cols}个。`, `हाँ! ${cols} का ${rows} पंक्ति।`, `نعم! ${rows} ${rows === 1 ? "صف" : "صفوف"} من ${cols}.`);
    return {
      kind: "array",
      rows,
      cols,
      decoy,
      ...base(
        "times",
        safe,
        `${rows}x${cols}`,
        t(
          `Make ${rows} ${rows === 1 ? "row" : "rows"} of ${cols}. Drag a row.`,
          `Haz ${rows} ${rows === 1 ? "fila" : "filas"} de ${cols}. Arrastra una fila.`, `Faça ${rows} ${rows === 1 ? "linha" : "linhas"} de ${cols}. Arraste uma linha.`,
        `Fais ${rows} ${rows === 1 ? "ligne" : "lignes"} de ${cols}. Glisse une ligne.`, `摆出${rows}行，每行${cols}个。拖动一行。`, `${cols} का ${rows} पंक्ति बनाओ। एक पंक्ति खींचो।`, `اصنع ${rows} ${rows === 1 ? "صف" : "صفوف"} من ${cols}. اسحب صفًّا.`),
        praise,
      ),
    };
  }, (task) => task.factKey);
}

function makeTenFrame(level: string, rng: Rng, avoid?: string): FrameTask {
  const safe = level === "within5" || level === "within20" ? level : "within10";
  const max = safe === "within5" ? 5 : safe === "within10" ? 10 : 20;
  const cells: 10 | 20 = max <= 10 ? 10 : 20;
  return fresh(avoid, () => {
    const sub = rng.next() < 0.35;
    if (!sub) {
      const target = rng.int(2, max);
      const change = rng.int(1, target);
      const start = target - change;
      const praise = t(`Yes! ${start} + ${change} = ${target}.`, `¡Sí! ${start} + ${change} = ${target}.`, `Sim! ${start} + ${change} = ${target}.`, `Oui ! ${start} + ${change} = ${target}.`, `对！${start} + ${change} = ${target}。`, `हाँ! ${start} + ${change} = ${target}।`, `نعم! ${start} + ${change} = ${target}.`);
      return {
        kind: "frame" as const,
        op: "+" as const,
        start,
        change,
        target,
        model: "ten" as const,
        cells,
        ...base("add", safe, `+${start}:${change}`, t(`Start with ${start}. Drag ${change} more.`, `Empieza con ${start}. Arrastra ${change} más.`, `Comece com ${start}. Arraste ${change} a mais.`, `Commence avec ${start}. Glisse ${change} de plus.`, `先放${start}个。再拖${change}个过来。`, `${start} से शुरू करो। ${change} और खींचो।`, `ابدأ بـ ${start}. اسحب ${change} زيادة.`), praise),
      };
    }
    const start = rng.int(2, max);
    const change = rng.int(1, start);
    const target = start - change;
    const praise = t(`Yes! ${start} minus ${change} = ${target}.`, `¡Sí! ${start} menos ${change} = ${target}.`, `Sim! ${start} menos ${change} = ${target}.`, `Oui ! ${start} moins ${change} = ${target}.`, `对！${start}减去${change}等于${target}。`, `हाँ! ${start} में से ${change} = ${target}।`, `نعم! ${start} ناقص ${change} = ${target}.`);
    return {
      kind: "frame" as const,
      op: "-" as const,
      start,
      change,
      target,
      model: "ten" as const,
      cells,
      ...base("add", safe, `-${start}:${change}`, t(`Start with ${start}. Drag ${change} away.`, `Empieza con ${start}. Arrastra ${change} hacia afuera.`, `Comece com ${start}. Arraste ${change} para fora.`, `Commence avec ${start}. Glisse ${change} dehors.`, `先放${start}个。再拖走${change}个。`, `${start} से शुरू करो। ${change} खींचकर हटाओ।`, `ابدأ بـ ${start}. اسحب ${change} بعيدًا.`), praise),
    };
  }, (task) => task.factKey);
}

function makeRodFrame(level: string, rng: Rng, avoid?: string): FrameTask {
  const safe = level === "within100" || level === "within1000" || level === "thousands" || level === "tens" ? level : "tens";
  return fresh(avoid, () => {
    const sub = rng.next() < 0.4;
    const onesChange = rng.next() < 0.65;
    let start = 10;
    let change = 1;
    if (!sub && onesChange) {
      const ones = rng.int(0, 7);
      change = rng.int(1, 9 - ones);
      start = rng.int(1, 8) * 10 + ones;
    } else if (!sub) {
      change = rng.int(1, 3) * 10;
      const ones = rng.int(0, 9);
      const maxTens = Math.max(1, Math.floor((99 - change - ones) / 10));
      start = rng.int(1, maxTens) * 10 + ones;
    } else if (onesChange) {
      const ones = rng.int(1, 9);
      change = rng.int(1, ones);
      start = rng.int(1, 8) * 10 + ones;
    } else {
      const tens = rng.int(2, 9);
      change = rng.int(1, tens - 1) * 10;
      start = tens * 10 + rng.int(0, 9);
    }
    const target = sub ? start - change : start + change;
    const op = sub ? ("-" as const) : ("+" as const);
    const speech = sub
      ? t(`Start with ${start}. Drag ${change} away.`, `Empieza con ${start}. Arrastra ${change} hacia afuera.`, `Comece com ${start}. Arraste ${change} para fora.`, `Commence avec ${start}. Glisse ${change} dehors.`, `先放${start}个。再拖走${change}个。`, `${start} से शुरू करो। ${change} खींचकर हटाओ।`, `ابدأ بـ ${start}. اسحب ${change} بعيدًا.`)
      : t(`Start with ${start}. Drag ${change} more.`, `Empieza con ${start}. Arrastra ${change} más.`, `Comece com ${start}. Arraste ${change} a mais.`, `Commence avec ${start}. Glisse ${change} de plus.`, `先放${start}个。再拖${change}个过来。`, `${start} से शुरू करो। ${change} और खींचो।`, `ابدأ بـ ${start}. اسحب ${change} زيادة.`);
    const praise = sub
      ? t(`Yes! ${start} minus ${change} = ${target}.`, `¡Sí! ${start} menos ${change} = ${target}.`, `Sim! ${start} menos ${change} = ${target}.`, `Oui ! ${start} moins ${change} = ${target}.`, `对！${start}减去${change}等于${target}。`, `हाँ! ${start} में से ${change} = ${target}।`, `نعم! ${start} ناقص ${change} = ${target}.`)
      : t(`Yes! ${start} + ${change} = ${target}.`, `¡Sí! ${start} + ${change} = ${target}.`, `Sim! ${start} + ${change} = ${target}.`, `Oui ! ${start} + ${change} = ${target}.`, `对！${start} + ${change} = ${target}。`, `हाँ! ${start} + ${change} = ${target}।`, `نعم! ${start} + ${change} = ${target}.`);
    return {
      kind: "frame" as const,
      op,
      start,
      change,
      target,
      model: "blocks" as const,
      cells: 10 as const,
      ...base("add", safe, `${op}${start}:${change}`, speech, praise),
    };
  }, (task) => task.factKey);
}

function makeFrameTask(level: string, rng: Rng, avoid?: string): FrameTask {
  const safe = isAddLevel(level) ? level : "within10";
  if (safe === "tens" || safe === "within100" || safe === "within1000" || safe === "thousands") return makeRodFrame(safe, rng, avoid);
  return makeTenFrame(safe, rng, avoid);
}

function makeCountTask(level: string, rng: Rng, avoid?: string): CountTask {
  const safe = isCountLevel(level) ? level : "objects";
  return fresh(avoid, () => {
    if (safe === "tenframe" || safe === "build") {
      const target = safe === "build" ? rng.int(1, 10) : rng.int(1, 20);
      return {
        kind: "count" as const,
        mode: "ten" as const,
        target,
        ...base("count", safe, `ten:${target}`, t(`Fill the ten-frame to ${target}.`, `Llena el tablero de diez hasta ${target}.`, `Encha o quadro de dez até ${target}.`, `Remplis la grille de dix jusqu'à ${target}.`, `把十格框填到${target}。`, `दस का खाना ${target} तक भरो।`, `املأ إطار العشرة حتى ${target}.`), t(`Yes! ${target}.`, `¡Sí! ${target}.`, `Sim! ${target}.`, `Oui ! ${target}.`, `对！${target}。`, `हाँ! ${target}।`, `نعم! ${target}.`)),
      };
    }
    if (safe === "to20") {
      const target = rng.int(11, 20);
      const extra = target - 10;
      return {
        kind: "count" as const,
        mode: "teen" as const,
        target,
        ...base(
          "count",
          safe,
          `teen:${target}`,
          t(`A ten is ready. Drag ${extra} more to make ${target}.`, `Ya hay una decena. Arrastra ${extra} más para formar ${target}.`, `Já tem uma dezena. Arraste ${extra} a mais para formar ${target}.`, `Une dizaine est prête. Glisse ${extra} de plus pour faire ${target}.`, `一个十好了。再拖${extra}个，凑成${target}。`, `एक दहाई तैयार है। ${target} बनाने के लिए ${extra} और खींचो।`, `العشرة جاهزة. اسحب ${extra} زيادة لتكوين ${target}.`),
          t(`Yes! ${target}.`, `¡Sí! ${target}.`, `Sim! ${target}.`, `Oui ! ${target}.`, `对！${target}。`, `हाँ! ${target}।`, `نعم! ${target}.`),
        ),
      };
    }
    if (safe === "neighbor") {
      const after = rng.next() < 0.5;
      const anchor = rng.int(after ? 1 : 2, after ? 9 : 10);
      const target = after ? anchor + 1 : anchor - 1;
      const speech = after
        ? t(`What comes after ${anchor}? Make that number.`, `¿Qué número va después de ${anchor}? Forma ese número.`, `Que número vem depois de ${anchor}? Monte esse número.`, `Quel nombre vient après ${anchor} ? Construis ce nombre.`, `${anchor}后面是几？摆出那个数。`, `${anchor} के बाद क्या आता है? वह संख्या बनाओ।`, `ما الذي يأتي بعد ${anchor}؟ كوّن ذلك العدد.`)
        : t(`What comes before ${anchor}? Make that number.`, `¿Qué número va antes de ${anchor}? Forma ese número.`, `Que número vem antes de ${anchor}? Monte esse número.`, `Quel nombre vient avant ${anchor} ? Construis ce nombre.`, `${anchor}前面是几？摆出那个数。`, `${anchor} से पहले क्या आता है? वह संख्या बनाओ।`, `ما الذي يأتي قبل ${anchor}؟ كوّن ذلك العدد.`);
      return {
        kind: "count" as const,
        mode: "pile" as const,
        target,
        ...base("count", safe, `near:${anchor}:${target}`, speech, t(`Yes! ${target}.`, `¡Sí! ${target}.`, `Sim! ${target}.`, `Oui ! ${target}.`, `对！${target}。`, `हाँ! ${target}।`, `نعم! ${target}.`)),
      };
    }
    if (safe === "compare") {
      const left = rng.int(1, 9);
      let right = rng.int(1, 9);
      if (right === left) right = left === 9 ? 1 : left + 1;
      const more = rng.next() < 0.5;
      const target = more ? Math.max(left, right) : Math.min(left, right);
      const speech = more
        ? t(`Which is more, ${left} or ${right}? Make that number.`, `¿Cuál es más, ${left} o ${right}? Forma ese número.`, `Qual é mais, ${left} ou ${right}? Monte esse número.`, `Lequel est le plus, ${left} ou ${right} ? Construis ce nombre.`, `${left}和${right}，哪个更多？摆出那个数。`, `${left} या ${right} में से कौन अधिक है? वह संख्या बनाओ।`, `أيّهما أكثر، ${left} أم ${right}؟ كوّن ذلك العدد.`)
        : t(`Which is less, ${left} or ${right}? Make that number.`, `¿Cuál es menos, ${left} o ${right}? Forma ese número.`, `Qual é menos, ${left} ou ${right}? Monte esse número.`, `Lequel est le moins, ${left} ou ${right} ? Construis ce nombre.`, `${left}和${right}，哪个更少？摆出那个数。`, `${left} या ${right} में से कौन कम है? वह संख्या बनाओ।`, `أيّهما أقل، ${left} أم ${right}؟ كوّن ذلك العدد.`);
      return {
        kind: "count" as const,
        mode: "pile" as const,
        target,
        ...base("count", safe, `cmp:${target}`, speech, t(`Yes! ${target}.`, `¡Sí! ${target}.`, `Sim! ${target}.`, `Oui ! ${target}.`, `对！${target}。`, `हाँ! ${target}।`, `نعم! ${target}.`)),
      };
    }
    const cap = safe === "subitize" ? 6 : 10;
    const target = rng.int(1, cap);
    return {
      kind: "count" as const,
      mode: "pile" as const,
      target,
      ...base("count", safe, `pile:${target}`, t(`Make ${target}. Drag the counters.`, `Forma ${target}. Arrastra las fichas.`, `Monte ${target}. Arraste as fichas.`, `Construis ${target}. Glisse les jetons.`, `摆出${target}。拖动小圆片。`, `${target} बनाओ। गिनतारे खींचो।`, `كوّن ${target}. اسحب العدادات.`), t(`Yes! ${target}.`, `¡Sí! ${target}.`, `Sim! ${target}.`, `Oui ! ${target}.`, `对！${target}。`, `हाँ! ${target}।`, `نعم! ${target}.`)),
    };
  }, (task) => task.factKey);
}

function blocksOf(n: number): Pick<BlocksTask, "hundreds" | "tens" | "ones"> {
  return { hundreds: 0, tens: Math.floor(n / 10), ones: n % 10 };
}

function makeBlocksTask(level: string, rng: Rng, avoid?: string): BlocksTask {
  const safe = isPlaceLevel(level) ? level : "blocks";
  return fresh(avoid, () => {
    if (safe === "round100") {
      const n = rng.int(150, 849);
      const rounded = roundHalfUp(n, 100);
      const hundreds = Math.max(1, Math.min(9, rounded / 100));
      return {
        kind: "blocks" as const,
        hundreds,
        tens: 0,
        ones: 0,
        ...base(
          "place",
          safe,
          `h:${n}`,
          t(`Round ${n} to the nearest hundred. Drag hundreds.`, `Redondea ${n} a la centena más cercana. Arrastra centenas.`, `Arredonde ${n} para a centena mais próxima. Arraste as centenas.`, `Arrondis ${n} à la centaine la plus proche. Glisse les centaines.`, `把${n}四舍五入到百位。拖动百位积木。`, `${n} को निकटतम सैकड़े तक पूर्णांक बनाओ। सैकड़े खींचो।`, `قرّب ${n} إلى أقرب مئة. اسحب المئات.`),
          t(`Yes! ${hundreds * 100}.`, `¡Sí! ${hundreds * 100}.`, `Sim! ${hundreds * 100}.`, `Oui ! ${hundreds * 100}.`, `对！${hundreds * 100}。`, `हाँ! ${hundreds * 100}।`, `نعم! ${hundreds * 100}.`),
        ),
      };
    }
    if (safe === "round10") {
      const n = rng.int(15, 84);
      const rounded = Math.max(10, Math.min(90, roundHalfUp(n, 10)));
      const parts = blocksOf(rounded);
      return {
        kind: "blocks" as const,
        ...parts,
        ...base(
          "place",
          safe,
          `r10:${n}`,
          t(`Round ${n} to the nearest ten. Build ${rounded}.`, `Redondea ${n} a la decena más cercana. Forma ${rounded}.`, `Arredonde ${n} para a dezena mais próxima. Monte ${rounded}.`, `Arrondis ${n} à la dizaine la plus proche. Construis ${rounded}.`, `把${n}四舍五入到十位。搭出${rounded}。`, `${n} को निकटतम दहाई तक पूर्णांक बनाओ। ${rounded} बनाओ।`, `قرّب ${n} إلى أقرب عشرة. كوّن ${rounded}.`),
          t(`Yes! ${rounded}.`, `¡Sí! ${rounded}.`, `Sim! ${rounded}.`, `Oui ! ${rounded}.`, `对！${rounded}。`, `हाँ! ${rounded}।`, `نعم! ${rounded}.`),
        ),
      };
    }
    if (safe === "compare") {
      const left = rng.int(13, 80);
      let right = rng.int(13, 89);
      if (right === left) right = Math.min(99, left + 10);
      const greater = Math.max(left, right);
      const parts = blocksOf(greater);
      return {
        kind: "blocks" as const,
        ...parts,
        ...base(
          "place",
          safe,
          `gt:${left}:${right}`,
          t(`Which is greater, ${left} or ${right}? Build it.`, `¿Cuál es mayor, ${left} o ${right}? Fórmalo.`, `Qual é maior, ${left} ou ${right}? Monte esse.`, `Lequel est le plus grand, ${left} ou ${right} ? Construis-le.`, `${left}和${right}，哪个更大？把它搭出来。`, `${left} या ${right} में से कौन बड़ी है? उसे बनाओ।`, `أيّهما أكبر، ${left} أم ${right}؟ كوّنه.`),
          t(`Yes! ${greater}.`, `¡Sí! ${greater}.`, `Sim! ${greater}.`, `Oui ! ${greater}.`, `对！${greater}。`, `हाँ! ${greater}।`, `نعم! ${greater}.`),
        ),
      };
    }
    const tens = rng.int(1, 9);
    const ones = rng.int(0, 9);
    const n = tens * 10 + ones;
    const speech = safe === "expanded" ? t(`Build ${tens * 10} + ${ones}.`, `Forma ${tens * 10} + ${ones}.`, `Monte ${tens * 10} + ${ones}.`, `Construis ${tens * 10} + ${ones}.`, `搭出${tens * 10} + ${ones}。`, `${tens * 10} + ${ones} बनाओ।`, `كوّن ${tens * 10} + ${ones}.`) : t(`Build ${blockPhrase(n)}.`, `Forma ${blockPhrase(n)}.`, `Monte ${blockPhrase(n)}.`, `Construis ${blockPhrase(n)}.`, `搭出${blockPhrase(n)}。`, `${blockPhrase(n)} बनाओ।`, `كوّن ${blockPhrase(n)}.`);
    return {
      kind: "blocks" as const,
      hundreds: 0,
      tens,
      ones,
      ...base("place", safe, `b:${n}`, speech, t(`Yes! ${n}.`, `¡Sí! ${n}.`, `Sim! ${n}.`, `Oui ! ${n}.`, `对！${n}。`, `हाँ! ${n}।`, `نعم! ${n}.`)),
    };
  }, (task) => task.factKey);
}

function shadeDens(level: string): number[] {
  switch (level) {
    case "parts":
      return [2, 4];
    case "unit":
    case "line":
    case "compare":
      return [2, 3, 4];
    default:
      return [2, 3, 4, 6, 8];
  }
}

function makeShadeTask(level: string, rng: Rng, avoid?: string): ShadeTask {
  const safe = isFractionLevel(level) ? level : "parts";
  return fresh(avoid, () => {
    if (safe === "equivalent") {
      const pair = rng.pick(EQUIVALENT_PAIRS);
      const num = pair[0];
      const den = pair[1];
      const phrase = fractionPhrase(num, den);
      const other = fractionPhrase(pair[2], pair[3]);
      return {
        kind: "shade" as const,
        num,
        den,
        ...base(
          "fractions",
          safe,
          `${num}/${den}=${pair[2]}/${pair[3]}`,
          t(`Shade ${phrase}. That matches ${other}.`, `Sombrea ${phrase}. Eso es igual a ${other}.`, `Pinte ${phrase}. Isso é igual a ${other}.`, `Colorie ${phrase}. C'est pareil que ${other}.`, `把${phrase}涂上颜色。它和${other}一样。`, `${phrase} रंगो। वह ${other} से मेल खाता है।`, `ظلّل ${phrase}. هذا يطابق ${other}.`),
          t(`Yes! ${phrase}.`, `¡Sí! ${phrase}.`, `Sim! ${phrase}.`, `Oui ! ${phrase}.`, `对！${phrase}。`, `हाँ! ${phrase}।`, `نعم! ${phrase}.`),
        ),
      };
    }
    if (safe === "compare") {
      const den = rng.pick(shadeDens(safe));
      const num = rng.int(2, den);
      const phrase = fractionPhrase(num, den);
      const smaller = fractionPhrase(1, den);
      return {
        kind: "shade" as const,
        num,
        den,
        ...base(
          "fractions",
          safe,
          `cmp:${num}/${den}`,
          t(`${phrase} is greater than ${smaller}. Shade ${phrase}.`, `${phrase} es mayor que ${smaller}. Sombrea ${phrase}.`, `${phrase} é maior que ${smaller}. Pinte ${phrase}.`, `${phrase} est plus grand que ${smaller}. Colorie ${phrase}.`, `${phrase}比${smaller}大。把${phrase}涂上颜色。`, `${phrase} ${smaller} से बड़ा है। ${phrase} रंगो।`, `${phrase} أكبر من ${smaller}. ظلّل ${phrase}.`),
          t(`Yes! ${phrase}.`, `¡Sí! ${phrase}.`, `Sim! ${phrase}.`, `Oui ! ${phrase}.`, `对！${phrase}。`, `हाँ! ${phrase}।`, `نعم! ${phrase}.`),
        ),
      };
    }
    const den = rng.pick(shadeDens(safe));
    const num = safe === "unit" ? 1 : rng.int(1, den);
    const phrase = fractionPhrase(num, den);
    return {
      kind: "shade" as const,
      num,
      den,
      ...base("fractions", safe, `${num}/${den}`, t(`Shade ${phrase}.`, `Sombrea ${phrase}.`, `Pinte ${phrase}.`, `Colorie ${phrase}.`, `把${phrase}涂上颜色。`, `${phrase} रंगो।`, `ظلّل ${phrase}.`), t(`Yes! ${phrase}.`, `¡Sí! ${phrase}.`, `Sim! ${phrase}.`, `Oui ! ${phrase}.`, `对！${phrase}。`, `हाँ! ${phrase}।`, `نعم! ${phrase}.`)),
    };
  }, (task) => task.factKey);
}

function makeLetterTask(level: string, rng: Rng, avoid?: string): LetterTask {
  const safe = isSpellLevel(level) ? level : "cvc";
  const pool = spellWords(safe).filter((row) => row.word.length >= 3 && row.word.length <= 6);
  return fresh(avoid, () => {
    const row = rng.pick(pool);
    const tiles = buildTiles(row.word, extraLetters(row.word, rng, 3), rng).map((tile) => ({
      id: tile.id,
      label: tile.letter,
    }));
    const showSentence = safe === "patterns" || safe === "grade4";
    const speech = showSentence
      ? t(`${row.sentence} Spell ${row.word}.`, `${row.sentence} Deletrea ${row.word}.`, `${row.sentence} Soletre ${row.word}.`, `${row.sentence} Épelle ${row.word}.`, `${row.sentence} 拼写${row.word}。`, `${row.sentence} ${row.word} लिखो।`, `${row.sentence} تهجَّ ${row.word}.`)
      : t(`Spell ${row.word}. Drag the letters.`, `Deletrea ${row.word}. Arrastra las letras.`, `Soletre ${row.word}. Arraste as letras.`, `Épelle ${row.word}. Glisse les lettres.`, `拼写${row.word}。拖动字母。`, `${row.word} लिखो। अक्षर खींचो।`, `تهجَّ ${row.word}. اسحب الحروف.`);
    return {
      kind: "letters" as const,
      word: row.word,
      tiles,
      sentence: showSentence ? blankOut(row.sentence, row.word) : "",
      showSentence,
      ...base("spelling", safe, row.word, speech, t(`Yes! ${row.word}.`, `¡Sí! ${row.word}.`, `Sim! ${row.word}.`, `Oui ! ${row.word}.`, `对！${row.word}。`, `हाँ! ${row.word}।`, `نعم! ${row.word}.`)),
    };
  }, (task) => task.factKey);
}

function isSightList(value: string): value is SightList {
  return (SIGHT_LISTS as readonly string[]).includes(value);
}

function makeSightTask(level: string, rng: Rng, avoid?: string): SightTask {
  const safe: SightList = isSightList(level) ? level : "preprimer";
  const sentence = safe === "second" || safe === "third" || safe === "fourth";
  const pool = sightWords(safe).filter((row) => (sentence ? countWord(row.sentence, row.word) > 0 : row.emoji.length > 0));
  return fresh(avoid, () => {
    const row = rng.pick(pool);
    const decoys = rng.shuffle(pool.filter((item) => item.word !== row.word)).slice(0, 2);
    const choices = rng.shuffle([row.word, ...decoys.map((item) => item.word)]);
    if (sentence) {
      return {
        kind: "sight" as const,
        mode: "sentence" as const,
        word: row.word,
        emoji: row.emoji,
        sentence: blankOut(row.sentence, row.word),
        choices,
        ...base(
          "sight",
          safe,
          row.word,
          t(`Drag the missing word. ${row.sentence}`, `Arrastra la palabra que falta. ${row.sentence}`, `Arraste a palavra que falta. ${row.sentence}`, `Glisse le mot qui manque. ${row.sentence}`, `拖动缺掉的词。${row.sentence}`, `छिपा शब्द खींचो। ${row.sentence}`, `اسحب الكلمة الناقصة. ${row.sentence}`),
          t(`Yes! ${row.word}.`, `¡Sí! ${row.word}.`, `Sim! ${row.word}.`, `Oui ! ${row.word}.`, `对！${row.word}。`, `हाँ! ${row.word}।`, `نعم! ${row.word}.`),
        ),
      };
    }
    return {
      kind: "sight" as const,
      mode: "picture" as const,
      word: row.word,
      emoji: row.emoji,
      sentence: "",
      choices,
      ...base("sight", safe, row.word, t(`Drag the word ${row.word}.`, `Arrastra la palabra ${row.word}.`, `Arraste a palavra ${row.word}.`, `Glisse le mot ${row.word}.`, `拖动单词${row.word}。`, `शब्द ${row.word} खींचो।`, `اسحب الكلمة ${row.word}.`), t(`Yes! ${row.word}.`, `¡Sí! ${row.word}.`, `Sim! ${row.word}.`, `Oui ! ${row.word}.`, `对！${row.word}。`, `हाँ! ${row.word}।`, `نعم! ${row.word}.`)),
    };
  }, (task) => task.factKey);
}

function makePhonicsTask(level: string, rng: Rng, avoid?: string): PhonicsTask {
  const safe = isPhonicsLevel(level) ? level : "sounds";
  return fresh(avoid, () => {
    if (safe === "rhyme") {
      const home = rng.pick([...RHYME_FAMILIES]);
      const cue = rng.pick([...home.words]);
      const answer = rng.pick(home.words.filter((word) => word !== cue));
      const decoys = rng
        .shuffle(RHYME_FAMILIES.filter((row) => row.family !== home.family))
        .slice(0, 2)
        .map((row) => rng.pick([...row.words]));
      return {
        kind: "phonics" as const,
        mode: "rhyme" as const,
        answer,
        prompt: cue,
        tiles: tilesFrom(rng.shuffle([answer, ...decoys])),
        ...base(
          "phonics",
          safe,
          `${cue}:${answer}`,
          t(`Drag the word that rhymes with ${cue}.`, `Arrastra la palabra que rima con ${cue}.`, `Arraste a palavra que rima com ${cue}.`, `Glisse le mot qui rime avec ${cue}.`, `拖动和${cue}押韵的词。`, `जो शब्द ${cue} से तुक मिलाता है उसे खींचो।`, `اسحب الكلمة التي تنتهي مثل ${cue}.`),
          t(`Yes! ${answer}.`, `¡Sí! ${answer}.`, `Sim! ${answer}.`, `Oui ! ${answer}.`, `对！${answer}。`, `हाँ! ${answer}।`, `نعم! ${answer}.`),
        ),
      };
    }
    if (safe === "cvc") {
      const words = RHYME_FAMILIES.flatMap((row) => [...row.words]);
      const word = rng.pick(words);
      const tiles = buildTiles(word, extraLetters(word, rng, 2), rng).map((tile) => ({ id: tile.id, label: tile.letter }));
      return {
        kind: "phonics" as const,
        mode: "blend" as const,
        answer: word,
        prompt: "",
        tiles,
        ...base("phonics", safe, word, t(`Build the word. ${blendOf(word)}.`, `Arma la palabra. ${blendOf(word)}.`, `Monte a palavra. ${blendOf(word)}.`, `Construis le mot. ${blendOf(word)}.`, `拼出这个词。${blendOf(word)}。`, `शब्द बनाओ। ${blendOf(word)}।`, `كوّن الكلمة. ${blendOf(word)}.`), t(`Yes! ${word}.`, `¡Sí! ${word}.`, `Sim! ${word}.`, `Oui ! ${word}.`, `对！${word}。`, `हाँ! ${word}।`, `نعم! ${word}.`)),
      };
    }
    if (safe === "end") {
      const words = RHYME_FAMILIES.flatMap((row) => [...row.words]);
      const word = rng.pick(words);
      const answer = word.slice(-1);
      const stem = word.slice(0, -1);
      const pool = ["t", "n", "g", "p", "d", "b", "m", "r", "s"].filter((letter) => letter !== answer);
      const tiles = tilesFrom(rng.shuffle([answer, ...rng.shuffle(pool).slice(0, 2)]));
      const phoneme = PHONEME[answer] ?? answer;
      return {
        kind: "phonics" as const,
        mode: "end" as const,
        answer,
        prompt: stem,
        tiles,
        ...base(
          "phonics",
          safe,
          `${word}:${answer}`,
          t(`Drag the last sound in ${word}. ${phoneme}.`, `Arrastra el último sonido de ${word}. ${phoneme}.`, `Arraste o último som de ${word}. ${phoneme}.`, `Glisse le dernier son de ${word}. ${phoneme}.`, `拖动${word}的最后一个音。${phoneme}。`, `${word} की आखिरी ध्वनि खींचो। ${phoneme}।`, `اسحب الصوت الأخير في ${word}. ${phoneme}.`),
          t(`Yes! ${word}.`, `¡Sí! ${word}.`, `Sim! ${word}.`, `Oui ! ${word}.`, `对！${word}。`, `हाँ! ${word}।`, `نعم! ${word}.`),
        ),
      };
    }
    const row = rng.pick([...SOUND_BANK]);
    const decoys = rng
      .shuffle(SOUND_BANK.filter((item) => item.letter !== row.letter))
      .slice(0, 2)
      .map((item) => item.letter);
    const speech =
      safe === "begin"
        ? t(`Drag the first sound. ${row.phoneme}.`, `Arrastra el primer sonido. ${row.phoneme}.`, `Arraste o primeiro som. ${row.phoneme}.`, `Glisse le premier son. ${row.phoneme}.`, `拖动第一个音。${row.phoneme}。`, `पहली ध्वनि खींचो। ${row.phoneme}।`, `اسحب الصوت الأول. ${row.phoneme}.`)
        : t(`Drag the letter that says ${row.phoneme}.`, `Arrastra la letra que dice ${row.phoneme}.`, `Arraste a letra que diz ${row.phoneme}.`, `Glisse la lettre qui dit ${row.phoneme}.`, `拖动读作${row.phoneme}的字母。`, `जो अक्षर ${row.phoneme} कहता है उसे खींचो।`, `اسحب الحرف الذي يُنطق ${row.phoneme}.`);
    return {
      kind: "phonics" as const,
      mode: "letter" as const,
      answer: row.letter,
      prompt: row.emoji,
      tiles: tilesFrom(rng.shuffle([row.letter, ...decoys])),
      ...base(
        "phonics",
        safe,
        `${row.letter}:${row.word}`,
        speech,
        t(`Yes! ${row.letter} says ${row.phoneme}.`, `¡Sí! ${row.letter} dice ${row.phoneme}.`, `Sim! ${row.letter} diz ${row.phoneme}.`, `Oui ! ${row.letter} dit ${row.phoneme}.`, `对！${row.letter}读作${row.phoneme}。`, `हाँ! ${row.letter} ${row.phoneme} कहता है।`, `نعم! ${row.letter} يُنطق ${row.phoneme}.`),
      ),
    };
  }, (task) => task.factKey);
}

function makeMeasureTask(level: string, rng: Rng, avoid?: string): MeasureTask {
  const safe = isMeasureLevel(level) ? level : "compare";
  return fresh(avoid, () => {
    if (safe === "ruler") {
      const target = rng.int(1, 6);
      return {
        kind: "measure" as const,
        mode: "ruler" as const,
        target,
        bars: [],
        ask: "" as const,
        emoji: "",
        ...base(
          "measure",
          safe,
          `in:${target}`,
          t("How long is the ribbon? Drag the inches.", "¿Qué tan largo es el listón? Arrastra las pulgadas."),
          t(`Yes! ${target} ${target === 1 ? "inch" : "inches"}.`, `¡Sí! ${target} ${target === 1 ? "pulgada" : "pulgadas"}.`, `Sim! ${target} ${target === 1 ? "polegada" : "polegadas"}.`, `Oui ! ${target} ${target === 1 ? "pouce" : "pouces"}.`, `对！${target}英寸。`, `हाँ! ${target} इंच।`, `نعم! ${target} ${target === 1 ? "بوصة" : target === 2 ? "بوصتان" : "بوصات"}.`),
        ),
      };
    }
    if (safe === "picture" || safe === "bar") {
      const target = rng.int(1, 6);
      const emoji = safe === "picture" ? "🍎" : "";
      return {
        kind: "measure" as const,
        mode: "graph" as const,
        target,
        bars: [],
        ask: "" as const,
        emoji,
        ...base("measure", safe, `bar:${target}`, t(`Drag to make a bar of ${target}.`, `Arrastra para hacer una barra de ${target}.`, `Arraste para fazer uma barra de ${target}.`, `Glisse pour faire une barre de ${target}.`, `拖动，做出${target}长的一条。`, `${target} का दंड बनाने के लिए खींचो।`, `اسحب لصنع عمود طوله ${target}.`), t(`Yes! ${target}.`, `¡Sí! ${target}.`, `Sim! ${target}.`, `Oui ! ${target}.`, `对！${target}。`, `हाँ! ${target}।`, `نعم! ${target}.`)),
      };
    }
    if (safe === "more") {
      const high = rng.int(3, 8);
      const low = rng.int(1, high - 1);
      const target = high - low;
      return {
        kind: "measure" as const,
        mode: "more" as const,
        target,
        bars: [high, low],
        ask: "" as const,
        emoji: "🍎",
        ...base(
          "measure",
          safe,
          `more:${high}:${low}`,
          t(`${high} apples and ${low} apples. Drag how many more.`, `${high} manzanas y ${low} manzanas. Arrastra cuántas más.`, `${high} maçãs e ${low} maçãs. Arraste quantas a mais.`, `${high} pommes et ${low} pommes. Glisse combien de plus.`, `${high}个苹果和${low}个苹果。把多出来的拖出来。`, `${high} सेब और ${low} सेब। कितने अधिक हैं, खींचो।`, `${high} ${thingName("apples", high, "apples")} و${low} ${thingName("apples", low, "apples")}. اسحب كم الزيادة.`),
          t(`Yes! ${target} more.`, `¡Sí! ${target} más.`, `Sim! ${target} a mais.`, `Oui ! ${target} de plus.`, `对！多${target}个。`, `हाँ! ${target} अधिक।`, `نعم! ${target} أكثر.`),
        ),
      };
    }
    const longer = rng.int(3, 6);
    let shorter = rng.int(1, longer - 1);
    if (shorter === longer) shorter = 1;
    const ask = rng.next() < 0.5 ? ("longest" as const) : ("shortest" as const);
    const target = ask === "longest" ? longer : shorter;
    const bars = rng.shuffle([longer, shorter]);
    return {
      kind: "measure" as const,
      mode: "compare" as const,
      target,
      bars,
      ask,
      emoji: "",
      ...base(
        "measure",
        safe,
        `${ask}:${target}`,
        t(`Drag the ${ask} one.`, ask === "longest" ? "Arrastra el más largo." : "Arrastra el más corto.", ask === "longest" ? "Arraste o mais comprido." : "Arraste o mais curto.", ask === "longest" ? "Glisse le plus long." : "Glisse le plus court.", `拖动${ask}的那个。`, ask === "longest" ? "सबसे लंबा वाला खींचो।" : "सबसे छोटा वाला खींचो।", ask === "longest" ? "اسحب الأطول." : "اسحب الأقصر."),
        t(`Yes! The ${ask} one.`, ask === "longest" ? "¡Sí! El más largo." : "¡Sí! El más corto.", ask === "longest" ? "Sim! O mais comprido." : "Sim! O mais curto.", ask === "longest" ? "Oui ! Le plus long." : "Oui ! Le plus court.", `对！是${ask}的那个。`, ask === "longest" ? "हाँ! सबसे लंबा वाला।" : "हाँ! सबसे छोटा वाला।", ask === "longest" ? "نعم! الأطول." : "نعم! الأقصر."),
      ),
    };
  }, (task) => task.factKey);
}

function withAnswer(options: readonly string[], answer: string, rng: Rng): string[] {
  const rest = options.filter((item) => item !== answer);
  return rng.shuffle([answer, ...rng.shuffle(rest).slice(0, 2)]);
}

function shapePraise(shape: string): string {
  return t(`Yes! ${shape}.`, `¡Sí! ${shapeWithArticle(shape)}.`, `Sim! ${shapeWithArticle(shape)}.`, `Oui ! ${shapeWithArticle(shape)}.`, `对！${shape}。`, `हाँ! ${shapeWord(shape)}।`, `نعم! ${shapeWord(shape)}.`);
}

function isStarPlace(place: string): place is "above" | "below" | "beside" | "behind" {
  return place === "above" || place === "below" || place === "beside" || place === "behind";
}

function makeShapeTask(level: string, rng: Rng, avoid?: string): ShapeTask {
  const safe = isShapeLevel(level) ? level : "flat";
  return fresh(avoid, () => {
    if (safe === "position") {
      const answer = rng.pick(["above", "below", "beside", "behind"]);
      return {
        kind: "shapes" as const,
        mode: "place" as const,
        answer,
        prompt: `geo:pos:${answer}`,
        options: rng.shuffle(["above", "below", "beside", "behind"]),
        ...base(
          "shapes",
          safe,
          answer,
          t("Where is the star?", "¿Dónde está la estrella?"),
          isStarPlace(answer) ? yesDetail(starPlace(answer)) : t("Yes! Find the same shape.", "¡Sí! Busca la misma figura."),
        ),
      };
    }
    if (safe === "sort") {
      const flat = rng.next() < 0.5;
      const flats = ["circle", "triangle", "square", "rectangle"];
      const solids = ["cube", "sphere", "cone", "cylinder"];
      const answer = rng.pick(flat ? flats : solids);
      const options = rng.shuffle([answer, ...rng.shuffle(flat ? solids : flats).slice(0, 2)]);
      return {
        kind: "shapes" as const,
        mode: "name" as const,
        answer,
        prompt: "",
        options,
        ...base(
          "shapes",
          safe,
          `${flat ? "flat" : "solid"}:${answer}`,
          flat
            ? t("A flat shape sits on the page.", "Una figura plana se queda en la hoja.")
            : t("A solid shape you could hold.", "Un cuerpo que puedes sostener."),
          shapePraise(answer),
        ),
      };
    }
    if (safe === "traits" || safe === "quads" || safe === "fold") {
      const pool =
        safe === "traits"
          ? ["circle", "triangle", "square", "rectangle"]
          : safe === "quads"
            ? ["rhombus", "rectangle", "square", "trapezoid"]
            : ["square:yes", "rectangle:yes", "triangle:yes", "circle:yes"];
      const answer = safe === "fold" ? rng.pick(pool) : rng.pick(pool);
      const options = withAnswer(pool, answer, rng);
      const prompt =
        safe === "traits"
          ? `geo:trait:${answer}:blue:big:turn`
          : safe === "quads"
            ? `geo:quad:${answer}`
            : `geo:fold:${answer}`;
      return {
        kind: "shapes" as const,
        mode: "name" as const,
        answer,
        prompt,
        options,
        ...base(
          "shapes",
          safe,
          `${safe}:${answer}`,
          safe === "fold"
            ? t("A line of symmetry makes two matching halves.", "Una línea de simetría hace dos mitades iguales.")
            : t("What shape is this?", "¿Qué figura es esta?"),
          safe === "fold"
            ? t(
                "Yes! A line of symmetry makes two matching halves.",
                "¡Sí! Una línea de simetría hace dos mitades iguales.",
              )
            : answer === "rectangle" || answer === "square" || answer === "circle" || answer === "triangle"
              ? shapePraise(answer)
              : answer === "rhombus" || answer === "trapezoid"
                ? yesDetail(answer === "rhombus" ? t("It is a rhombus", "Es el rombo") : t("It is a trapezoid", "Es el trapecio"))
                : t("Yes! Find the same shape.", "¡Sí! Busca la misma figura."),
        ),
      };
    }
    if (safe === "compose") {
      const made = rng.pick(["rectangle", "square", "circle"] as const);
      const pieces = made === "circle" ? ["half-a", "half-b"] : ["tri-a", "tri-b"];
      const extra = made === "circle" ? "square" : "half-a";
      return {
        kind: "shapes" as const,
        mode: "join" as const,
        answer: [...pieces].sort().join("+"),
        prompt: `geo:join:${made}`,
        options: rng.shuffle([...pieces, extra]),
        pieces,
        ...base(
          "shapes",
          safe,
          made,
          t("What shape is this?", "¿Qué figura es esta?"),
          shapePraise(made),
        ),
      };
    }
    if (safe === "faces") {
      const counting = avoid === "cube" || (avoid !== "6" && rng.next() < 0.5);
      if (counting) {
        return {
          kind: "shapes" as const,
          mode: "name" as const,
          answer: "6",
          prompt: "geo:net",
          options: rng.shuffle(["4", "5", "6", "8"]),
          ...base("shapes", safe, "6", t("Count the squares.", "Cuenta los cuadritos."), t("Yes! 6 square units.", "¡Sí! 6 unidades cuadradas.")),
        };
      }
      return {
        kind: "shapes" as const,
        mode: "name" as const,
        answer: "cube",
        prompt: "geo:net",
        options: withAnswer(["cube", "sphere", "cone", "cylinder"], "cube", rng),
        ...base("shapes", safe, "cube", t("What shape is this?", "¿Qué figura es esta?"), t("Yes! It is a cube.", "¡Sí! Es el cubo.")),
      };
    }
    if (safe === "rows" || safe === "cover") {
      const rows = safe === "rows" ? rng.int(2, 3) : rng.int(4, 5);
      const cols = safe === "rows" ? rng.int(2, 4) : rng.int(4, 5);
      const product = rows * cols;
      const options = [String(product), String(product + 1), String(Math.max(1, product - 1))];
      return {
        kind: "shapes" as const,
        mode: "grid" as const,
        answer: String(product),
        prompt: `geo:grid:${rows}x${cols}`,
        options: rng.shuffle(options),
        rows,
        cols,
        ...base(
          "shapes",
          safe,
          `${rows}x${cols}`,
          t(`${rows} rows of ${cols}. Count the squares.`, `${rows} filas de ${cols}. Cuenta los cuadritos.`, `${rows} linhas de ${cols}. Conte os quadradinhos.`, `${rows} lignes de ${cols}. Compte les petits carrés.`, `${rows}行，每行${cols}个。数一数小方格。`, `${cols} की ${rows} पंक्तियाँ। वर्ग गिनो।`, `${rows} صفوف من ${cols}. عُدّ المربعات.`),
          t(`Yes! ${product} square units.`, `¡Sí! ${product} unidades cuadradas.`, `Sim! ${product} unidades quadradas.`, `Oui ! ${product} unités carrées.`, `对！${product}平方单位。`, `हाँ! ${product} वर्ग इकाई।`, `نعم! ${product} وحدات مربعة.`),
        ),
      };
    }
    if (safe === "share") {
      const den = rng.pick([2, 3, 4]);
      const answer = `1/${den}`;
      return {
        kind: "shapes" as const,
        mode: "parts" as const,
        answer,
        prompt: `geo:share:${den}`,
        options: rng.shuffle(["1/2", "1/3", "1/4"]),
        ...base(
          "shapes",
          safe,
          answer,
          t("What unit fraction is shaded?", "¿Qué fracción unitaria está sombreada?"),
          den === 3
            ? t("Yes! One third is shaded.", `¡Sí! ${spanishShaded("1/3")}.`)
            : den === 4
              ? t("Yes! One fourth is shaded.", `¡Sí! ${spanishShaded("1/4")}.`)
              : t("Yes! One half is shaded.", `¡Sí! ${spanishShaded("1/2")}.`),
        ),
      };
    }
    if (safe === "parts") {
      const answer = rng.pick(["halves", "thirds", "fourths"]);
      return {
        kind: "shapes" as const,
        mode: "parts" as const,
        answer,
        prompt: partPhrase(answer),
        options: withAnswer(PARTS, answer, rng),
        ...base(
          "shapes",
          safe,
          answer,
          t(`Drag the ${answer}.`, `Arrastra ${partPhrase(answer)}.`, `Arraste ${partPhrase(answer)}.`, `Glisse ${partPhrase(answer)}.`, `拖动${answer}。`, `${partPhrase(answer)} खींचो।`, `اسحب ${partPhrase(answer)}.`),
          t(`Yes! ${answer}.`, `¡Sí! ${partPhrase(answer)}.`, `Sim! ${partPhrase(answer)}.`, `Oui ! ${answer}.`, `对！${answer}。`, `हाँ! ${partPhrase(answer)}।`, `نعم! ${partPhrase(answer)}.`),
        ),
      };
    }
    if (safe === "sides") {
      const row = rng.pick(SIDE_SHAPES);
      const answer = row[0];
      const sides = row[1];
      const options = withAnswer(
        SIDE_SHAPES.map((item) => item[0]),
        answer,
        rng,
      );
      return {
        kind: "shapes" as const,
        mode: "sides" as const,
        answer,
        prompt: t(`${sides} sides`, `${sides} sides`, `${sides} sides`, `${sides} sides`, `${sides} sides`, `${sides} भुजाएँ`, `${sides} أضلاع`),
        options,
        ...base(
          "shapes",
          safe,
          `${answer}:${sides}`,
          t(`Drag the shape with ${sides} sides.`, `Arrastra la figura con ${sides} lados.`, `Arraste a figura com ${sides} lados.`, `Glisse la figure avec ${sides} côtés.`, `拖动有${sides}条边的图形。`, `${sides} भुजाओं वाली आकृति खींचो।`, `اسحب الشكل الذي له ${sides} أضلاع.`),
          t(`Yes! ${answer}.`, `¡Sí! ${shapeWithArticle(answer)}.`, `Sim! ${shapeWithArticle(answer)}.`, `Oui ! ${answer}.`, `对！${answer}。`, `हाँ! ${shapeWord(answer)}।`, `نعم! ${shapeWord(answer)}.`),
        ),
      };
    }
    if (safe === "symmetry") {
      const rows = [
        ["square", "4 lines of symmetry"],
        ["rectangle", "2 lines of symmetry"],
        ["triangle", "3 lines of symmetry"],
      ] as const;
      const row = rng.pick(rows);
      return {
        kind: "shapes" as const,
        mode: "symmetry" as const,
        answer: row[0],
        prompt: t(row[1], symmetryClue(row[1])),
        options: withAnswer(
          rows.map((item) => item[0]),
          row[0],
          rng,
        ),
        ...base(
          "shapes",
          safe,
          row[0],
          t(`Drag the shape with ${row[1]}.`, `Arrastra la figura con ${symmetryClue(row[1])}.`, `Arraste a figura com ${symmetryClue(row[1])}.`, `Glisse la figure avec ${symmetryClue(row[1])}.`, `拖动有${row[1]}的图形。`, `${symmetryClue(row[1])} वाली आकृति खींचो।`, `اسحب الشكل الذي له ${symmetryClue(row[1])}.`),
          t(`Yes! ${row[0]}.`, `¡Sí! ${shapeWithArticle(row[0])}.`, `Sim! ${shapeWithArticle(row[0])}.`, `Oui ! ${shapeWithArticle(row[0])}.`, `对！${row[0]}。`, `हाँ! ${shapeWord(row[0])}।`, `نعم! ${shapeWord(row[0])}.`),
        ),
      };
    }
    const solid = safe === "solid";
    const pool = solid ? SOLID_SHAPES : FLAT_SHAPES;
    const answer = rng.pick([...pool]);
    return {
      kind: "shapes" as const,
      mode: "name" as const,
      answer,
      prompt: shapeWord(answer),
      options: withAnswer(pool, answer, rng),
      ...base(
        "shapes",
        safe,
        answer,
        t(`Drag the ${answer}.`, `Arrastra ${shapeWithArticle(answer)}.`, `Arraste ${shapeWithArticle(answer)}.`, `Glisse ${partPhrase(answer)}.`, `拖动${answer}。`, `${shapeWord(answer)} खींचो।`, `اسحب ${shapeWord(answer)}.`),
        t(`Yes! ${answer}.`, `¡Sí! ${shapeWithArticle(answer)}.`, `Sim! ${shapeWithArticle(answer)}.`, `Oui ! ${answer}.`, `对！${answer}。`, `हाँ! ${shapeWord(answer)}।`, `نعم! ${shapeWord(answer)}.`),
      ),
    };
  }, (task) => task.factKey);
}

function storyDecoy(a: number, b: number): number {
  const used = new Set([a, b]);
  for (const n of [1, 2, 3, 4, 5]) {
    if (!used.has(n)) return n;
  }
  return a === 1 ? 2 : 1;
}

function makeStoryTask(level: string, rng: Rng, avoid?: string): StoryTask {
  const safe = isProblemLevel(level) ? level : "add";
  return fresh(avoid, () => {
    const star = rng.pick([...STORY_STARS]);
    const thing = rng.pick([...THINGS]);
    const items = (n: number) => thingName(thing.name, n, countName(thing.name, n));
    if (safe === "sub") {
      const a = rng.int(2, 8);
      const b = rng.int(1, a);
      const speech = t(
        `${star.name} has ${a} ${items(a)} and gives ${b} away. Drag ${b} out of the story.`,
        `${star.name} tiene ${a} ${items(a)} y regala ${b}. Arrastra ${b} fuera de la historia.`, `${star.name} tem ${a} ${items(a)} e dá de presente ${b}. Arraste ${b} para fora da história.`,
      `${star.name} a ${a} ${items(a)} et en donne ${b}. Glisse ${b} hors de l'histoire.`, `${star.name}有${countedNoun(thing.name, a)}，送出${countedNoun(thing.name, b)}。把${countedNoun(thing.name, b)}拖出故事。`, `${star.name} के पास ${a} ${items(a)} हैं और ${b} दे देता है। कहानी में से ${b} खींचो।`, `لدى ${star.name} ${a} ${items(a)} ويعطي ${b} منها. اسحب ${b} خارج القصة.`);
      return {
        kind: "story" as const,
        mode: "take" as const,
        a,
        b,
        thing: thing.name,
        emoji: thing.emoji,
        decoy: 0,
        pieces: [],
        ...base("problems", safe, `sub:${a}:${b}`, speech, t(`Yes! ${a - b} left.`, `¡Sí! Quedan ${a - b}.`, `Sim! Sobram ${a - b}.`, `Oui ! Il en reste ${a - b}.`, `对！还剩${a - b}个。`, `हाँ! ${a - b} बचे।`, `نعم! تبقّى ${a - b}.`)),
      };
    }
    if (safe === "div") {
      const b = rng.int(2, 3);
      const each = rng.int(1, 4);
      const a = b * each;
      const speech = t(
        `${star.name} shares ${a} ${items(a)} into ${b} equal groups. Drag them in.`,
        `${star.name} reparte ${a} ${items(a)} en ${b} grupos iguales. Arrástralos.`, `${star.name} reparte ${a} ${items(a)} em ${b} grupos iguais. Arraste.`,
      `${star.name} partage ${a} ${items(a)} en ${b} groupes égaux. Glisse-les.`, `${star.name}把${countedNoun(thing.name, a)}分成${b}个一样多的组。把它们拖进去。`, `${star.name} ${a} ${items(a)} को ${b} बराबर समूहों में बाँटता है। उन्हें अंदर खींचो।`, `${star.name} يوزّع ${a} ${items(a)} على ${b} مجموعات متساوية. اسحبها إلى الداخل.`);
      return {
        kind: "story" as const,
        mode: "share" as const,
        a,
        b,
        thing: thing.name,
        emoji: thing.emoji,
        decoy: 0,
        pieces: [],
        ...base("problems", safe, `div:${a}:${b}`, speech, t(`Yes! ${each} in each group.`, `¡Sí! ${each} en cada grupo.`, `Sim! ${each} em cada grupo.`, `Oui ! ${each} dans chaque groupe.`, `对！每组${each}个。`, `हाँ! हर समूह में ${each}।`, `نعم! ${each} في كل مجموعة.`)),
      };
    }
    if (safe === "mult" || safe === "picture" || safe === "steps") {
      const a = rng.int(1, 4);
      const b = rng.int(1, 4);
      const decoy = b >= 4 ? b - 1 : b + 1;
      const speech = t(
        `${star.name} needs ${a} groups of ${b} ${items(b)}. Drag the groups in.`,
        `${star.name} necesita ${a} grupos de ${b} ${items(b)}. Arrastra los grupos.`, `${star.name} precisa de ${a} grupos de ${b} ${items(b)}. Arraste os grupos.`,
      `${star.name} a besoin de ${a} groupes de ${b} ${items(b)}. Glisse les groupes.`, `${star.name}需要${a}组，每组${countedNoun(thing.name, b)}。把这些组拖进去。`, `${star.name} को ${b} ${items(b)} के ${a} समूह चाहिए। समूह अंदर खींचो।`, `${star.name} يحتاج إلى ${a} مجموعات من ${b} ${items(b)}. اسحب المجموعات إلى الداخل.`);
      return {
        kind: "story" as const,
        mode: "groups" as const,
        a,
        b,
        thing: thing.name,
        emoji: thing.emoji,
        decoy,
        pieces: [],
        ...base("problems", safe, `grp:${a}:${b}`, speech, t(`Yes! ${a * b}.`, `¡Sí! ${a * b}.`, `Sim! ${a * b}.`, `Oui ! ${a * b}.`, `对！${a * b}。`, `हाँ! ${a * b}।`, `نعم! ${a * b}.`)),
      };
    }
    const a = rng.int(1, 5);
    const b = rng.int(1, Math.max(1, 8 - a));
    const decoy = storyDecoy(a, b);
    const pieces = rng.shuffle([
      { id: "g1", size: a },
      { id: "g2", size: b },
      { id: "gx", size: decoy },
    ]);
    const speech = t(
      `${star.name} has ${a} ${items(a)}. ${star.pal} brings ${b}. Drag both groups in.`,
      `${star.name} tiene ${a} ${items(a)}. ${star.pal} trae ${b}. Arrastra los dos grupos.`, `${star.name} tem ${a} ${items(a)}. ${star.pal} traz ${b}. Arraste os dois grupos.`,
    `${star.name} a ${a} ${items(a)}. ${star.pal} apporte ${b}. Glisse les deux groupes.`, `${star.name}有${countedNoun(thing.name, a)}。${star.pal}拿来${countedNoun(thing.name, b)}。把两组都拖进去。`, `${star.name} के पास ${a} ${items(a)} हैं। ${star.pal} ${b} लाता है। दोनों समूह खींचो।`, `لدى ${star.name} ${a} ${items(a)}. ${star.pal} يحضر ${b}. اسحب المجموعتين إلى الداخل.`);
    return {
      kind: "story" as const,
      mode: "join" as const,
      a,
      b,
      thing: thing.name,
      emoji: thing.emoji,
      decoy,
      pieces,
      ...base("problems", safe, `add:${a}:${b}`, speech, t(`Yes! ${a + b}.`, `¡Sí! ${a + b}.`, `Sim! ${a + b}.`, `Oui ! ${a + b}.`, `对！${a + b}。`, `हाँ! ${a + b}।`, `نعم! ${a + b}.`)),
    };
  }, (task) => task.factKey);
}

export function blankMatches(task: BlankTask, placed: number | null): boolean {
  return placed === task.answer;
}

function makeBlankTask(level: string, rng: Rng, avoid?: string): BlankTask {
  const safe: VariableLevel = isVariableLevel(level) ? level : "addend";
  return fresh(
    avoid,
    () => {
      const board = rollVariable(rng, safe);
      const answer = variableAnswer(board);
      return {
        kind: "blank" as const,
        mode: safe,
        op: board.op,
        extraOp: board.extraOp,
        a: board.a,
        b: board.b,
        c: board.c,
        box: board.box,
        answer,
        tiles: fourChoices(rng, answer, [answer - 1, answer + 1, answer + 2]).map(Number),
        ...base("variables", safe, variableKey(board), t("Tap the missing number!", "¡Toca el número que falta!"), praiseFor(board)),
      };
    },
    (task) => task.factKey,
  );
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function makeNumeralTrace(level: string, rng: Rng, avoid?: string): TraceTask {
  return fresh(
    avoid,
    () => {
      const glyph = rng.pick([...DIGITS]);
      return {
        kind: "trace" as const,
        glyph,
        form: "numeral" as const,
        ...base("count", level, `num:${glyph}`, traceSpeech("numeral"), tracePraise()),
      };
    },
    (task) => task.factKey,
  );
}

function makeLetterTrace(level: string, rng: Rng, avoid?: string): TraceTask {
  return fresh(
    avoid,
    () => {
      const upper = rng.next() < 0.5;
      const glyph = upper ? rng.pick(LETTERS) : rng.pick(LETTERS).toLowerCase();
      const form = upper ? ("upper" as const) : ("lower" as const);
      return {
        kind: "trace" as const,
        glyph,
        form,
        ...base("phonics", level, `let:${glyph}`, traceSpeech(form), tracePraise()),
      };
    },
    (task) => task.factKey,
  );
}

export function makeBuildTask(game: string, level: string, rng: Rng, avoid?: string, kind?: BuildTask["kind"]): BuildTask {
  switch (game) {
    case "times":
      return makeArrayTask(level, rng, avoid);
    case "add":
      return makeFrameTask(level, rng, avoid);
    case "count":
      if (level === "objects" && (kind === "trace" || (kind !== "count" && rng.next() < 0.55))) return makeNumeralTrace(level, rng, avoid);
      return makeCountTask(level, rng, avoid);
    case "place":
      return makeBlocksTask(level, rng, avoid);
    case "fractions":
      return makeShadeTask(level, rng, avoid);
    case "spelling":
      return makeLetterTask(level, rng, avoid);
    case "sight":
      return makeSightTask(level, rng, avoid);
    case "phonics":
      if (
        (level === "letters" || level === "sounds" || level === "begin") &&
        (kind === "trace" || (kind !== "phonics" && rng.next() < 0.55))
      )
        return makeLetterTrace(level, rng, avoid);
      return makePhonicsTask(level, rng, avoid);
    case "measure":
      return makeMeasureTask(level, rng, avoid);
    case "shapes":
      return makeShapeTask(level, rng, avoid);
    case "problems":
      return makeStoryTask(level, rng, avoid);
    case "variables":
      return makeBlankTask(level, rng, avoid);
    case "graphs":
      return makeGraphsTask(level, rng, avoid);
    case "share":
      return makeShareTask(level, rng, avoid);
    case "grid":
      return makeGridTask(level, rng, avoid);
    case "patterns":
      return makePatternTask(level, rng, avoid);
    default:
      throw new Error(`No hands-on card for ${game}`);
  }
}

export function makeHandsTask(game: string, level: string, rng: Rng, avoid?: string, prefer: readonly string[] = []): HandsTask {
  if (game === "time") return makeClockTask(level, rng, avoid, prefer);
  if (game === "money") return makePayTask(level, rng, avoid);
  return makeBuildTask(game, level, rng, avoid);
}

function frameQuestion(task: FrameTask): ChoiceQ {
  const pink = task.op === "+" ? task.start : task.target;
  const solved =
    task.op === "+" ? `${task.start} + ${task.change} = ${task.target}` : `${task.start} ${MINUS} ${task.change} = ${task.target}`;
  return {
    id: `frame-${task.factKey}`,
    game: "add",
    title: task.speech,
    hint: "Drag the counters",
    praise: task.praise,
    almost: solved,
    answer: String(task.target),
    choices: [],
    skill: task.skill,
    tags: [],
    factKey: task.factKey,
    visual: {
      kind: "add",
      op: task.op,
      left: task.start,
      right: task.change,
      result: task.target,
      pink,
      teal: task.change,
      max: task.cells,
      hidden: task.target,
      solved,
    },
  };
}

function arrayQuestion(task: ArrayTask): ChoiceQ {
  const product = task.rows * task.cols;
  const solved = `${task.rows} × ${task.cols} = ${product}`;
  return {
    id: `array-${task.factKey}`,
    game: "times",
    title: task.speech,
    hint: "Drag the rows",
    praise: task.praise,
    almost: solved,
    answer: String(product),
    choices: [],
    skill: task.skill,
    tags: [],
    factKey: task.factKey,
    visual: { kind: "times", a: task.rows, b: task.cols, hidden: product, solved },
  };
}

function modeled(frames: { art: ModelArt; caption: string }[]): WorkedExample {
  const mapped = frames.map((frame) => ({ kind: "model" as const, art: frame.art, caption: frame.caption }));
  const caption = mapped[mapped.length - 1]?.caption ?? "";
  return { speech: frames.map((frame) => frame.caption).join(". "), caption, frames: mapped };
}

export function handsExample(task: BuildTask): WorkedExample {
  switch (task.kind) {
    case "array":
      return workedExample(arrayQuestion(task));
    case "frame":
      if (task.model === "ten") return workedExample(frameQuestion(task));
      return modeled([
        {
          art: { type: "blocks", ...blocksOf(task.start), hundreds: 0 },
          caption: `Start with ${task.start}`,
        },
        {
          art: { type: "blocks", ...blocksOf(task.target), hundreds: 0 },
          caption: task.op === "+" ? `${task.start} + ${task.change} = ${task.target}` : `${task.start} minus ${task.change} = ${task.target}`,
        },
      ]);
    case "count":
      return modeled([
        {
          art: { type: "counters", n: task.target, frame: task.mode === "ten" },
          caption: task.speech.replace(/\.$/, "") + `. That is ${task.target}.`,
        },
      ]);
    case "blocks":
      return modeled([
        {
          art: { type: "blocks", hundreds: task.hundreds, tens: task.tens, ones: task.ones },
          caption:
            task.hundreds > 0
              ? `${task.hundreds} ${task.hundreds === 1 ? "hundred" : "hundreds"}`
              : blockPhrase(task.tens * 10 + task.ones),
        },
      ]);
    case "shade":
      return modeled([
        { art: { type: "shade", num: task.num, den: task.den }, caption: `Shade ${fractionPhrase(task.num, task.den)}` },
      ]);
    case "letters":
      return modeled([{ art: { type: "word", text: task.word }, caption: task.word }]);
    case "sight":
      return modeled([{ art: { type: "word", text: task.word }, caption: task.word }]);
    case "phonics":
      return modeled([
        {
          art: { type: "word", text: task.mode === "blend" ? task.answer : task.mode === "end" ? `${task.prompt}${task.answer}` : task.answer },
          caption: task.praise.replace(/^(?:Yes!|¡Sí!)\s*/, ""),
        },
      ]);
    case "measure":
      return modeled([
        {
          art: task.mode === "ruler" ? { type: "ruler", inches: task.target } : { type: "bars", count: task.target, emoji: task.emoji },
          caption: task.mode === "ruler" ? `${task.target} inches` : `${task.target}`,
        },
      ]);
    case "shapes":
      if (task.mode === "grid") {
        return modeled([
          {
            art: { type: "grid", rows: task.rows ?? 2, cols: task.cols ?? 2 },
            caption: task.answer,
          },
        ]);
      }
      if (task.prompt.startsWith("geo:")) {
        return modeled([{ art: { type: "shape", name: task.prompt, part: false }, caption: task.answer }]);
      }
      return modeled([
        {
          art: { type: "shape", name: task.answer, part: task.mode === "parts" },
          caption: task.answer,
        },
      ]);
    case "story": {
      const sizes =
        task.mode === "join"
          ? [task.a, task.b]
          : task.mode === "groups"
            ? Array.from({ length: task.a }, () => task.b)
            : task.mode === "share"
              ? Array.from({ length: task.b }, () => task.a / task.b)
              : [task.a - task.b];
      return modeled([{ art: { type: "groups", sizes }, caption: task.praise.replace(/^(?:Yes!|¡Sí!)\s*/, "") }]);
    }
    case "trace":
      return modeled([{ art: { type: "word", text: task.glyph }, caption: task.praise }]);
    case "graphs": {
      const total =
        task.mode === "line"
          ? task.stacks.reduce((sum, count) => sum + count, 0)
          : task.cats.reduce((sum, cat) => sum + cat.icons, 0);
      return modeled([
        {
          art: { type: "bars", count: Math.max(1, Math.min(total, 8)), emoji: task.cats[0]?.emoji ?? "●" },
          caption: task.speech.replace(/\.$/, ""),
        },
      ]);
    }
    case "share":
      return modeled([
        {
          art: { type: "groups", sizes: Array.from({ length: task.plates }, () => task.each) },
          caption: task.speech.replace(/\.$/, ""),
        },
      ]);
    case "grid":
      return modeled([
        {
          art: { type: "grid", rows: Math.max(1, task.rows), cols: Math.max(1, task.cols) },
          caption: task.speech.replace(/\.$/, ""),
        },
      ]);
    case "pattern":
      return modeled([
        {
          art: { type: "counters", n: Math.max(1, Math.min(task.terms.length, 8)), frame: false },
          caption: task.speech.replace(/\.$/, ""),
        },
      ]);
    case "blank": {
      const groups =
        task.op === "×"
          ? Array.from({ length: Math.max(1, Math.min(task.a, 5)) }, () => Math.max(1, Math.min(task.b, 5)))
          : task.op === "÷"
            ? Array.from(
                { length: Math.max(1, Math.min(task.b, 5)) },
                () => Math.max(1, Math.min(Math.floor(task.a / Math.max(task.b, 1)), 5)),
              )
            : null;
      return modeled(
        variableCaptions(task).map((caption) => ({
          art: groups
            ? { type: "groups" as const, sizes: groups }
            : { type: "counters" as const, n: Math.max(1, Math.min(task.answer, 10)), frame: task.mode === "addend" },
          caption,
        })),
      );
    }
    default: {
      const neverTask: never = task;
      return neverTask;
    }
  }
}
