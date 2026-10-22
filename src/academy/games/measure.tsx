import type { Rng } from "@/lib/rng";
import { countedNoun, frenchThan, howManyMorePhrase, howManyPhrase, longShortOf, nounMeasure, t, thingName } from "../i18n";
import { buddyName, pickTalk } from "./flavor";
import { measureCard } from "./cards";
import type { MeasureBoard, MeasureItem } from "./boards";
import { distinctInts, nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import { makeAreaQuestion, makeSizeQuestion, spanSheet } from "./span";
import { BarGraph, PictureGraph, RectFig, Ruler, SceneCard, SizeDot, sceneModule } from "./scene-ui";
import type { ChoiceQ, PromptProps, SheetItem } from "./types";

export const MEASURE_LEVELS = ["size", "compare", "picture", "bar", "ruler", "more", "area", "perimeter"] as const;
export type MeasureLevel = (typeof MEASURE_LEVELS)[number];

const THINGS = [
  { name: "banana", emoji: "🍌" },
  { name: "snake", emoji: "🐍" },
  { name: "carrot", emoji: "🥕" },
  { name: "bone", emoji: "🦴" },
  { name: "candy", emoji: "🍭" },
  { name: "bug", emoji: "🐛" },
] as const;

function pluralName(name: string): string {
  if (name === "candy") return "candies";
  if (name.endsWith("s")) return name;
  return `${name}s`;
}

export function isMeasureLevel(value: unknown): value is MeasureLevel {
  return typeof value === "string" && (MEASURE_LEVELS as readonly string[]).includes(value);
}

function namedItems(rng: Rng, count: number, values: number[]): MeasureItem[] {
  const things = rng.shuffle([...THINGS]).slice(0, count);
  return things.map((thing, i) => ({ name: thing.name, emoji: thing.emoji, value: values[i] ?? 1 }));
}

function makeCompare(rng: Rng): ChoiceQ {
  const values = distinctInts(rng, 4, 2, 9);
  const items = namedItems(rng, 4, values);
  const askLong = rng.next() < 0.5;
  const target = askLong ? Math.max(...values) : Math.min(...values);
  const answer = items[values.indexOf(target)]!.name;
  const board: MeasureBoard = { game: "measure", mode: "compare", items, ask: askLong ? "longest" : "shortest" };
  const named = thingName(answer, 1, answer);
  return sceneQuestion(rng, {
    game: "measure",
    title: askLong ? t("Which is the longest?", "¿Cuál mide más?") : t("Which is the shortest?", "¿Cuál mide menos?"),
    hint: t("Look at the bars", "Mira las barras"),
    answer,
    choices: uniqueChoices(rng, answer, [], items.map((item) => item.name)),
    skill: "measure:compare",
    tags: ["compare"],
    solved: t(`The ${answer} is the ${askLong ? "longest" : "shortest"}`, `${named} es ${longShortOf(answer, askLong)}`, `${named} é ${longShortOf(answer, askLong)}`, `${named} est ${longShortOf(answer, askLong)}`, `${named}是${longShortOf(answer, askLong)}`, `${thingName(answer, 1, answer)} ${longShortOf(answer, askLong)} है`),
    picture: items.find((item) => item.name === answer)?.emoji ?? "📏",
    hands: true,
    quietChoices: false,
    labels: Object.fromEntries(items.map((item) => [item.name, thingName(item.name, 1, item.name)])),
    board,
    factKey: `compare:${items.map((item) => `${item.name}${item.value}`).join("-")}:${board.ask}`,
  });
}

function makeRuler(rng: Rng): ChoiceQ {
  const inches = rng.int(1, 12);
  const board: MeasureBoard = { game: "measure", mode: "ruler", inches };
  const buddy = buddyName(rng);
  return sceneQuestion(rng, {
    game: "measure",
    title: pickTalk(rng, [
      ["How many inches long is the ribbon?", "¿Cuántas pulgadas mide el listón?"],
      [`${buddy} measures the ribbon. How many inches?`, `${buddy} mide el listón. ¿Cuántas pulgadas son?`, `${buddy} mede a fita. Quantas polegadas?`, `${buddy} mesure le ruban. Combien de pouces ?`, `${buddy}在量丝带。有几英寸？`, `${buddy} रिबन नापता है। कितने इंच?`],
    ]),
    hint: t("Start at 0", "Empieza en el 0"),
    answer: String(inches),
    choices: nearChoices(rng, inches, 1, 12),
    skill: "measure:ruler",
    tags: ["ruler"],
    solved: t(`${inches} inches`, inches === 1 ? `${inches} pulgada` : `${inches} pulgadas`, inches === 1 ? `${inches} polegada` : `${inches} polegadas`, inches === 1 ? `${inches} pouce` : `${inches} pouces`, `${inches}英寸`, `${inches} इंच`),
    picture: `${inches} in`,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `ruler:${inches}`,
  });
}

function makeGraph(rng: Rng, mode: "picture" | "bar"): ChoiceQ {
  const askMost = rng.next() < 0.5;
  const values = askMost ? distinctInts(rng, 4, 1, 8) : [rng.int(1, 8), rng.int(1, 8), rng.int(1, 8), rng.int(1, 8)];
  const items = namedItems(rng, 4, values);
  const focus = askMost ? values.indexOf(Math.max(...values)) : rng.int(0, 3);
  const focusItem = items[focus]!;
  const answer = askMost ? focusItem.name : String(focusItem.value);
  const board: MeasureBoard = { game: "measure", mode, items, ask: askMost ? "most" : "count", focus };
  const graph = mode === "picture" ? "picture graph" : "bar graph";
  const graphEs = mode === "picture" ? "gráfica de dibujos" : "gráfica de barras";
  const graphFr = mode === "picture" ? "graphique à images" : "graphique en barres";
  const graphZh = mode === "picture" ? "象形统计图" : "条形统计图";
  const graphHi = mode === "picture" ? "चित्र आलेख" : "दंड आलेख";
  const many = pluralName(focusItem.name);
  const manyEs = thingName(focusItem.name, focusItem.value, many);
  const howMany = howManyPhrase(focusItem.name, focusItem.value, many);
  return sceneQuestion(rng, {
    game: "measure",
    title: askMost
      ? t(`Which has the most on the ${graph}?`, `¿Cuál tiene más en la ${graphEs}?`, `Qual tem mais no ${graphEs}?`, `Lequel en a le plus sur le ${graphFr} ?`, `${graphZh}上哪个最多？`, `${graphHi} पर सबसे अधिक किसके हैं?`)
      : t(`How many ${many} are on the ${graph}?`, `¿${howMany} hay en la ${graphEs}?`, `${howMany} tem no ${graphEs}?`, `${howMany} y a-t-il sur le ${graphFr} ?`, `${graphZh}上${howMany}？`, `${graphHi} पर ${howMany} हैं?`),
    hint: askMost ? t("Find the tallest or fullest row", "Busca la fila más alta o más llena") : t("Count that row", "Cuenta esa fila"),
    answer,
    choices: askMost
      ? uniqueChoices(rng, answer, [], items.map((item) => item.name))
      : nearChoices(rng, focusItem.value, 0, 10),
    skill: `measure:${mode}`,
    tags: [mode],
    solved: askMost
      ? t(`${answer} has the most`, `${thingName(answer, 1, answer)} tiene más`, `${thingName(answer, 1, answer)} tem mais`, `${thingName(answer, 1, answer)} en a le plus`, `${thingName(answer, 1, answer)}最多`, `${thingName(answer, 1, answer)} के सबसे अधिक हैं`)
      : t(`${focusItem.value} ${many}`, `${focusItem.value} ${manyEs}`, `${focusItem.value} ${manyEs}`, `${focusItem.value} ${manyEs}`, countedNoun(focusItem.name, focusItem.value), `${focusItem.value} ${manyEs}`),
    picture: focusItem.emoji.repeat(focusItem.value),
    hands: false,
    quietChoices: false,
    labels: Object.fromEntries(items.map((item) => [item.name, thingName(item.name, 1, item.name)])),
    board,
    factKey: `${mode}:${items.map((item) => item.value).join("-")}:${board.ask}:${focus}`,
  });
}

function makeMore(rng: Rng): ChoiceQ {
  const high = rng.int(2, 8);
  const low = rng.int(1, high - 1);
  const items = namedItems(rng, 2, [high, low]);
  const board: MeasureBoard = { game: "measure", mode: "more", items, left: 0, right: 1 };
  const answer = high - low;
  return sceneQuestion(rng, {
    game: "measure",
    title: t(
      `How many more ${pluralName(items[0]!.name)} than ${pluralName(items[1]!.name)}?`,
      `¿${howManyMorePhrase(items[0]!.name, pluralName(items[0]!.name))} más que ${thingName(items[1]!.name, 2, pluralName(items[1]!.name))}?`, `${howManyMorePhrase(items[0]!.name, pluralName(items[0]!.name))} a mais que ${thingName(items[1]!.name, 2, pluralName(items[1]!.name))}?`,
    `${howManyMorePhrase(items[0]!.name, pluralName(items[0]!.name))} de plus ${frenchThan(thingName(items[1]!.name, 2, pluralName(items[1]!.name)))} ?`, `${thingName(items[0]!.name, 2, pluralName(items[0]!.name))}比${thingName(items[1]!.name, 2, pluralName(items[1]!.name))}多几${nounMeasure(items[0]!.name)}？`, `${thingName(items[0]!.name, 2, pluralName(items[0]!.name))} ${thingName(items[1]!.name, 2, pluralName(items[1]!.name))} से कितने अधिक हैं?`),
    hint: t("Subtract the smaller number", "Resta el número más chico"),
    answer: String(answer),
    choices: nearChoices(rng, answer, 0, 8),
    skill: "measure:more",
    tags: ["more"],
    solved: t(`${answer} more`, `${answer} más`, `${answer} a mais`, `${answer} de plus`, `多${answer}个`, `${answer} अधिक`),
    picture: `${high} ${low}`,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `more:${items[0]!.name}${high}:${items[1]!.name}${low}`,
  });
}

export function makeMeasureQuestion(rng: Rng, level: MeasureLevel): ChoiceQ {
  switch (level) {
    case "size":
      return makeSizeQuestion(rng);
    case "compare":
      return makeCompare(rng);
    case "ruler":
      return makeRuler(rng);
    case "picture":
      return makeGraph(rng, "picture");
    case "bar":
      return makeGraph(rng, "bar");
    case "more":
      return makeMore(rng);
    case "area":
      return makeAreaQuestion(rng, "area");
    case "perimeter":
      return makeAreaQuestion(rng, "perimeter");
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const safe: MeasureLevel = isMeasureLevel(level) ? level : "compare";
  switch (safe) {
    case "size":
    case "area":
    case "perimeter": {
      const printed = spanSheet(rng, "measure", safe);
      if (printed) return printed;
      return { prompt: t("Which is bigger, a seed or a pumpkin?", "¿Qué es más grande, una semilla o una calabaza?"), answer: "pumpkin" };
    }
    case "compare": {
      const a = rng.int(1, 12);
      let b = rng.int(1, 12);
      if (b === a) b = a === 12 ? 1 : a + 1;
      const longer = rng.next() < 0.5;
      return {
        prompt: longer
          ? t(`Which is longer, ${a} units or ${b} units?`, `¿Cuál es más largo, ${a} unidades o ${b} unidades?`, `Qual é mais comprido, ${a} unidades ou ${b} unidades?`, `Lequel est le plus long, ${a} unités ou ${b} unités ?`, `${a}单位和${b}单位，哪个更长？`, `${a} इकाई या ${b} इकाई में से कौन लंबा है?`)
          : t(`Which is shorter, ${a} units or ${b} units?`, `¿Cuál es más corto, ${a} unidades o ${b} unidades?`, `Qual é mais curto, ${a} unidades ou ${b} unidades?`, `Lequel est le plus court, ${a} unités ou ${b} unités ?`, `${a}单位和${b}单位，哪个更短？`, `${a} इकाई या ${b} इकाई में से कौन छोटा है?`),
        answer: String(longer ? Math.max(a, b) : Math.min(a, b)),
      };
    }
    case "ruler": {
      const inches = rng.int(1, 12);
      return {
        prompt: t(
          `The ribbon goes from 0 to ${inches} on the ruler. How many inches?`,
          `El listón va del 0 al ${inches} en la regla. ¿Cuántas pulgadas son?`, `A fita vai do 0 até o ${inches} na régua. Quantas polegadas são?`,
        `Le ruban va de 0 jusqu'au ${inches} sur la règle. Combien de pouces ?`, `丝带在尺子上从0到${inches}。有几英寸？`, `रिबन रूलर पर 0 से ${inches} तक जाती है। कितने इंच?`),
        answer: String(inches),
      };
    }
    case "picture":
    case "bar": {
      const n = rng.int(1, 8);
      const icon = safe === "picture" ? "🍎" : "▮";
      return {
        prompt: t(`The graph shows ${icon.repeat(n)} apples. How many apples?`, `La gráfica muestra ${icon.repeat(n)} manzanas. ¿Cuántas manzanas hay?`, `O gráfico mostra ${icon.repeat(n)} maçãs. Quantas maçãs tem?`, `Le graphique montre ${icon.repeat(n)} pommes. Combien de pommes ?`, `统计图上有${icon.repeat(n)}。有几个苹果？`, `आलेख ${icon.repeat(n)} सेब दिखाता है। कितने सेब हैं?`),
        answer: String(n),
      };
    }
    case "more": {
      const cats = rng.int(2, 8);
      const dogs = rng.int(1, cats - 1);
      return {
        prompt: t(
          `There are ${cats} cats and ${dogs} dogs. How many more cats?`,
          `Hay ${cats} gatos y ${dogs} perros. ¿Cuántos gatos más hay?`, `Tem ${cats} gatos e ${dogs} cachorros. Quantos gatos a mais tem?`,
        `Il y a ${cats} chats et ${dogs} chiens. Combien de chats de plus ?`, `有${cats}只猫和${dogs}只狗。猫多几只？`, `${cats} बिल्लियाँ और ${dogs} कुत्ते हैं। बिल्लियाँ कितनी अधिक हैं?`),
        answer: String(cats - dogs),
      };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}

export function MeasurePrompt({ question, reveal, mascot, happy }: PromptProps) {
  void reveal;
  if (question.visual.kind !== "scene" || question.visual.board.game !== "measure") return null;
  const board = question.visual.board;
  return (
    <SceneCard
      title={question.title}
      mascot={mascot}
      happy={happy}
      hint={question.hint}
      hands={question.visual.hands}
      answer={question.answer}
    >
      <MeasureArt board={board} />
    </SceneCard>
  );
}

function MeasureArt({ board }: { board: MeasureBoard }) {
  switch (board.mode) {
    case "size":
      return (
        <div className="ac-size-row">
          <SizeDot n={1} />
          <SizeDot n={4} />
        </div>
      );
    case "compare":
      return <p className="ac-big-num">{board.ask === "longest" ? t("Longest", "El más largo") : t("Shortest", "El más corto")}</p>;
    case "ruler":
      return <Ruler inches={board.inches} />;
    case "picture":
      return <PictureGraph items={board.items} />;
    case "bar":
      return <BarGraph items={board.items} />;
    case "more":
      return <PictureGraph items={board.items} />;
    case "area":
    case "perimeter":
      return <RectFig length={board.length} width={board.width} label={board.mode} />;
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

export const measureGame = sceneModule({
  ...measureCard,
  short: "Measurement",
  makeQuestion: (rng, level) => makeMeasureQuestion(rng, isMeasureLevel(level) ? level : "compare"),
  makeSheetItem: sheetItem,
  Prompt: MeasurePrompt,
});
