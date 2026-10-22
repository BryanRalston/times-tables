import { formatClockTime } from "@/lib/clock";
import type { Rng } from "@/lib/rng";
import { t } from "../i18n";
import { formatCents } from "./money-model";
import { buddyName, pickTalk } from "./flavor";
import { nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import { fourChoices, qid } from "./choices";
import { TIMES, type ChoiceQ, type MoneyVisual, type SheetItem, type TimesVisual } from "./types";
import type { AngleKind, FractionBoard, MeasureBoard, PhonicsBoard, PlaceBoard, ProblemBoard, ShapeBoard, ShapeColor } from "./boards";

const COLORS: ShapeColor[] = ["red", "blue", "yellow", "green"];
const MATCH_SHAPES = ["circle", "triangle", "square", "rectangle"] as const;
const ANGLES: AngleKind[] = ["acute", "right", "obtuse", "straight"];

export function colorWord(color: ShapeColor): string {
  switch (color) {
    case "red":
      return t("red", "rojo");
    case "blue":
      return t("blue", "azul");
    case "yellow":
      return t("yellow", "amarillo");
    case "green":
      return t("green", "verde");
    default: {
      const neverColor: never = color;
      return neverColor;
    }
  }
}

export function angleWord(kind: AngleKind): string {
  switch (kind) {
    case "acute":
      return t("acute", "agudo");
    case "right":
      return t("right", "recto");
    case "obtuse":
      return t("obtuse", "obtuso");
    case "straight":
      return t("straight", "llano");
    default: {
      const neverKind: never = kind;
      return neverKind;
    }
  }
}

function colorPictures(): Record<string, string> {
  const pictures: Record<string, string> = {};
  for (const color of COLORS) pictures[color] = `swatch:${color}`;
  return pictures;
}

function blankLabels(keys: readonly string[]): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const key of keys) labels[key] = "";
  return labels;
}

export function makeColorQuestion(rng: Rng): ChoiceQ {
  const color = rng.pick(COLORS);
  const board: ShapeBoard = { game: "shapes", mode: "color", color };
  const word = colorWord(color);
  return sceneQuestion(rng, {
    game: "shapes",
    title: t(`Which one is ${word}?`, `¿Cuál es ${word}?`, `Qual é ${word}?`),
    hint: t("Look at the colors", "Mira los colores"),
    answer: color,
    choices: rng.shuffle([...COLORS]),
    skill: "shapes:color",
    tags: ["color"],
    solved: word,
    picture: `swatch:${color}`,
    hands: false,
    quietChoices: true,
    labels: blankLabels(COLORS),
    pictures: colorPictures(),
    board,
    factKey: `color:${color}`,
  });
}

export function makeMatchQuestion(rng: Rng): ChoiceQ {
  const shape = rng.pick([...MATCH_SHAPES]);
  const board: ShapeBoard = { game: "shapes", mode: "match", shape };
  const pictures: Record<string, string> = {};
  for (const name of MATCH_SHAPES) pictures[name] = `fig:${name}`;
  return sceneQuestion(rng, {
    game: "shapes",
    title: pickTalk(rng, [
      ["Which one matches?", "¿Cuál es igual?"],
      ["Find the same shape.", "Busca la misma figura."],
      ["Which picture is the same?", "¿Qué dibujo es igual?"],
    ]),
    hint: t("Find the same shape", "Busca la misma figura"),
    answer: shape,
    choices: rng.shuffle([...MATCH_SHAPES]),
    skill: "shapes:match",
    tags: ["match"],
    solved: t("They match", "Son iguales"),
    picture: `fig:${shape}`,
    hands: false,
    quietChoices: true,
    labels: blankLabels(MATCH_SHAPES),
    pictures,
    board,
    factKey: `match:${shape}`,
  });
}

export function makePatternQuestion(rng: Rng): ChoiceQ {
  const a = rng.pick(COLORS);
  let b = rng.pick(COLORS.filter((color) => color !== a));
  const kind = rng.next() < 0.7 ? "ab" : "abb";
  const items: ShapeColor[] = kind === "ab" ? [a, b, a, b] : [a, b, b, a];
  const next = kind === "ab" ? a : b;
  const shown = items.slice(0, 3);
  const board: ShapeBoard = { game: "shapes", mode: "pattern", items: shown, next };
  const said = shown.map((color) => colorWord(color)).join(", ");
  return sceneQuestion(rng, {
    game: "shapes",
    title: t(`${said}. What comes next?`, `${said}. ¿Qué sigue?`, `${said}. O que vem depois?`),
    hint: t("Say the pattern", "Di el patrón"),
    answer: next,
    choices: rng.shuffle([...COLORS]),
    skill: "shapes:pattern",
    tags: ["pattern"],
    solved: colorWord(next),
    picture: `swatch:${next}`,
    hands: false,
    quietChoices: true,
    labels: blankLabels(COLORS),
    pictures: colorPictures(),
    board,
    factKey: `pattern:${shown.join("")}:${next}`,
  });
}

export function makeAngleQuestion(rng: Rng): ChoiceQ {
  const kind = rng.pick(ANGLES);
  const degrees = kind === "right" || kind === "straight";
  const ask = degrees && rng.next() < 0.45 ? "degrees" : "kind";
  const board: ShapeBoard = { game: "shapes", mode: "angles", kind, ask };
  if (ask === "degrees") {
    const answer = kind === "right" ? 90 : 180;
    return sceneQuestion(rng, {
      game: "shapes",
      title: t("How many degrees is this angle?", "¿Cuántos grados tiene este ángulo?"),
      hint: t("A right angle is 90. A straight angle is 180.", "Un ángulo recto mide 90. Un ángulo llano mide 180."),
      answer: String(answer),
      choices: uniqueChoices(rng, String(answer), ["45", "90", "180", "360"]),
      skill: "shapes:angles",
      tags: ["angles"],
      solved: t(`${answer} degrees`, `${answer} grados`, `${answer} graus`),
      picture: kind,
      hands: false,
      quietChoices: false,
      labels: {},
      board,
      factKey: `angle:${kind}:${answer}`,
    });
  }
  const labels: Record<string, string> = {};
  for (const name of ANGLES) labels[name] = angleWord(name);
  return sceneQuestion(rng, {
    game: "shapes",
    title: t("What kind of angle is this?", "¿Qué tipo de ángulo es?"),
    hint: t("A right angle is a square corner.", "Un ángulo recto es una esquina cuadrada."),
    answer: kind,
    choices: rng.shuffle([...ANGLES]),
    skill: "shapes:angles",
    tags: ["angles"],
    solved: angleWord(kind),
    picture: kind,
    hands: false,
    quietChoices: false,
    labels,
    board,
    factKey: `angle:${kind}`,
  });
}

export function makeSizeQuestion(rng: Rng): ChoiceQ {
  const bigger = rng.next() < 0.5;
  const board: MeasureBoard = { game: "measure", mode: "size", ask: bigger ? "bigger" : "smaller" };
  const ids = ["s1", "s2", "s3", "s4"];
  const answer = bigger ? "s4" : "s1";
  const pictures: Record<string, string> = { s1: "grow:1", s2: "grow:2", s3: "grow:3", s4: "grow:4" };
  return sceneQuestion(rng, {
    game: "measure",
    title: bigger ? t("Which one is bigger?", "¿Cuál es más grande?") : t("Which one is smaller?", "¿Cuál es más chico?"),
    hint: t("Look at the pictures", "Mira los dibujos"),
    answer,
    choices: rng.shuffle(ids),
    skill: "measure:size",
    tags: ["size"],
    solved: bigger ? t("The biggest one", "El más grande") : t("The smallest one", "El más chico"),
    picture: pictures[answer] ?? "grow:1",
    hands: false,
    quietChoices: true,
    labels: blankLabels(ids),
    pictures,
    board,
    factKey: `size:${bigger ? "big" : "small"}`,
  });
}

export function makeAreaQuestion(rng: Rng, mode: "area" | "perimeter"): ChoiceQ {
  const length = rng.int(3, 12);
  const width = rng.int(2, Math.min(9, length));
  const answer = mode === "area" ? length * width : 2 * (length + width);
  const board: MeasureBoard = { game: "measure", mode, length, width };
  const title =
    mode === "area"
      ? t(`A rectangle is ${length} by ${width}. What is the area?`, `Un rectángulo mide ${length} por ${width}. ¿Cuál es el área?`, `Um retângulo mede ${length} vezes ${width}. Qual é a área?`)
      : t(
          `A rectangle is ${length} by ${width}. What is the perimeter?`,
          `Un rectángulo mide ${length} por ${width}. ¿Cuál es el perímetro?`, `Um retângulo mede ${length} vezes ${width}. Qual é o perímetro?`,
        );
  return sceneQuestion(rng, {
    game: "measure",
    title,
    hint:
      mode === "area"
        ? t("Area is length times width", "El área es largo por ancho")
        : t("Perimeter is the distance around", "El perímetro es la vuelta alrededor"),
    answer: String(answer),
    choices: nearChoices(rng, answer, 1, 200, [length * width, 2 * (length + width), length + width, length * 2]),
    skill: `measure:${mode}`,
    tags: [mode],
    solved: mode === "area" ? t(`${answer} square units`, `${answer} unidades cuadradas`, `${answer} unidades quadradas`) : t(`${answer} units`, `${answer} unidades`, `${answer} unidades`),
    picture: `${length}x${width}`,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `${mode}:${length}x${width}`,
  });
}

export function makeLetterQuestion(rng: Rng): ChoiceQ {
  const letters = ["M", "S", "T", "B", "P", "F", "A", "C", "D", "L", "R", "N"];
  const letter = rng.pick(letters);
  const decoys = rng.shuffle(letters.filter((item) => item !== letter)).slice(0, 3);
  const board: PhonicsBoard = { game: "phonics", mode: "letters", letter };
  return sceneQuestion(rng, {
    game: "phonics",
    title: t(`Tap the letter ${letter}`, `Toca la letra ${letter}`, `Toque a letra ${letter}`),
    hint: t("Listen for the letter name", "Escucha el nombre de la letra"),
    answer: letter,
    choices: rng.shuffle([letter, ...decoys]),
    skill: "phonics:letters",
    tags: ["letters"],
    solved: letter,
    picture: letter,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `letter:${letter}`,
  });
}

function digitValue(n: number, indexFromRight: number): { digit: number; place: number; value: number } {
  const place = 10 ** indexFromRight;
  const digit = Math.floor(n / place) % 10;
  return { digit, place, value: digit * place };
}

export function makeBigPlaceQuestion(rng: Rng): ChoiceQ {
  const n = rng.int(1000, 999999);
  const text = String(n);
  const open: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "0") open.push(text.length - 1 - i);
  }
  const spot = rng.pick(open.length > 0 ? open : [0]);
  const { digit, place, value } = digitValue(n, spot);
  const board: PlaceBoard = { game: "place", mode: "big", n, digit, place };
  const distractors = [value * 10, Math.floor(value / 10), digit, place, n].filter((item) => item !== value && item <= 1000000);
  return sceneQuestion(rng, {
    game: "place",
    title: t(`What is the value of the ${digit} in ${n}?`, `¿Cuál es el valor del ${digit} en ${n}?`, `Qual é o valor do ${digit} em ${n}?`),
    hint: t("The place tells the value", "El lugar dice el valor"),
    answer: String(value),
    choices: nearChoices(rng, value, 0, 1000000, distractors),
    skill: "place:big",
    tags: ["big"],
    solved: String(value),
    picture: String(n),
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `big:${n}:${place}`,
  });
}

export function roundToPlace(n: number, place: number): number {
  return Math.floor(n / place + 0.5) * place;
}

export function makeRoundBigQuestion(rng: Rng): ChoiceQ {
  const place = rng.pick([1000, 10000, 100000]);
  const n = rng.int(place, Math.min(999999, place * 20));
  const answer = roundToPlace(n, place);
  const board: PlaceBoard = { game: "place", mode: "roundBig", n, place };
  const placeName =
    place === 1000
      ? t("thousand", "millar")
      : place === 10000
        ? t("ten thousand", "decena de millar")
        : t("hundred thousand", "centena de millar");
  return sceneQuestion(rng, {
    game: "place",
    title: t(`Round ${n} to the nearest ${placeName}`, `Redondea ${n} al ${placeName} más cercano`, `Arredonde ${n} para o ${placeName} mais próximo`),
    hint: t("Look at the digit to the right. 5 or more rounds up.", "Mira el dígito de la derecha. 5 o más, sube."),
    answer: String(answer),
    choices: nearChoices(rng, answer, 0, 1000000, [answer + place, Math.max(0, answer - place), n, roundToPlace(n, place === 1000 ? 10000 : 1000)]),
    skill: "place:roundBig",
    tags: ["roundBig"],
    solved: String(answer),
    picture: String(n),
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `round:${place}:${n}`,
  });
}

const LIKE_DENS = [2, 3, 4, 5, 6, 8, 10, 12] as const;

export function makeAddLikeQuestion(rng: Rng): ChoiceQ {
  const den = rng.pick([...LIKE_DENS]);
  const op = rng.next() < 0.65 ? "+" : "-";
  let num = 1;
  let num2 = 1;
  if (op === "+") {
    num = rng.int(1, den - 1);
    num2 = rng.int(1, den - num);
  } else {
    num = rng.int(2, den);
    num2 = rng.int(1, num - 1);
  }
  const result = op === "+" ? num + num2 : num - num2;
  const answer = `${result}/${den}`;
  const board: FractionBoard = { game: "fractions", mode: "addLike", num, den, num2, op };
  const sign = op === "+" ? "+" : "−";
  const sameSize: string[] = [];
  for (let n = 0; n <= den; n += 1) sameSize.push(`${n}/${den}`);
  return sceneQuestion(rng, {
    game: "fractions",
    title: t(`What is ${num}/${den} ${sign} ${num2}/${den}?`, `¿Cuánto es ${num}/${den} ${sign} ${num2}/${den}?`, `Quanto é ${num}/${den} ${sign} ${num2}/${den}?`),
    hint: t("The parts are the same size. Add or subtract the top numbers.", "Las partes son del mismo tamaño. Suma o resta los números de arriba."),
    answer,
    choices: uniqueChoices(rng, answer, [...sameSize, "1/2", "1/3", "1/4", "3/4", "2/3", "1/8", "3/8", "5/8"]),
    skill: "fractions:addLike",
    tags: ["addLike"],
    solved: answer,
    picture: answer,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `addLike:${num}/${den}${op}${num2}`,
  });
}

function decimalText(whole: number, tenths: number, hundredths: number): string {
  return `${whole}.${tenths}${hundredths}`;
}

function decimalSay(text: string): string {
  const match = /^(\d+)\.(\d)(\d)$/.exec(text);
  if (!match) return text;
  const whole = Number(match[1]);
  const tenths = Number(match[2]);
  const hundredths = Number(match[3]);
  const places = tenths * 10 + hundredths;
  if (places === 0) return t(whole === 1 ? "one whole" : `${whole} wholes`, whole === 1 ? "un entero" : `${whole} enteros`, whole === 1 ? "um inteiro" : `${whole} inteiros`);
  if (whole === 0 && hundredths === 0) return t(`${tenths} tenths`, `${tenths} décimos`, `${tenths} décimos`);
  if (whole === 0) return t(`${places} hundredths`, `${places} centésimos`, `${places} centésimos`);
  if (hundredths === 0) return t(`${whole} and ${tenths} tenths`, `${whole} y ${tenths} décimos`, `${whole} e ${tenths} décimos`);
  return t(`${whole} and ${places} hundredths`, `${whole} y ${places} centésimos`, `${whole} e ${places} centésimos`);
}

function decimalChoices(rng: Rng, answer: string, seeds: readonly string[]): string[] {
  const pool = [...seeds];
  for (const extra of ["0.10", "0.20", "0.25", "0.50", "0.05", "0.75", "1.00", "0.01"]) {
    if (!pool.includes(extra)) pool.push(extra);
  }
  return uniqueChoices(rng, answer, pool);
}

function decimalLabels(choices: readonly string[]): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const choice of choices) labels[choice] = decimalSay(choice);
  return labels;
}

export function makeDecimalQuestion(rng: Rng): ChoiceQ {
  if (rng.next() < 0.55) {
    const tenths = rng.int(1, 9);
    const hundredths = rng.next() < 0.5 ? 0 : rng.int(1, 9);
    const answer = decimalText(0, tenths, hundredths);
    const board: FractionBoard = { game: "fractions", mode: "decimals", whole: 0, tenths, hundredths, ask: "write" };
    const said =
      hundredths === 0
        ? t(`${tenths} tenths`, `${tenths} décimos`, `${tenths} décimos`)
        : t(`${tenths * 10 + hundredths} hundredths`, `${tenths * 10 + hundredths} centésimos`, `${tenths * 10 + hundredths} centésimos`);
    const wrongs = [
      decimalText(0, tenths, hundredths === 0 ? 1 : 0),
      decimalText(tenths, hundredths, 0),
      decimalText(0, hundredths === 0 ? 1 : hundredths, tenths),
      hundredths === 0 ? `0.${tenths}0` : `0.${hundredths}`,
    ];
    const choices = decimalChoices(rng, answer, wrongs);
    return sceneQuestion(rng, {
      game: "fractions",
      title: t(`Which decimal shows ${said}?`, `¿Qué decimal muestra ${said}?`, `Que decimal mostra ${said}?`),
      hint: t("Tenths are the first place. Hundredths are the second.", "Los décimos son el primer lugar. Los centésimos son el segundo."),
      answer,
      choices,
      skill: "fractions:decimals",
      tags: ["decimals"],
      solved: said,
      picture: answer,
      hands: false,
      quietChoices: false,
      labels: decimalLabels(choices),
      board,
      factKey: `dec:${answer}`,
    });
  }
  const leftT = rng.int(1, 9);
  const leftH = rng.int(0, 9);
  let rightT = rng.int(1, 9);
  let rightH = rng.int(0, 9);
  if (leftT === rightT && leftH === rightH) rightH = (rightH + 1) % 10;
  const left = leftT * 10 + leftH;
  const right = rightT * 10 + rightH;
  const greaterLeft = left > right;
  const answer = decimalText(0, greaterLeft ? leftT : rightT, greaterLeft ? leftH : rightH);
  const other = decimalText(0, greaterLeft ? rightT : leftT, greaterLeft ? rightH : leftH);
  const board: FractionBoard = {
    game: "fractions",
    mode: "decimals",
    whole: 0,
    tenths: leftT,
    hundredths: leftH,
    ask: "compare",
    otherTenths: rightT,
    otherHundredths: rightH,
  };
  const choices = decimalChoices(rng, answer, [other, decimalText(0, leftT, (leftH + 3) % 10), "1.00"]);
  return sceneQuestion(rng, {
    game: "fractions",
    title: t(
      `Which is greater, ${left} hundredths or ${right} hundredths?`,
      `¿Cuál es mayor, ${left} centésimos o ${right} centésimos?`, `Qual é maior, ${left} centésimos ou ${right} centésimos?`,
    ),
    hint: t("Compare tenths first", "Compara primero los décimos"),
    answer,
    choices,
    skill: "fractions:decimals",
    tags: ["decimals"],
    solved: t(`${greaterLeft ? left : right} hundredths`, `${greaterLeft ? left : right} centésimos`, `${greaterLeft ? left : right} centésimos`),
    picture: answer,
    hands: false,
    quietChoices: false,
    labels: decimalLabels(choices),
    board,
    factKey: `decmp:${answer}`,
  });
}

function shiftClock(hours: number, minutes: number, delta: number): { hours: number; minutes: number } {
  const base = (hours % 12) * 60 + minutes + delta;
  const wrapped = ((base % (12 * 60)) + 12 * 60) % (12 * 60);
  const nextHour = Math.floor(wrapped / 60);
  return { hours: nextHour === 0 ? 12 : nextHour, minutes: wrapped % 60 };
}

export function makeElapsedQuestion(rng: Rng): ChoiceQ {
  const minutes = rng.pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const hours = rng.int(1, 12);
  const delta = rng.pick([15, 20, 30, 45]);
  const end = shiftClock(hours, minutes, delta);
  const answer = formatClockTime(end.hours, end.minutes);
  const wrong = [
    formatClockTime(hours, minutes),
    formatClockTime(shiftClock(hours, minutes, delta + 15).hours, shiftClock(hours, minutes, delta + 15).minutes),
    formatClockTime(shiftClock(hours, minutes, -delta).hours, shiftClock(hours, minutes, -delta).minutes),
  ];
  const start = formatClockTime(hours, minutes);
  const who = buddyName(rng);
  return {
    id: qid(rng),
    game: "time",
    title: t(
      `${who} starts at ${start}. It lasts ${delta} minutes. What time is it then?`,
      `${who} empieza a las ${start}. Dura ${delta} minutos. ¿Qué hora es entonces?`, `${who} começa às ${start}. Dura ${delta} minutos. Que horas são então?`,
    ),
    hint: t("Count the minutes past the hour", "Cuenta los minutos después de la hora"),
    praise: t(`Yes! ${answer}`, `¡Sí! ${answer}`, `Sim! ${answer}`),
    almost: t(`Almost! ${answer}`, `¡Casi! ${answer}`, `Quase! ${answer}`),
    answer,
    choices: uniqueChoices(rng, answer, wrong),
    skill: "time:elapsed",
    tags: ["elapsed"],
    factKey: `elapsed:${start}+${delta}`,
    visual: { kind: "time", hours, minutes, level: "elapsed" },
  };
}

export function makeSpendQuestion(rng: Rng): ChoiceQ {
  const first = rng.pick([125, 150, 175, 200, 250, 275, 300, 350]);
  const second = rng.pick([25, 50, 75, 100, 125, 150]);
  const together = first + second;
  const paid = together <= 400 ? 500 : 1000;
  const change = rng.next() < 0.5;
  const answer = change ? paid - together : together;
  const visual: MoneyVisual = {
    kind: "money",
    mode: "spend",
    coins: change
      ? { penny: 0, nickel: 0, dime: 0, quarter: 0, dollar: Math.floor(paid / 100) }
      : { penny: 0, nickel: 0, dime: 0, quarter: 0, dollar: 0 },
    priceCents: together,
  };
  const a = formatCents(first);
  const b = formatCents(second);
  const pay = formatCents(paid);
  const title = change
    ? t(`A snack is ${a} and a drink is ${b}. You pay ${pay}. How much change?`, `Una merienda cuesta ${a} y un jugo cuesta ${b}. Pagas ${pay}. ¿Cuánto de cambio?`, `Um lanche custa ${a} e um suco custa ${b}. Você paga ${pay}. Quanto de troco?`)
    : t(`A snack is ${a} and a drink is ${b}. How much altogether?`, `Una merienda cuesta ${a} y un jugo cuesta ${b}. ¿Cuánto es en total?`, `Um lanche custa ${a} e um suco custa ${b}. Quanto é ao todo?`);
  return {
    id: qid(rng),
    game: "money",
    title,
    hint: change ? t("Add the prices, then subtract from what you pay", "Suma los precios y réstalos de lo que pagas") : t("Add the two prices", "Suma los dos precios"),
    praise: t(`Yes! ${formatCents(answer)}`, `¡Sí! ${formatCents(answer)}`, `Sim! ${formatCents(answer)}`),
    almost: t(`Almost! ${formatCents(answer)}`, `¡Casi! ${formatCents(answer)}`, `Quase! ${formatCents(answer)}`),
    answer: formatCents(answer),
    choices: uniqueChoices(
      rng,
      formatCents(answer),
      [answer + 25, Math.max(25, answer - 25), answer + 50, Math.max(25, answer - 50), answer + 75, together + 25, paid].map((value) =>
        formatCents(value),
      ),
    ),
    skill: "money:spend",
    tags: ["spend"],
    factKey: `spend:${first}:${second}:${change ? "change" : "sum"}`,
    visual,
  };
}

export function makeStepsQuestion(rng: Rng): ChoiceQ {
  const groups = rng.int(2, 6);
  const each = rng.int(3, 8);
  const away = rng.int(1, groups * each - 1);
  const answer = groups * each - away;
  const thing = rng.pick([
    { name: "apples", emoji: "🍎" },
    { name: "stars", emoji: "⭐" },
    { name: "cookies", emoji: "🍪" },
  ]);
  const who = buddyName(rng);
  const board: ProblemBoard = {
    game: "problems",
    mode: "steps",
    op: "×",
    a: groups,
    b: each,
    extra: away,
    emoji: thing.emoji,
    thing: thing.name,
  };
  return sceneQuestion(rng, {
    game: "problems",
    title: t(
      `${who} has ${groups} bags of ${each} ${thing.name}. ${who} gives away ${away}. How many are left?`,
      `${who} tiene ${groups} bolsas de ${each} ${thing.name}. ${who} regala ${away}. ¿Cuántos quedan?`, `${who} tem ${groups} sacolas de ${each} ${thing.name}. ${who} dá de presente ${away}. Quantos sobram?`,
    ),
    hint: t("Multiply first, then subtract", "Multiplica primero y luego resta"),
    answer: String(answer),
    choices: nearChoices(rng, answer, 0, 80, [groups * each, groups * each + away, each - away, groups + each]),
    skill: "problems:steps",
    tags: ["steps"],
    solved: t(`${groups * each} minus ${away} is ${answer}`, `${groups * each} menos ${away} es ${answer}`, `${groups * each} menos ${away} é ${answer}`),
    picture: thing.emoji,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `steps:${groups}x${each}-${away}`,
  });
}

function factorOf(n: number): number[] {
  const found: number[] = [];
  for (let i = 2; i <= n; i += 1) {
    if (n % i === 0) found.push(i);
  }
  return found;
}

export function makeFactorQuestion(rng: Rng): ChoiceQ {
  if (rng.next() < 0.5) {
    const n = rng.pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 48]);
    const factors = factorOf(n).filter((item) => item < n);
    const answer = rng.pick(factors);
    const decoys = [2, 3, 4, 5, 6, 7, 8, 9].filter((item) => item !== answer && n % item !== 0);
    const visual: TimesVisual = { kind: "times", a: n, b: answer, hidden: answer, solved: `${answer}`, ask: "factor" };
    return {
      id: qid(rng),
      game: "times",
      title: t(`Which number is a factor of ${n}?`, `¿Qué número es un factor de ${n}?`, `Que número é um fator de ${n}?`),
      hint: t("A factor divides the number with none left over", "Un factor divide el número y no sobra nada"),
      praise: t(`Yes! ${answer} is a factor of ${n}`, `¡Sí! ${answer} es un factor de ${n}`, `Sim! ${answer} é um fator de ${n}`),
      almost: t(`Almost! ${answer} is a factor of ${n}`, `¡Casi! ${answer} es un factor de ${n}`, `Quase! ${answer} é um fator de ${n}`),
      answer: String(answer),
      choices: fourChoices(rng, answer, decoys),
      skill: "times:factors",
      tags: ["factors"],
      factKey: `factor:${n}:${answer}`,
      visual,
    };
  }
  const base = rng.pick([3, 4, 6, 7, 8, 9]);
  const answer = base * rng.int(3, 8);
  const decoys = [answer + base + 1, answer + 1, base + 1, answer - 1].filter((item) => item > 0 && item % base !== 0);
  const visual: TimesVisual = { kind: "times", a: base, b: answer / base, hidden: answer, solved: `${answer}`, ask: "multiple" };
  return {
    id: qid(rng),
    game: "times",
    title: t(`Which number is a multiple of ${base}?`, `¿Qué número es un múltiplo de ${base}?`, `Que número é um múltiplo de ${base}?`),
    hint: t("Multiples are what you get when you skip count", "Los múltiplos salen al contar de salto"),
    praise: t(`Yes! ${answer} is a multiple of ${base}`, `¡Sí! ${answer} es un múltiplo de ${base}`, `Sim! ${answer} é um múltiplo de ${base}`),
    almost: t(`Almost! ${answer} is a multiple of ${base}`, `¡Casi! ${answer} es un múltiplo de ${base}`, `Quase! ${answer} é um múltiplo de ${base}`),
    answer: String(answer),
    choices: fourChoices(rng, answer, decoys),
    skill: "times:factors",
    tags: ["factors"],
    factKey: `multiple:${base}:${answer}`,
    visual,
  };
}

export function makeMultiQuestion(rng: Rng): ChoiceQ {
  const wide = rng.next() < 0.35;
  const a = wide ? rng.int(12, 25) : rng.int(12, 48);
  const b = wide ? rng.int(11, 19) : rng.int(2, 9);
  const product = a * b;
  const solved = `${a} ${TIMES} ${b} = ${product}`;
  const visual: TimesVisual = { kind: "times", a, b, hidden: product, solved, ask: "product" };
  return {
    id: qid(rng),
    game: "times",
    title: t(`What is ${a} times ${b}?`, `¿Cuánto es ${a} por ${b}?`, `Quanto é ${a} vezes ${b}?`),
    hint: t("Break the bigger number into tens and ones", "Separa el número grande en decenas y unidades"),
    praise: t(`Yes! ${solved}`, `¡Sí! ${solved}`, `Sim! ${solved}`),
    almost: t(`Almost! ${solved}`, `¡Casi! ${solved}`, `Quase! ${solved}`),
    answer: String(product),
    choices: fourChoices(rng, product, [a * (b + 1), a * Math.max(1, b - 1), (a + 10) * b, product + a, product - b]),
    skill: "times:multi",
    tags: ["multi"],
    factKey: `multi:${a}x${b}`,
    visual,
  };
}

export function makeDivideQuestion(rng: Rng): ChoiceQ {
  const b = rng.int(2, 9);
  const q = rng.int(3, 20);
  const r = rng.int(1, b - 1);
  const a = q * b + r;
  const answer = `${q} remainder ${r}`;
  const solved = `${a} ÷ ${b} = ${q} remainder ${r}`;
  const visual: TimesVisual = { kind: "times", a, b, hidden: q, solved, ask: "divide", remainder: r };
  const decoys = [`${q + 1} remainder ${r}`, `${q} remainder ${Math.max(1, (r + 1) % b || 1)}`, `${q - 1} remainder ${r}`, `${a} remainder 0`];
  return {
    id: qid(rng),
    game: "times",
    title: t(`What is ${a} divided by ${b}?`, `¿Cuánto es ${a} dividido entre ${b}?`, `Quanto é ${a} dividido por ${b}?`),
    hint: t("Find how many groups, then what is left", "Busca cuántos grupos y luego lo que sobra"),
    praise: t(`Yes! ${solved}`, `¡Sí! ${solved}`, `Sim! ${solved}`),
    almost: t(`Almost! ${solved}`, `¡Casi! ${solved}`, `Quase! ${solved}`),
    answer,
    choices: uniqueChoices(rng, answer, decoys),
    skill: "times:divide",
    tags: ["divide"],
    factKey: `div:${a}/${b}`,
    visual,
  };
}

export function makeBigAddQuestion(rng: Rng, level: "within1000" | "thousands"): ChoiceQ {
  const max = level === "within1000" ? 1000 : 9999;
  const floor = level === "within1000" ? 40 : 200;
  const sub = rng.next() < 0.4;
  let pink = 0;
  let teal = 0;
  let hidden = 0;
  let solved = "";
  let op: "+" | "-" = "+";
  if (!sub) {
    const sum = rng.int(floor, max);
    pink = rng.int(Math.floor(floor / 2), sum - 10);
    teal = sum - pink;
    hidden = sum;
    solved = `${pink} + ${teal} = ${sum}`;
  } else {
    op = "-";
    const total = rng.int(floor, max);
    teal = rng.int(10, total - 10);
    pink = total - teal;
    hidden = pink;
    solved = `${total} − ${teal} = ${pink}`;
  }
  const step = level === "within1000" ? 10 : 100;
  return {
    id: qid(rng),
    game: "add",
    title:
      op === "+"
        ? t(`What is ${pink} plus ${teal}?`, `¿Cuánto es ${pink} más ${teal}?`, `Quanto é ${pink} a mais ${teal}?`)
        : t(`What is ${pink + teal} minus ${teal}?`, `¿Cuánto es ${pink + teal} menos ${teal}?`, `Quanto é ${pink + teal} menos ${teal}?`),
    hint: t("Line up the places, then add or subtract", "Alinea los lugares y luego suma o resta"),
    praise: t(`Yes! ${solved}`, `¡Sí! ${solved}`, `Sim! ${solved}`),
    almost: t(`Almost! ${solved}`, `¡Casi! ${solved}`, `Quase! ${solved}`),
    answer: String(hidden),
    choices: fourChoices(rng, hidden, [hidden + step, hidden - step, hidden + 1, hidden - 1, hidden + step * 10]),
    skill: `add:${level}`,
    tags: [level],
    visual: {
      kind: "add",
      op,
      left: op === "+" ? pink : pink + teal,
      right: teal,
      result: null,
      pink,
      teal,
      max,
      hidden,
      solved,
    },
  };
}

export function spanSheet(rng: Rng, game: string, level: string): SheetItem | null {
  if (game === "shapes" && level === "match") {
    return { prompt: "Which shape matches a circle?", answer: "circle" };
  }
  if (game === "shapes" && level === "color") {
    const color = rng.pick(COLORS);
    return { prompt: `Which color is named ${color}?`, answer: color };
  }
  if (game === "shapes" && level === "pattern") {
    return { prompt: "Red, blue, red, blue. What comes next?", answer: "red" };
  }
  if (game === "shapes" && level === "angles") {
    return { prompt: "How many degrees are in a right angle?", answer: "90" };
  }
  if (game === "measure" && level === "size") {
    return { prompt: "Which is bigger, a seed or a pumpkin?", answer: "pumpkin" };
  }
  if (game === "measure" && (level === "area" || level === "perimeter")) {
    const length = rng.int(3, 9);
    const width = rng.int(2, length);
    return level === "area"
      ? { prompt: `Area of a ${length} by ${width} rectangle =`, answer: String(length * width) }
      : { prompt: `Perimeter of a ${length} by ${width} rectangle =`, answer: String(2 * (length + width)) };
  }
  if (game === "place" && level === "big") {
    return { prompt: "What is the value of the 4 in 345678?", answer: "40000" };
  }
  if (game === "place" && level === "roundBig") {
    return { prompt: "Round 34500 to the nearest 1000.", answer: "35000" };
  }
  if (game === "fractions" && level === "addLike") {
    return { prompt: "2/8 + 3/8 =", answer: "5/8" };
  }
  if (game === "fractions" && level === "decimals") {
    return { prompt: "Write 25 hundredths as a decimal.", answer: "0.25" };
  }
  if (game === "problems" && level === "steps") {
    return { prompt: "4 bags of 6 apples. Give away 5. How many are left?", answer: "19" };
  }
  if (game === "time" && level === "elapsed") {
    return { prompt: "A show starts at 2:15 and lasts 30 minutes. What time does it end?", answer: "2:45" };
  }
  if (game === "money" && level === "spend") {
    return { prompt: "A snack is $1.50 and a drink is $1.25. How much altogether?", answer: "$2.75" };
  }
  if (game === "times" && level === "factors") {
    return { prompt: "Which is a factor of 24: 5, 6, 7, or 9?", answer: "6" };
  }
  if (game === "times" && level === "multi") {
    const a = rng.int(12, 30);
    const b = rng.int(2, 9);
    return { prompt: `${a} × ${b} =`, answer: String(a * b) };
  }
  if (game === "times" && level === "divide") {
    return { prompt: "23 ÷ 4 =", answer: "5 remainder 3" };
  }
  if (game === "add" && (level === "within1000" || level === "thousands")) {
    const a = level === "within1000" ? rng.int(120, 600) : rng.int(1200, 4000);
    const b = level === "within1000" ? rng.int(40, 300) : rng.int(200, 2000);
    return { prompt: `${a} + ${b} =`, answer: String(a + b) };
  }
  if (game === "phonics" && level === "letters") {
    return { prompt: "Name the letter that looks like M.", answer: "M" };
  }
  return null;
}
