import { coinAsA, getLocale, spanishFraction, t } from "./i18n";
import type { Board, CountBoard, FractionBoard, MeasureBoard, PhonicsBoard, PlaceBoard, ProblemBoard, ShapeBoard } from "./games/boards";
import { variableCaptions } from "./games/variables";
import { COIN_CENTS, COIN_NAME, emptyPile, formatCents, pileCents } from "./games/money-model";
import { timeTalk } from "./games/time";
import type { AddVisual, ChoiceQ, CoinKind, CoinPile, MoneyVisual, TimeVisual, TimesVisual } from "./games/types";

export interface AddFrame {
  kind: "add";
  pink: number;
  teal: number;
  tealShown: number;
  crossed: number;
  op: "+" | "-";
  tenFilled: number | null;
  blocks: boolean;
  line: { from: number; to: number; max: number } | null;
  caption: string;
}

export interface TimesFrame {
  kind: "times";
  rows: number;
  cols: number;
  shownRows: number;
  caption: string;
}

export interface TimeFrame {
  kind: "time";
  hours: number;
  minutes: number;
  handMinutes: number;
  caption: string;
}

export interface MoneyFrame {
  kind: "money";
  coins: CoinKind[];
  runningCents: number;
  caption: string;
}

export interface WordFrame {
  kind: "sight" | "spell";
  show: string;
  caption: string;
}

export interface SceneFrame {
  kind: "scene";
  show: string;
  caption: string;
}

export type ModelArt =
  | { type: "blocks"; hundreds: number; tens: number; ones: number }
  | { type: "counters"; n: number; frame: boolean }
  | { type: "shade"; num: number; den: number }
  | { type: "word"; text: string }
  | { type: "ruler"; inches: number }
  | { type: "bars"; count: number; emoji: string }
  | { type: "shape"; name: string; part: boolean }
  | { type: "groups"; sizes: number[] };

export interface ModelFrame {
  kind: "model";
  art: ModelArt;
  caption: string;
}

export type TeachFrame = AddFrame | TimesFrame | TimeFrame | MoneyFrame | WordFrame | SceneFrame | ModelFrame;

export interface WorkedExample {
  speech: string;
  caption: string;
  frames: TeachFrame[];
}

const COIN_ORDER: CoinKind[] = ["dollar", "quarter", "dime", "nickel", "penny"];

const NUMBER_WORD = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

const FRACTION_WORD: Record<string, [string, string]> = {
  "2": ["half", "halves"],
  "3": ["third", "thirds"],
  "4": ["fourth", "fourths"],
  "5": ["fifth", "fifths"],
  "6": ["sixth", "sixths"],
  "8": ["eighth", "eighths"],
  "10": ["tenth", "tenths"],
  "12": ["twelfth", "twelfths"],
};

/** "1/2" is spoken as "one half", so a voice does not say "slash". */
function speakFractions(text: string): string {
  return text.replace(/\b(\d+)\/(\d+)\b/g, (full, numText: string, denText: string) => {
    const num = Number(numText);
    const den = Number(denText);
    if (getLocale() === "es") return spanishFraction(num, den);
    const pair = FRACTION_WORD[denText];
    if (!pair) return full;
    const numWord = NUMBER_WORD[num] ?? numText;
    return `${numWord} ${num === 1 ? pair[0] : pair[1]}`;
  });
}

export function speakable(text: string): string {
  const fractions = speakFractions(text);
  if (getLocale() === "es") {
    return fractions
      .replace(/×/g, " por ")
      .replace(/−/g, " menos ")
      .replace(/\+/g, " más ")
      .replace(/=/g, " igual ")
      .replace(/(\d+)¢/g, (_full, n: string) => (Number(n) === 1 ? "1 centavo" : `${n} centavos`))
      .replace(/¢/g, " centavos")
      .replace(/\$(\d+)/g, (_full, n: string) => (Number(n) === 1 ? "1 dólar" : `${n} dólares`));
  }
  return fractions
    .replace(/×/g, " times ")
    .replace(/−/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/=/g, " equals ")
    .replace(/¢/g, " cents")
    .replace(/\$(\d+)/g, "$1 dollars");
}

export function hintCue(question: ChoiceQ): { speech: string; caption: string } {
  const caption = question.hint.trim() || t("Look at the picture.", "Mira el dibujo.");
  return { speech: speakable(caption), caption };
}

export function choiceSpoken(question: ChoiceQ, choice: string): string {
  if (question.visual.kind === "money" && question.visual.labels?.[choice]) return question.visual.labels[choice];
  if (question.visual.kind === "scene") {
    if (question.visual.quietChoices) return "";
    return question.visual.labels[choice] ?? choice;
  }
  return choice;
}

/** Title plus each choice, so a child who cannot read can still pick by ear. */
export function promptSpeech(question: ChoiceQ): string {
  const visual = question.visual;
  if (visual.kind === "spell") {
    const heard = speakable(visual.spoken);
    return t(heard, `Deletrea la palabra. ${heard}`);
  }
  if (visual.kind === "sight") {
    if (visual.mode === "fill") {
      const heard = question.choices.map((choice) => speakable(choice).trim()).filter((line) => line.length > 0);
      const sentence = speakable(visual.spoken);
      const en = heard.length ? `Listen. ${sentence}. ${heard.join(". ")}` : `Listen. ${sentence}.`;
      const es = heard.length ? `Escucha. ${sentence}. ${heard.join(". ")}` : `Escucha. ${sentence}.`;
      return t(en, es);
    }
    return t(`Listen. ${visual.word}.`, `Escucha. ${visual.word}.`);
  }
  if (visual.kind === "scene" && visual.board.game === "phonics" && visual.board.mode === "cvc") {
    return speakable(`${question.title}. ${visual.board.blend}`);
  }
  const title = speakable(question.title).trim();
  const lead = /[.!?]$/.test(title) ? title : `${title}.`;
  if (question.choices.length === 0) return lead;
  const heard = question.choices
    .map((choice) => speakable(choiceSpoken(question, choice)).trim())
    .filter((line) => line.length > 0);
  if (heard.length === 0) return lead;
  return `${lead} ${heard.join(". ")}`;
}

export function workedExample(question: ChoiceQ): WorkedExample {
  const frames = framesFor(question);
  const caption = frames[frames.length - 1]?.caption ?? question.almost;
  const bits = frames.length > 0 && frames.length <= 4 ? frames.map((frame) => frame.caption) : [caption];
  return { speech: speakable(bits.join(". ")), caption, frames };
}

function framesFor(question: ChoiceQ): TeachFrame[] {
  const visual = question.visual;
  switch (visual.kind) {
    case "add":
      return addFrames(visual);
    case "times":
      return timesFrames(visual);
    case "time":
      return timeFrames(visual);
    case "money":
      return moneyFrames(visual, question.answer);
    case "sight":
      return [
        {
          kind: "sight",
          show: visual.word,
          caption: visual.mode === "hear" ? t(`The word is ${visual.word}.`, `La palabra es ${visual.word}.`) : visual.sentence || visual.word,
        },
      ];
    case "spell":
      return [
        {
          kind: "spell",
          show: visual.word,
          caption: visual.sentence ? `${visual.word}. ${visual.sentence}` : visual.word,
        },
      ];
    case "scene":
      return sceneFrames(question, visual.board);
    default: {
      const neverVisual: never = visual;
      return neverVisual;
    }
  }
}

function lineMax(total: number): number {
  if (total <= 10) return 10;
  if (total <= 20) return 20;
  return Math.min(100, Math.max(10, Math.ceil(Math.max(total, 1) / 10) * 10));
}

function addFrames(visual: AddVisual): AddFrame[] {
  const total = visual.pink + visual.teal;
  const max = lineMax(Math.max(total, visual.max <= 20 ? visual.max : total));
  const ten = total <= 10;
  const blocks = total > 20;
  const line = total <= 100;
  if (visual.op === "+") {
    const frames: AddFrame[] = [
      addFrame(visual, 0, 0, ten ? visual.pink : null, blocks, line ? { from: visual.pink, to: visual.pink, max } : null, t(`Start with ${visual.pink}`, `Empieza con ${visual.pink}`)),
    ];
    if (visual.teal > 1 && visual.teal <= 4) {
      frames.push(
        addFrame(
          visual,
          1,
          0,
          ten ? visual.pink + 1 : null,
          blocks,
          line ? { from: visual.pink, to: visual.pink + 1, max } : null,
          t("Add 1", "Suma 1"),
        ),
      );
    }
    frames.push(
      addFrame(
        visual,
        visual.teal,
        0,
        ten ? total : null,
        blocks,
        line ? { from: visual.pink, to: total, max } : null,
        visual.solved,
      ),
    );
    return frames;
  }
  const frames: AddFrame[] = [
    addFrame(visual, visual.teal, 0, ten ? total : null, blocks, line ? { from: total, to: total, max } : null, t(`Start with ${total}`, `Empieza con ${total}`)),
  ];
  if (visual.teal > 1 && visual.teal <= 4) {
    frames.push(
      addFrame(
        visual,
        visual.teal,
        1,
        ten ? total - 1 : null,
        blocks,
        line ? { from: total, to: total - 1, max } : null,
        t("Take away 1", "Quita 1"),
      ),
    );
  }
  frames.push(
    addFrame(
      visual,
      visual.teal,
      visual.teal,
      ten ? visual.pink : null,
      blocks,
      line ? { from: total, to: visual.pink, max } : null,
      visual.solved,
    ),
  );
  return frames;
}

function addFrame(
  visual: AddVisual,
  tealShown: number,
  crossed: number,
  tenFilled: number | null,
  blocks: boolean,
  line: { from: number; to: number; max: number } | null,
  caption: string,
): AddFrame {
  return {
    kind: "add",
    pink: visual.pink,
    teal: visual.teal,
    tealShown,
    crossed,
    op: visual.op,
    tenFilled,
    blocks,
    line,
    caption,
  };
}

function timesFrames(visual: TimesVisual): TimesFrame[] {
  const rows = Math.max(1, visual.a);
  const steps = Math.min(rows, 4);
  const frames: TimesFrame[] = [];
  for (let i = 1; i <= steps; i++) {
    const shown = i === steps ? rows : i;
    frames.push({
      kind: "times",
      rows,
      cols: visual.b,
      shownRows: shown,
      caption: shown === rows ? visual.solved : t(`${shown} ${shown === 1 ? "group" : "groups"} of ${visual.b}`, `${shown} ${shown === 1 ? "grupo" : "grupos"} de ${visual.b}`),
    });
  }
  return frames;
}

function timeFrames(visual: TimeVisual): TimeFrame[] {
  const phrase = timeTalk(visual.hours, visual.minutes);
  if (visual.minutes === 0) {
    return [
      { kind: "time", hours: visual.hours, minutes: 0, handMinutes: 0, caption: t("The long hand is on 12", "La manecilla larga está en el 12") },
      { kind: "time", hours: visual.hours, minutes: 0, handMinutes: 0, caption: phrase },
    ];
  }
  const mid = Math.round(visual.minutes / 2);
  return [
    { kind: "time", hours: visual.hours, minutes: visual.minutes, handMinutes: 0, caption: t("The long hand starts at 12", "La manecilla larga empieza en el 12") },
    { kind: "time", hours: visual.hours, minutes: visual.minutes, handMinutes: mid, caption: t("The long hand moves", "La manecilla larga se mueve") },
    { kind: "time", hours: visual.hours, minutes: visual.minutes, handMinutes: visual.minutes, caption: phrase },
  ];
}

export function greedyCoins(cents: number): CoinKind[] {
  const out: CoinKind[] = [];
  let left = Math.max(0, Math.floor(cents));
  for (const kind of COIN_ORDER) {
    const value = COIN_CENTS[kind];
    while (left >= value) {
      out.push(kind);
      left -= value;
    }
  }
  return out;
}

function coinsOf(pile: CoinPile): CoinKind[] {
  const out: CoinKind[] = [];
  for (const kind of COIN_ORDER) {
    for (let i = 0; i < pile[kind]; i++) out.push(kind);
  }
  return out;
}

function runningFrames(coins: CoinKind[], finalCaption: string): MoneyFrame[] {
  if (coins.length === 0) return [{ kind: "money", coins: [], runningCents: 0, caption: finalCaption }];
  const frames: MoneyFrame[] = [];
  const shown: CoinKind[] = [];
  let running = 0;
  const step = coins.length > 4 ? Math.ceil(coins.length / 3) : 1;
  for (let i = 0; i < coins.length; i++) {
    const kind = coins[i]!;
    shown.push(kind);
    running += COIN_CENTS[kind];
    if ((i + 1) % step === 0 || i === coins.length - 1) {
      frames.push({
        kind: "money",
        coins: [...shown],
        runningCents: running,
        caption: i === coins.length - 1 ? finalCaption : t(`${formatCents(running)} so far`, `van ${formatCents(running)}`),
      });
    }
  }
  return frames;
}

function moneyFrames(visual: MoneyVisual, answer: string): MoneyFrame[] {
  switch (visual.mode) {
    case "name": {
      const coins = coinsOf(visual.coins);
      const kind = coins[0] ?? "penny";
      const cents = COIN_CENTS[kind];
      return [
        {
          kind: "money",
          coins: [kind],
          runningCents: cents,
          caption: t(
            `A ${COIN_NAME[kind].toLowerCase()} is ${formatCents(cents)}`,
            `${coinAsA(kind, COIN_NAME[kind].toLowerCase()).replace(/^./, (ch) => ch.toUpperCase())} vale ${formatCents(cents)}`,
          ),
        },
      ];
    }
    case "make": {
      const pile = visual.piles?.[answer] ?? emptyPile();
      const total = visual.priceCents ?? pileCents(pile);
      return runningFrames(coinsOf(pile), `${formatCents(total)}`);
    }
    case "change": {
      const paid = pileCents(visual.coins);
      const price = visual.priceCents ?? 0;
      const change = Math.max(0, paid - price);
      return [
        { kind: "money", coins: coinsOf(visual.coins), runningCents: paid, caption: t(`You pay ${formatCents(paid)}`, `Pagas ${formatCents(paid)}`) },
        { kind: "money", coins: [], runningCents: price, caption: t(`The price is ${formatCents(price)}`, `El precio es ${formatCents(price)}`) },
        { kind: "money", coins: greedyCoins(change), runningCents: change, caption: t(`Change is ${formatCents(change)}`, `El cambio es ${formatCents(change)}`) },
      ];
    }
    case "count":
    case "dollars":
      return runningFrames(coinsOf(visual.coins), formatCents(pileCents(visual.coins)));
    case "spend": {
      const price = visual.priceCents ?? 0;
      const paid = pileCents(visual.coins);
      if (paid > price && paid > 0) {
        return [
          { kind: "money", coins: [], runningCents: price, caption: t(`The prices add to ${formatCents(price)}`, `Los precios suman ${formatCents(price)}`) },
          { kind: "money", coins: coinsOf(visual.coins), runningCents: paid, caption: t(`You pay ${formatCents(paid)}`, `Pagas ${formatCents(paid)}`) },
          { kind: "money", coins: [], runningCents: paid - price, caption: t(`Change is ${formatCents(paid - price)}`, `El cambio es ${formatCents(paid - price)}`) },
        ];
      }
      return [{ kind: "money", coins: [], runningCents: price, caption: t(`The prices add to ${formatCents(price)}`, `Los precios suman ${formatCents(price)}`) }];
    }
    default: {
      const neverMode: never = visual.mode;
      return neverMode;
    }
  }
}

function captions(lines: string[]): SceneFrame[] {
  return lines.map((caption) => ({ kind: "scene", show: caption, caption }));
}

function solvedLine(question: ChoiceQ): string {
  const almost = question.almost.replace(/^(?:Almost!|¡Casi!)\s*/, "").trim();
  if (almost) return almost;
  return question.praise.replace(/^(?:Yes!|¡Sí!)\s*/, "").trim() || question.answer;
}

function countSteps(n: number, solved: string): SceneFrame[] {
  const marks: string[] = [];
  if (n <= 5) {
    for (let i = 1; i <= Math.max(1, n); i++) marks.push(String(i));
  } else {
    marks.push("1, 2, 3");
    const mid = Math.min(n - 1, 10);
    if (mid > 3) marks.push(t(`Count to ${mid}`, `Cuenta hasta ${mid}`));
  }
  if (marks[marks.length - 1] !== solved) marks.push(solved);
  return captions(marks);
}

function countTeach(board: CountBoard, solved: string): SceneFrame[] {
  switch (board.mode) {
    case "objects":
    case "to20":
      return countSteps(board.n, solved);
    case "compare":
      return captions([t("Look at each group", "Mira cada grupo"), solved]);
    case "neighbor":
      return captions([
        board.ask === "before"
          ? t(`One less than ${board.n}`, `Uno menos que ${board.n}`)
          : t(`One more than ${board.n}`, `Uno más que ${board.n}`),
        solved,
      ]);
    case "subitize":
      return captions([t("See the dot groups", "Mira los grupos de puntos"), solved]);
    case "tenframe": {
      const total = board.frames.reduce((sum, n) => sum + n, 0);
      return captions([
        total >= 10 ? t("A full ten-frame is 10", "Un tablero de diez lleno es 10") : t("Count the dots in the frame", "Cuenta los puntos del tablero"),
        solved,
      ]);
    }
    case "build":
      return captions([t(`Fill the frame to ${board.n}`, `Llena el tablero hasta ${board.n}`), solved]);
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

function placeTeach(board: PlaceBoard, solved: string): SceneFrame[] {
  switch (board.mode) {
    case "blocks":
    case "build":
      return captions([
        t(`${Math.floor(board.n / 10)} tens`, `${Math.floor(board.n / 10)} decenas`),
        t(`${board.n % 10} ones`, `${board.n % 10} unidades`),
        solved,
      ]);
    case "expanded":
      return captions([t("Hundreds, then tens, then ones", "Centenas, luego decenas, luego unidades"), solved]);
    case "compare":
      return captions([t("Look at the biggest place first", "Mira primero el lugar más grande"), solved]);
    case "round10":
      return captions([t("5 or more in the ones rounds up", "5 o más en las unidades sube"), solved]);
    case "round100":
      return captions([t("50 or more in the tens rounds up", "50 o más en las decenas sube"), solved]);
    case "big":
      return captions([t("Find the place, then multiply", "Encuentra el lugar y luego multiplica"), solved]);
    case "roundBig":
      return captions([t("Look at the digit to the right", "Mira el dígito de la derecha"), solved]);
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

function shapeTeach(board: ShapeBoard, solved: string): SceneFrame[] {
  switch (board.mode) {
    case "flat":
    case "solid":
      return captions([
        board.mode === "flat"
          ? t("A flat shape sits on the page", "Una figura plana se queda en la hoja")
          : t("A solid shape you could hold", "Un cuerpo que puedes sostener"),
        solved,
      ]);
    case "sides":
      return captions([t("Count around the shape", "Cuenta alrededor de la figura"), solved]);
    case "symmetry":
      return captions([t("A line of symmetry makes two matching halves", "Una línea de simetría hace dos mitades iguales"), solved]);
    case "parts":
      return captions([t("Equal parts are the same size", "Las partes iguales tienen el mismo tamaño"), solved]);
    case "color":
      return captions([t("Look at the color", "Mira el color"), solved]);
    case "match":
      return captions([t("Find the same shape", "Busca la misma figura"), solved]);
    case "pattern":
      return captions([t("Say the pattern", "Di el patrón"), solved]);
    case "angles":
      return captions([t("A right angle is a square corner", "Un ángulo recto es una esquina cuadrada"), solved]);
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

function fractionTeach(board: FractionBoard, solved: string): SceneFrame[] {
  switch (board.mode) {
    case "parts":
    case "unit":
    case "shade":
      return captions([
        t(`The whole has ${board.den} equal parts`, `El entero tiene ${board.den} partes iguales`),
        t(`${board.num} part${board.num === 1 ? "" : "s"} shaded`, board.num === 1 ? "1 parte sombreada" : `${board.num} partes sombreadas`),
        solved,
      ]);
    case "line":
      return captions([t(`The line is split into ${board.den}`, `La recta está partida en ${board.den}`), solved]);
    case "compare":
      return captions([t("Compare the same kind of part", "Compara el mismo tipo de parte"), solved]);
    case "equivalent":
      return captions([t("Same amount, different parts", "La misma cantidad, distintas partes"), solved]);
    case "addLike":
      return captions([t("The denominator stays the same", "El denominador se queda igual"), solved]);
    case "decimals":
      return captions([t("Tenths, then hundredths", "Décimos, luego centésimos"), solved]);
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

function measureTeach(board: MeasureBoard, solved: string): SceneFrame[] {
  switch (board.mode) {
    case "compare":
      return captions([t("Look from end to end", "Mira de punta a punta"), solved]);
    case "ruler":
      return captions([t("Start at 0", "Empieza en el 0"), solved]);
    case "picture":
    case "bar":
      return captions([t("Read one row", "Lee una fila"), solved]);
    case "more":
      return captions([t("Subtract the smaller number", "Resta el número menor"), solved]);
    case "size":
      return captions([t("Look at the pictures", "Mira los dibujos"), solved]);
    case "area":
      return captions([t("Length times width", "Largo por ancho"), solved]);
    case "perimeter":
      return captions([t("Add all four sides", "Suma los cuatro lados"), solved]);
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

function phonicsTeach(board: PhonicsBoard, solved: string): SceneFrame[] {
  switch (board.mode) {
    case "letters":
      return captions([t(`The letter is ${board.letter}`, `La letra es ${board.letter}`), solved]);
    case "sounds":
    case "begin":
      return captions([t(`The sound is ${board.phoneme}`, `El sonido es ${board.phoneme}`), solved]);
    case "rhyme":
      return captions([t(`Listen for the ending of ${board.cue}`, `Escucha el final de ${board.cue}`), solved]);
    case "cvc":
      return captions([board.blend, solved]);
    case "end":
      return captions([t(`The last sound in ${board.word}`, `El último sonido de ${board.word}`), solved]);
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

function problemTeach(board: ProblemBoard): SceneFrame[] {
  switch (board.mode) {
    case "add":
      return captions([t(`Start with ${board.a}`, `Empieza con ${board.a}`), t(`Add ${board.b}`, `Suma ${board.b}`), `${board.a} + ${board.b} = ${board.a + board.b}`]);
    case "sub":
      return captions([t(`Start with ${board.a}`, `Empieza con ${board.a}`), t(`Take away ${board.b}`, `Quita ${board.b}`), `${board.a} - ${board.b} = ${board.a - board.b}`]);
    case "mult":
      return captions([
        t(`${board.a} groups`, `${board.a} grupos`),
        t(`${board.b} in each group`, `${board.b} en cada grupo`),
        `${board.a} × ${board.b} = ${board.a * board.b}`,
      ]);
    case "div":
      return captions([
        t(`${board.a} shared into ${board.b} groups`, `${board.a} repartidos en ${board.b} grupos`),
        `${board.a} ÷ ${board.b} = ${board.a / board.b}`,
      ]);
    case "picture":
      return captions([
        t(`${board.a} groups`, `${board.a} grupos`),
        t(`${board.b} in each group`, `${board.b} en cada grupo`),
        t(`${board.a} groups of ${board.b}`, `${board.a} grupos de ${board.b}`),
      ]);
    case "steps": {
      const away = board.extra ?? 0;
      return captions([
        t(`${board.a} groups of ${board.b}`, `${board.a} grupos de ${board.b}`),
        t(`Take away ${away}`, `Quita ${away}`),
        `${board.a * board.b} - ${away} = ${board.a * board.b - away}`,
      ]);
    }
    default: {
      const neverMode: never = board.mode;
      return neverMode;
    }
  }
}

function sceneFrames(question: ChoiceQ, board: Board): SceneFrame[] {
  const solved = solvedLine(question);
  switch (board.game) {
    case "count":
      return countTeach(board, solved);
    case "place":
      return placeTeach(board, solved);
    case "shapes":
      return shapeTeach(board, solved);
    case "fractions":
      return fractionTeach(board, solved);
    case "measure":
      return measureTeach(board, solved);
    case "phonics":
      return phonicsTeach(board, solved);
    case "problems":
      return problemTeach(board);
    case "variables":
      return captions(variableCaptions(board));
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}
