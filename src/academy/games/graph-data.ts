import type { Rng } from "@/lib/rng";
import {
  frenchDe,
  frenchThan,
  howManyLessPhrase,
  howManyMorePhrase,
  howManyPhrase,
  nounIsFeminine,
  countedNoun,
  nounMeasure,
  t,
  thingName,
} from "../i18n";
import type { GraphAsk, GraphCat, GraphShape, GraphsBoard } from "./boards";
import { nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

export const GRAPH_LEVELS = ["sort", "tally", "picture", "bar", "scale", "line"] as const;
export type GraphLevel = (typeof GRAPH_LEVELS)[number];

const CATS = [
  { name: "apple", emoji: "🍎", plural: "apples" },
  { name: "banana", emoji: "🍌", plural: "bananas" },
  { name: "carrot", emoji: "🥕", plural: "carrots" },
  { name: "bone", emoji: "🦴", plural: "bones" },
  { name: "candy", emoji: "🍭", plural: "candies" },
  { name: "bug", emoji: "🐛", plural: "bugs" },
] as const;

const DENS = [2, 4, 8] as const;

export interface GraphsTask {
  kind: "graphs";
  mode: GraphLevel;
  cats: { name: string; emoji: string; icons: number }[];
  scale: number;
  shape: GraphShape;
  den: number;
  stacks: number[];
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export interface GraphBenchSpec {
  mode: GraphLevel;
  shape: GraphShape;
  cats: { name: string; emoji: string; icons: number }[];
  scale: number;
  den: number;
  stacks: number[];
}

export function isGraphLevel(value: unknown): value is GraphLevel {
  return typeof value === "string" && (GRAPH_LEVELS as readonly string[]).includes(value);
}

export function graphAnswer(board: GraphsBoard): string {
  if (board.ask === "span" || board.ask === "sum") return `${graphNumber(board)}/${board.den}`;
  return String(graphNumber(board));
}

export function graphNumber(board: GraphsBoard): number {
  const items = board.items;
  const focus = items[board.focus];
  const other = items[board.other];
  switch (board.ask) {
    case "count":
      return focus?.value ?? 0;
    case "most":
      return Math.max(0, ...items.map((item) => item.value));
    case "total":
      return items.reduce((sum, item) => sum + item.value, 0);
    case "diff":
    case "less":
      return Math.abs((focus?.value ?? 0) - (other?.value ?? 0));
    case "join":
      return (focus?.value ?? 0) + (other?.value ?? 0);
    case "apart":
      return items.reduce((sum, item) => sum + item.value, 0) - (focus?.value ?? 0);
    case "two": {
      const values = [...items.map((item) => item.value)].sort((a, b) => a - b);
      const small = values[0] ?? 0;
      return values.slice(1).reduce((sum, value) => sum + value, 0) - small;
    }
    case "marks":
      return board.marks.filter((mark) => mark === board.focus).length;
    case "span": {
      if (board.marks.length === 0) return 0;
      return Math.max(...board.marks) - Math.min(...board.marks);
    }
    case "sum": {
      if (board.marks.length === 0) return 0;
      return Math.max(...board.marks) + Math.min(...board.marks);
    }
    default: {
      const neverAsk: never = board.ask;
      return neverAsk;
    }
  }
}

export function specFromBoard(board: GraphsBoard): GraphBenchSpec {
  if (board.mode === "line") {
    return {
      mode: "line",
      shape: "line",
      cats: [],
      scale: 1,
      den: board.den,
      stacks: Array.from({ length: board.den + 1 }, (_, tick) => board.marks.filter((mark) => mark === tick).length),
    };
  }
  return {
    mode: board.mode,
    shape: board.shape,
    cats: board.items.map((item) => ({
      name: item.name,
      emoji: item.emoji,
      icons: Math.max(0, Math.round(item.value / Math.max(1, board.scale))),
    })),
    scale: board.scale,
    den: board.den,
    stacks: [],
  };
}

export function targetCounts(spec: GraphBenchSpec): number[] {
  if (spec.mode === "line") return spec.stacks;
  return spec.cats.map((cat) => cat.icons);
}

export function graphsMatches(task: GraphsTask, counts: readonly number[]): boolean {
  const target = task.mode === "line" ? task.stacks : task.cats.map((cat) => cat.icons);
  return target.length === counts.length && target.every((count, index) => count === counts[index]);
}

export function makeGraphsQuestion(rng: Rng, level: GraphLevel): ChoiceQ {
  switch (level) {
    case "sort":
      return makeSort(rng);
    case "tally":
      return makeTally(rng);
    case "picture":
      return makeUnit(rng, "picture");
    case "bar":
      return makeUnit(rng, "bar");
    case "scale":
      return makeScale(rng);
    case "line":
      return makeLine(rng);
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

export function makeGraphsSheet(rng: Rng, level: string): SheetItem {
  const safe: GraphLevel = isGraphLevel(level) ? level : "sort";
  switch (safe) {
    case "sort": {
      const apples = rng.int(1, 3);
      const bananas = rng.int(1, 3);
      return {
        prompt: t(
          `There are ${apples} apples and ${bananas} bananas. How many apples?`,
          `Hay ${apples} manzanas y ${bananas} plátanos. ¿Cuántas manzanas hay?`,
          `Há ${apples} maçãs e ${bananas} bananas. Quantas maçãs há?`,
        `Il y a ${apples} pommes et ${bananas} bananes. Combien de pommes ?`, `有${apples}个苹果和${bananas}根香蕉。有几个苹果？`, `${apples} सेब और ${bananas} केले हैं। कितने सेब हैं?`),
        answer: String(apples),
      };
    }
    case "tally": {
      const apples = rng.int(1, 4);
      const bananas = rng.int(1, 4);
      const carrots = rng.int(1, 4);
      if (rng.next() < 0.5) {
        return {
          prompt: t(
            `The tally is ${apples} apples, ${bananas} bananas, and ${carrots} carrots. How many in all?`,
            `El conteo es ${apples} manzanas, ${bananas} plátanos y ${carrots} zanahorias. ¿Cuántos hay en total?`,
            `A contagem é ${apples} maçãs, ${bananas} bananas e ${carrots} cenouras. Quantos há no total?`,
          `Le compte est ${apples} pommes, ${bananas} bananes et ${carrots} carottes. Combien en tout ?`, `画正字上有${apples}个苹果、${bananas}根香蕉和${carrots}根胡萝卜。一共有几个？`, `मिलान चिह्न में ${apples} सेब, ${bananas} केले, और ${carrots} गाजर हैं। कुल कितने हैं?`),
          answer: String(apples + bananas + carrots),
        };
      }
      const applesLead = apples >= bananas;
      const more = Math.max(apples, bananas);
      const fewer = Math.min(apples, bananas);
      return applesLead
        ? {
            prompt: t(
              `The tally is ${more} apples and ${fewer} bananas. How many more apples than bananas?`,
              `El conteo es ${more} manzanas y ${fewer} plátanos. ¿Cuántas manzanas más que plátanos?`,
              `A contagem é ${more} maçãs e ${fewer} bananas. Quantas maçãs a mais que bananas?`,
            `Le compte est ${more} pommes et ${fewer} bananes. Combien de pommes de plus que de bananes ?`, `画正字上有${more}个苹果和${fewer}根香蕉。苹果比香蕉多几个？`, `मिलान चिह्न में ${more} सेब और ${fewer} केले हैं। सेब केले से कितने अधिक हैं?`),
            answer: String(more - fewer),
          }
        : {
            prompt: t(
              `The tally is ${fewer} apples and ${more} bananas. How many more bananas than apples?`,
              `El conteo es ${fewer} manzanas y ${more} plátanos. ¿Cuántos plátanos más que manzanas?`,
              `A contagem é ${fewer} maçãs e ${more} bananas. Quantas bananas a mais que maçãs?`,
            `Le compte est ${fewer} pommes et ${more} bananes. Combien de bananes de plus que de pommes ?`, `画正字上有${fewer}个苹果和${more}根香蕉。香蕉比苹果多几根？`, `मिलान चिह्न में ${fewer} सेब और ${more} केले हैं। केले सेब से कितने अधिक हैं?`),
            answer: String(more - fewer),
          };
    }
    case "picture":
    case "bar": {
      const apples = rng.int(1, 5);
      const bananas = rng.int(1, 5);
      const graph = safe === "picture" ? "picture graph" : "bar graph";
      const graphHi = safe === "picture" ? "चित्र आलेख" : "दंड आलेख";
      const graphEs = safe === "picture" ? "gráfica de dibujos" : "gráfica de barras";
      const graphPt = safe === "picture" ? "gráfico de figuras" : "gráfico de barras";
      const graphFr = safe === "picture" ? "graphique à images" : "graphique en barres";
      const graphZh = safe === "picture" ? "象形统计图" : "条形统计图";
      if (rng.next() < 0.5) {
        return {
          prompt: t(
            `The ${graph} shows ${apples} apples and ${bananas} bananas. How many in all?`,
            `La ${graphEs} muestra ${apples} manzanas y ${bananas} plátanos. ¿Cuántos hay en total?`,
            `O ${graphPt} mostra ${apples} maçãs e ${bananas} bananas. Quantos há no total?`,
          `Le ${graphFr} montre ${apples} pommes et ${bananas} bananes. Combien en tout ?`, `${graphZh}上有${apples}个苹果和${bananas}根香蕉。一共有几个？`, `${graphHi} ${apples} सेब और ${bananas} केले दिखाता है। कुल कितने हैं?`),
          answer: String(apples + bananas),
        };
      }
      const applesLead = apples >= bananas;
      const more = Math.max(apples, bananas);
      const fewer = Math.min(apples, bananas);
      return applesLead
        ? {
            prompt: t(
              `The ${graph} shows ${more} apples and ${fewer} bananas. How many more apples than bananas?`,
              `La ${graphEs} muestra ${more} manzanas y ${fewer} plátanos. ¿Cuántas manzanas más que plátanos?`,
              `O ${graphPt} mostra ${more} maçãs e ${fewer} bananas. Quantas maçãs a mais que bananas?`,
            `Le ${graphFr} montre ${more} pommes et ${fewer} bananes. Combien de pommes de plus que de bananes ?`, `${graphZh}上有${more}个苹果和${fewer}根香蕉。苹果比香蕉多几个？`, `${graphHi} ${more} सेब और ${fewer} केले दिखाता है। सेब केले से कितने अधिक हैं?`),
            answer: String(more - fewer),
          }
        : {
            prompt: t(
              `The ${graph} shows ${fewer} apples and ${more} bananas. How many more bananas than apples?`,
              `La ${graphEs} muestra ${fewer} manzanas y ${more} plátanos. ¿Cuántos plátanos más que manzanas?`,
              `O ${graphPt} mostra ${fewer} maçãs e ${more} bananas. Quantas bananas a mais que maçãs?`,
            `Le ${graphFr} montre ${fewer} pommes et ${more} bananes. Combien de bananes de plus que de pommes ?`, `${graphZh}上有${fewer}个苹果和${more}根香蕉。香蕉比苹果多几根？`, `${graphHi} ${fewer} सेब और ${more} केले दिखाता है। केले सेब से कितने अधिक हैं?`),
            answer: String(more - fewer),
          };
    }
    case "scale": {
      const scale = rng.next() < 0.5 ? 2 : 5;
      const icons = rng.int(1, 4);
      return {
        prompt: t(
          `Each picture stands for ${scale}. The graph shows ${icons} apple pictures. How many apples?`,
          `Cada dibujo vale ${scale}. La gráfica muestra ${icons} dibujos de manzana. ¿Cuántas manzanas hay?`,
          `Cada figura vale ${scale}. O gráfico mostra ${icons} figuras de maçã. Quantas maçãs há?`,
        `Chaque image vaut ${scale}. Le graphique montre ${icons} images de pomme. Combien de pommes ?`, `每个图代表${scale}。统计图上有${icons}个苹果图。有几个苹果？`, `हर चित्र ${scale} दर्शाता है। आलेख में ${icons} सेब के चित्र हैं। कितने सेब हैं?`),
        answer: String(scale * icons),
      };
    }
    case "line": {
      const den = rng.pick([...DENS]);
      const high = rng.int(1, den);
      let low = rng.int(0, high - 1);
      if (low === high) low = 0;
      const askSpan = rng.next() < 0.5;
      return askSpan
        ? {
            prompt: t(
              `The longest is ${high}/${den} and the shortest is ${low}/${den}. How much longer is the longest?`,
              `El más largo mide ${high}/${den} y el más corto mide ${low}/${den}. ¿Cuánto más mide el más largo?`,
              `O mais comprido mede ${high}/${den} e o mais curto mede ${low}/${den}. Quanto o mais comprido é maior?`,
            `Le plus long mesure ${high}/${den} et le plus court mesure ${low}/${den}. De combien le plus long dépasse-t-il le plus court ?`, `最长是${high}/${den}，最短是${low}/${den}。最长比最短长多少？`, `सबसे लंबा ${high}/${den} है और सबसे छोटा ${low}/${den}। सबसे लंबा कितना अधिक लंबा है?`),
            answer: `${high - low}/${den}`,
          }
        : {
            prompt: t(
              `The longest is ${high}/${den} and the shortest is ${low}/${den}. What do they make together?`,
              `El más largo mide ${high}/${den} y el más corto mide ${low}/${den}. ¿Cuánto miden juntos?`,
              `O mais comprido mede ${high}/${den} e o mais curto mede ${low}/${den}. Quanto medem juntos?`,
            `Le plus long mesure ${high}/${den} et le plus court mesure ${low}/${den}. Combien font-ils ensemble ?`, `最长是${high}/${den}，最短是${low}/${den}。加在一起是多少？`, `सबसे लंबा ${high}/${den} है और सबसे छोटा ${low}/${den}। दोनों साथ में कितना बनते हैं?`),
            answer: `${high + low}/${den}`,
          };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}

export function makeGraphsTask(level: string, rng: Rng, avoid?: string): GraphsTask {
  const safe: GraphLevel = isGraphLevel(level) ? level : "sort";
  let task = rollTask(safe, rng);
  for (let i = 0; i < 12 && avoid && task.factKey === avoid; i += 1) task = rollTask(safe, rng);
  return task;
}

/** Every title, hint, and praise shape the game can speak, in the active language. */
export function graphClipLines(): string[] {
  const lines = new Set<string>();
  const add = (line: string) => {
    const text = line.trim();
    if (text) lines.add(text);
  };
  const sample = (cat: (typeof CATS)[number], value: number): GraphCat => ({ ...cat, value });
  for (const cat of CATS) {
    add(countTitle(sample(cat, 2)));
    add(apartTitle(sample(cat, 2)));
    add(scaleCountTitle(sample(cat, 4), 2));
    add(scaleCountTitle(sample(cat, 10), 5));
    for (const other of CATS) {
      if (other.name === cat.name) continue;
      add(diffTitle(sample(cat, 3), sample(other, 1)));
      add(lessTitle(sample(other, 1), sample(cat, 3)));
      add(joinTitle(sample(cat, 2), sample(other, 2)));
    }
  }
  add(mostTitle());
  add(totalTitle());
  add(twoTitle());
  add(spanTitle());
  add(sumTitle());
  for (const den of DENS) {
    for (let num = 0; num <= den; num += 1) add(marksTitle(num, den));
    for (let num = 0; num <= den * 2 + 3; num += 1) {
      add(`${num}/${den}`);
      add(t(`Yes! ${num}/${den}`, `¡Sí! ${num}/${den}`, `Sim! ${num}/${den}`, `Oui ! ${num}/${den}`, `对！${num}/${den}`, `हाँ! ${num}/${den}`));
      add(t(`Almost! ${num}/${den}`, `¡Casi! ${num}/${den}`, `Quase! ${num}/${den}`, `Presque ! ${num}/${den}`, `差一点！${num}/${den}`, `लगभग! ${num}/${den}`));
    }
  }
  for (const line of HINTS) add(line());
  for (const line of TEACH) add(line());
  add(t("Each picture is 2", "Cada dibujo vale 2"));
  add(t("Each picture is 5", "Cada dibujo vale 5"));
  add(handsSpeech("sort", 1));
  add(handsSpeech("tally", 1));
  add(handsSpeech("picture", 1));
  add(handsSpeech("bar", 1));
  add(handsSpeech("scale", 2));
  add(handsSpeech("scale", 5));
  add(handsSpeech("line", 1));
  add(t("Yes! The graph is ready.", "¡Sí! La gráfica está lista."));
  add(t("Yes! 4 in all", "¡Sí! 4 en total"));
  add(t("Almost! 4 in all", "¡Casi! 4 en total"));
  add(t("Yes! 2 more", "¡Sí! 2 más"));
  add(t("Almost! 2 more", "¡Casi! 2 más"));
  add(t("Yes! 2 less", "¡Sí! 2 menos"));
  add(t("Almost! 2 less", "¡Casi! 2 menos"));
  add(t("Yes! 3 others", "¡Sí! 3 otros"));
  add(t("Almost! 3 others", "¡Casi! 3 otros"));
  add(t("Yes! 2 marks", "¡Sí! 2 marcas"));
  add(t("Almost! 2 marks", "¡Casi! 2 marcas"));
  for (const cat of CATS) {
    const word = thingName(cat.name, 2, cat.plural);
    add(t(`Yes! 3 ${cat.plural}`, `¡Sí! 3 ${word}`, `Sim! 3 ${word}`, `Oui ! 3 ${word}`, `对！${countedNoun(cat.name, 3)}`, `हाँ! 3 ${thingName(cat.name, 3, cat.plural)}`));
    add(t(`Almost! 3 ${cat.plural}`, `¡Casi! 3 ${word}`, `Quase! 3 ${word}`, `Presque ! 3 ${word}`, `差一点！${countedNoun(cat.name, 3)}`, `लगभग! 3 ${thingName(cat.name, 3, cat.plural)}`));
  }
  return [...lines];
}

function makeSort(rng: Rng): ChoiceQ {
  const items = pickCats(rng, 2, [rng.int(1, 3), rng.int(1, 3)]);
  const maxAt = uniqueIndex(items.map((item) => item.value), Math.max(...items.map((item) => item.value)));
  const ask: GraphAsk = maxAt != null && rng.next() < 0.5 ? "most" : "count";
  const focus = ask === "most" ? maxAt! : rng.int(0, items.length - 1);
  const board = boardOf("sort", items, ask, focus, 0, 1, "bins", 2, []);
  const focusCat = items[focus]!;
  return finish(rng, board, ask === "most" ? mostTitle() : countTitle(focusCat), hintFor(ask), solvedFor(board));
}

function makeTally(rng: Rng): ChoiceQ {
  const items = pickCats(rng, 3, spread(rng, 3, 1, 3, 6));
  const ask = rng.pick(["count", "total", "diff", "less"] as const);
  return compareQuestion(rng, "tally", items, ask, "tally");
}

function makeUnit(rng: Rng, mode: "picture" | "bar"): ChoiceQ {
  const count = mode === "bar" ? 4 : 3;
  const items = pickCats(rng, count, spread(rng, count, 1, mode === "bar" ? 2 : 3, 6));
  const ask = rng.pick(["join", "apart", "diff"] as const);
  return compareQuestion(rng, mode, items, ask, mode);
}

function makeScale(rng: Rng): ChoiceQ {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const scale = rng.next() < 0.5 ? 2 : 5;
    const icons = spread(rng, 3, 1, 3, 6);
    const items = pickCats(rng, 3, icons.map((count) => count * scale));
    const ask = rng.pick(["count", "diff", "less", "two"] as const);
    const shape: GraphShape = rng.next() < 0.5 ? "picture" : "bar";
    const values = items.map((item) => item.value);
    if (ask === "two" && uniqueIndex(values, Math.min(...values)) == null) continue;
    if ((ask === "diff" || ask === "less") && !differentPair(items)) continue;
    if (ask === "count") {
      const focus = rng.int(0, items.length - 1);
      const board = boardOf("scale", items, "count", focus, 0, scale, shape, 2, []);
      return finish(rng, board, scaleCountTitle(items[focus]!, scale), hintFor("count"), solvedFor(board), [icons[focus] ?? 1]);
    }
    if (ask === "two") {
      const board = boardOf("scale", items, "two", 0, 1, scale, shape, 2, []);
      return finish(rng, board, twoTitle(), hintFor("two"), solvedFor(board));
    }
    return compareQuestion(rng, "scale", items, ask, shape, scale);
  }
  const items = pickCats(rng, 3, [2, 4, 6]);
  const board = boardOf("scale", items, "count", 0, 1, 2, "picture", 2, []);
  return finish(rng, board, scaleCountTitle(items[0]!, 2), hintFor("count"), solvedFor(board), [1]);
}

function makeLine(rng: Rng): ChoiceQ {
  const den = rng.pick([...DENS]);
  const marks = Array.from({ length: 5 }, () => rng.int(1, den));
  if (new Set(marks).size < 2) marks[0] = marks[0] === den ? 1 : den;
  const ask = rng.pick(["marks", "span", "sum"] as const);
  const focus = ask === "marks" ? rng.pick(marks) : 0;
  const board = boardOf("line", [], ask, focus, 0, 1, "line", den, marks);
  const title = ask === "marks" ? marksTitle(focus, den) : ask === "span" ? spanTitle() : sumTitle();
  return finish(rng, board, title, hintFor(ask), solvedFor(board));
}

function compareQuestion(
  rng: Rng,
  mode: GraphLevel,
  items: GraphCat[],
  ask: "count" | "total" | "diff" | "less" | "join" | "apart",
  shape: GraphShape,
  scale = 1,
): ChoiceQ {
  let nextAsk = ask;
  let focus = rng.int(0, items.length - 1);
  let other = (focus + 1) % items.length;
  if (nextAsk === "diff" || nextAsk === "less" || nextAsk === "join") {
    const pair = differentPair(items);
    if (!pair) return compareQuestion(rng, mode, nudge(items, scale), ask, shape, scale);
    focus = nextAsk === "less" ? pair.low : pair.high;
    other = nextAsk === "less" ? pair.high : pair.low;
    if (nextAsk === "join") {
      focus = pair.high;
      other = pair.low;
    }
  }
  const board = boardOf(mode, items, nextAsk, focus, other, scale, shape, 2, []);
  const title = titleFor(board);
  const extras = scale > 1 && nextAsk === "count" ? [Math.round((items[focus]?.value ?? scale) / scale)] : [];
  return finish(rng, board, title, hintFor(nextAsk), solvedFor(board), extras);
}

function finish(
  rng: Rng,
  board: GraphsBoard,
  title: string,
  hint: string,
  solved: string,
  extras: number[] = [],
): ChoiceQ {
  const answer = graphAnswer(board);
  const choices =
    board.ask === "span" || board.ask === "sum"
      ? fractionChoices(rng, graphNumber(board), board.den)
      : nearChoices(rng, graphNumber(board), 0, Math.max(12, graphNumber(board) + 8), extras);
  const labels = Object.fromEntries(board.items.map((item) => [item.name, thingName(item.name, 1, item.name)]));
  return sceneQuestion(rng, {
    game: "graphs",
    title,
    hint,
    answer,
    choices,
    skill: `graphs:${board.mode}`,
    tags: [board.mode, board.ask],
    solved,
    picture: board.mode === "line" ? `${board.marks.length}` : (board.items[0]?.emoji ?? "📊"),
    hands: true,
    quietChoices: false,
    labels,
    board,
    factKey: factOf(board),
  });
}

function boardOf(
  mode: GraphLevel,
  items: GraphCat[],
  ask: GraphAsk,
  focus: number,
  other: number,
  scale: number,
  shape: GraphShape,
  den: 2 | 4 | 8,
  marks: number[],
): GraphsBoard {
  return { game: "graphs", mode, items, ask, focus, other, scale, shape, den, marks };
}

function titleFor(board: GraphsBoard): string {
  const focus = board.items[board.focus];
  const other = board.items[board.other];
  switch (board.ask) {
    case "count":
      return board.scale > 1 && focus ? scaleCountTitle(focus, board.scale) : countTitle(focus ?? board.items[0]!);
    case "most":
      return mostTitle();
    case "total":
      return totalTitle();
    case "diff":
      return diffTitle(focus!, other!);
    case "less":
      return lessTitle(focus!, other!);
    case "join":
      return joinTitle(focus!, other!);
    case "apart":
      return apartTitle(focus!);
    case "two":
      return twoTitle();
    case "marks":
      return marksTitle(board.focus, board.den);
    case "span":
      return spanTitle();
    case "sum":
      return sumTitle();
    default: {
      const neverAsk: never = board.ask;
      return neverAsk;
    }
  }
}

function solvedFor(board: GraphsBoard): string {
  const n = graphNumber(board);
  const focus = board.items[board.focus];
  switch (board.ask) {
    case "count":
    case "most":
      return countSolved(focus ?? namedMax(board), n);
    case "total":
    case "join":
      return t(`${n} in all`, `${n} en total`, `${n} no total`, `${n} en tout`, `一共${n}个`, `कुल ${n}`);
    case "diff":
    case "two":
      return t(`${n} more`, `${n} más`, `${n} a mais`, `${n} de plus`, `多${n}个`, `${n} अधिक`);
    case "less":
      return t(`${n} less`, `${n} menos`, `${n} a menos`, `${n} de moins`, `少${n}个`, `${n} कम`);
    case "apart":
      return t(`${n} others`, `${n} otros`, `${n} outros`, `${n} autres`, `另外${n}个`, `${n} और`);
    case "marks":
      return t(
        `${n} ${n === 1 ? "mark" : "marks"}`,
        n === 1 ? `${n} marca` : `${n} marcas`,
        n === 1 ? `${n} marca` : `${n} marcas`,
      n === 1 ? `${n} marque` : `${n} marques`, `${n}笔`, `${n} चिह्न`);
    case "span":
    case "sum":
      return `${n}/${board.den}`;
    default: {
      const neverAsk: never = board.ask;
      return neverAsk;
    }
  }
}

function countSolved(cat: GraphCat | undefined, n: number): string {
  if (!cat) return String(n);
  const en = n === 1 ? cat.name : cat.plural;
  return t(`${n} ${en}`, `${n} ${thingName(cat.name, n, en)}`, `${n} ${thingName(cat.name, n, en)}`, `${n} ${thingName(cat.name, n, en)}`, countedNoun(cat.name, n), `${n} ${thingName(cat.name, n, en)}`);
}

function namedMax(board: GraphsBoard): GraphCat | undefined {
  return board.items.reduce<GraphCat | undefined>((best, item) => (!best || item.value > best.value ? item : best), undefined);
}

function countTitle(cat: GraphCat): string {
  return t(`How many ${cat.plural}?`, `¿${howManyPhrase(cat.name, 2, cat.plural)} hay?`, `${howManyPhrase(cat.name, 2, cat.plural)} há?`, `${howManyPhrase(cat.name, 2, cat.plural)} y a-t-il ?`, `${howManyPhrase(cat.name, 2, cat.plural)}？`, `${howManyPhrase(cat.name, 2, cat.plural)}?`);
}

function mostTitle(): string {
  return t("How many are in the group with more?", "¿Cuántos hay en el grupo que tiene más?");
}

function totalTitle(): string {
  return t("How many in all?", "¿Cuántos hay en total?");
}

function diffTitle(more: GraphCat, less: GraphCat): string {
  return t(
    `How many more ${more.plural} than ${less.plural}?`,
    `¿${howManyMorePhrase(more.name, more.plural)} más que ${thingName(less.name, 2, less.plural)}?`,
    `${howManyMorePhrase(more.name, more.plural)} a mais que ${thingName(less.name, 2, less.plural)}?`,
  `${howManyMorePhrase(more.name, more.plural)} de plus ${frenchThan(thingName(less.name, 2, less.plural))} ?`, `${thingName(more.name, 2, more.plural)}比${thingName(less.name, 2, less.plural)}多几${nounMeasure(more.name)}？`, `${thingName(more.name, 2, more.plural)} ${thingName(less.name, 2, less.plural)} से ${nounIsFeminine(more.name) ? "कितनी" : "कितने"} अधिक हैं?`);
}

function lessTitle(fewer: GraphCat, more: GraphCat): string {
  return t(
    `How many less ${fewer.plural} than ${more.plural}?`,
    `¿${howManyLessPhrase(fewer.name, fewer.plural)} menos que ${thingName(more.name, 2, more.plural)}?`,
    `${howManyLessPhrase(fewer.name, fewer.plural)} a menos que ${thingName(more.name, 2, more.plural)}?`,
  `${howManyLessPhrase(fewer.name, fewer.plural)} de moins ${frenchThan(thingName(more.name, 2, more.plural))} ?`, `${thingName(fewer.name, 2, fewer.plural)}比${thingName(more.name, 2, more.plural)}少几${nounMeasure(fewer.name)}？`, `${thingName(fewer.name, 2, fewer.plural)} ${thingName(more.name, 2, more.plural)} से ${nounIsFeminine(fewer.name) ? "कितनी" : "कितने"} कम हैं?`);
}

function joinTitle(a: GraphCat, b: GraphCat): string {
  const left = thingName(a.name, 2, a.plural);
  const right = thingName(b.name, 2, b.plural);
  const fem = nounIsFeminine(a.name) && nounIsFeminine(b.name);
  const lead = fem ? "Cuántas" : "Cuántos";
  const leadPt = fem ? "Quantas" : "Quantos";
  return t(
    `How many ${a.plural} and ${b.plural} in all?`,
    `¿${lead} ${left} y ${right} hay en total?`,
    `${leadPt} ${left} e ${right} há no total?`,
  `Combien ${frenchDe(left)} et ${frenchDe(right)} y a-t-il en tout ?`, `${thingName(a.name, 2, a.plural)}和${thingName(b.name, 2, b.plural)}一共有几个？`, `${thingName(a.name, 2, a.plural)} और ${thingName(b.name, 2, b.plural)} कुल ${nounIsFeminine(a.name) && nounIsFeminine(b.name) ? "कितनी" : "कितने"} हैं?`);
}

function apartTitle(cat: GraphCat): string {
  return t(
    `How many are not ${cat.plural}?`,
    `¿Cuántos no son ${thingName(cat.name, 2, cat.plural)}?`,
    `Quantos não são ${thingName(cat.name, 2, cat.plural)}?`,
  `Combien ne sont pas des ${thingName(cat.name, 2, cat.plural)} ?`, `不是${thingName(cat.name, 2, cat.plural)}的有几个？`, `${howManyPhrase(cat.name, 2, cat.plural)} नहीं हैं?`);
}

function scaleCountTitle(cat: GraphCat, scale: number): string {
  return t(
    `Each picture stands for ${scale}. How many ${cat.plural}?`,
    `Cada dibujo vale ${scale}. ¿${howManyPhrase(cat.name, 2, cat.plural)} hay?`,
    `Cada figura vale ${scale}. ${howManyPhrase(cat.name, 2, cat.plural)} há?`,
  `Chaque image vaut ${scale}. ${howManyPhrase(cat.name, 2, cat.plural)} y a-t-il ?`, `每个图代表${scale}。${howManyPhrase(cat.name, 2, cat.plural)}？`, `हर चित्र ${scale} दर्शाता है। ${howManyPhrase(cat.name, 2, cat.plural)}?`);
}

function twoTitle(): string {
  return t(
    "How many more are the two larger groups than the smallest?",
    "¿Cuántos más hay en los dos grupos grandes que en el más chico?",
  );
}

function marksTitle(num: number, den: number): string {
  return t(`How many are ${num}/${den}?`, `¿Cuántos miden ${num}/${den}?`, `Quantos medem ${num}/${den}?`, `Combien en mesurent ${num}/${den} ?`, `有几个是${num}/${den}？`, `कितने ${num}/${den} हैं?`);
}

function spanTitle(): string {
  return t("How much longer is the longest than the shortest?", "¿Cuánto más mide el más largo que el más corto?");
}

function sumTitle(): string {
  return t("What do the longest and the shortest make together?", "¿Cuánto miden juntos el más largo y el más corto?");
}

const HINTS = [
  () => t("Sort each picture", "Ordena cada dibujo"),
  () => t("Count that group", "Cuenta ese grupo"),
  () => t("Count every picture", "Cuenta todos los dibujos"),
  () => t("Subtract the smaller number", "Resta el número más chico"),
  () => t("Add the two groups", "Suma los dos grupos"),
  () => t("Take that group away from the total", "Quita ese grupo del total"),
  () => t("Add the two larger groups first", "Suma primero los dos grupos grandes"),
  () => t("Use the key", "Usa la clave"),
  () => t("Count the marks", "Cuenta las marcas"),
  () => t("Look at the ends", "Mira los extremos"),
] as const;

const TEACH = [
  () => t("Sort, then count", "Ordena y luego cuenta"),
  () => t("Read the tally", "Lee el conteo"),
  () => t("Read the graph", "Lee la gráfica"),
  () => t("Read the line plot", "Lee el diagrama de puntos"),
] as const;

function hintFor(ask: GraphAsk): string {
  switch (ask) {
    case "count":
    case "most":
      return t("Count that group", "Cuenta ese grupo");
    case "total":
      return t("Count every picture", "Cuenta todos los dibujos");
    case "diff":
    case "less":
      return t("Subtract the smaller number", "Resta el número más chico");
    case "join":
      return t("Add the two groups", "Suma los dos grupos");
    case "apart":
      return t("Take that group away from the total", "Quita ese grupo del total");
    case "two":
      return t("Add the two larger groups first", "Suma primero los dos grupos grandes");
    case "marks":
      return t("Count the marks", "Cuenta las marcas");
    case "span":
    case "sum":
      return t("Look at the ends", "Mira los extremos");
    default: {
      const neverAsk: never = ask;
      return neverAsk;
    }
  }
}

export function graphsTeachCaption(board: GraphsBoard): string {
  switch (board.mode) {
    case "sort":
      return t("Sort, then count", "Ordena y luego cuenta");
    case "tally":
      return t("Read the tally", "Lee el conteo");
    case "picture":
    case "bar":
      return t("Read the graph", "Lee la gráfica");
    case "scale":
      return t(`Each picture is ${board.scale}`, `Cada dibujo vale ${board.scale}`, `Cada figura vale ${board.scale}`, `Chaque image vaut ${board.scale}`, `每个图代表${board.scale}`, `हर चित्र ${board.scale} है`);
    case "line":
      return t("Read the line plot", "Lee el diagrama de puntos");
    default: {
      const neverMode: never = board.mode;
      return neverMode;
    }
  }
}

function handsSpeech(mode: GraphLevel, scale: number): string {
  switch (mode) {
    case "sort":
      return t("Sort the pictures.", "Ordena los dibujos.");
    case "tally":
      return t("Make the tally.", "Haz el conteo.");
    case "picture":
      return t("Make the picture graph.", "Haz la gráfica de dibujos.");
    case "bar":
      return t("Make the bar graph.", "Haz la gráfica de barras.");
    case "scale":
      return t(`Each picture stands for ${scale}. Make the graph.`, `Cada dibujo vale ${scale}. Haz la gráfica.`, `Cada figura vale ${scale}. Monte o gráfico.`, `Chaque image vaut ${scale}. Fais le graphique.`, `每个图代表${scale}。把统计图做出来。`, `हर चित्र ${scale} दर्शाता है। आलेख बनाओ।`);
    case "line":
      return t("Make the line plot.", "Haz el diagrama de puntos.");
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
}

function rollTask(level: GraphLevel, rng: Rng): GraphsTask {
  const praise = t("Yes! The graph is ready.", "¡Sí! La gráfica está lista.");
  if (level === "line") {
    const den = rng.pick([...DENS]);
    const marks = Array.from({ length: 4 }, () => rng.int(1, den));
    const stacks = Array.from({ length: den + 1 }, (_, tick) => marks.filter((mark) => mark === tick).length);
    return {
      kind: "graphs",
      mode: "line",
      cats: [],
      scale: 1,
      shape: "line",
      den,
      stacks,
      speech: handsSpeech("line", 1),
      skill: "graphs:line",
      factKey: `line:${den}:${marks.join(".")}`,
      praise,
    };
  }
  const scale = level === "scale" ? (rng.next() < 0.5 ? 2 : 5) : 1;
  const count = level === "sort" ? 2 : level === "bar" ? 3 : 3;
  const icons = spread(rng, count, 1, level === "sort" ? 2 : 2, level === "sort" ? 4 : 6);
  const cats = pickCats(rng, count, icons).map((cat, index) => ({
    name: cat.name,
    emoji: cat.emoji,
    icons: icons[index] ?? 1,
  }));
  const shape = shapeFor(level, rng);
  return {
    kind: "graphs",
    mode: level,
    cats,
    scale,
    shape,
    den: 2,
    stacks: [],
    speech: handsSpeech(level, scale),
    skill: `graphs:${level}`,
    factKey: `${level}:${scale}:${cats.map((cat) => `${cat.name}${cat.icons}`).join("-")}:${shape}`,
    praise,
  };
}

function shapeFor(level: GraphLevel, rng: Rng): GraphShape {
  switch (level) {
    case "sort":
      return "bins";
    case "tally":
      return "tally";
    case "picture":
      return "picture";
    case "bar":
      return "bar";
    case "scale":
      return rng.next() < 0.5 ? "picture" : "bar";
    case "line":
      return "line";
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function pickCats(rng: Rng, count: number, values: number[]): GraphCat[] {
  return rng.shuffle([...CATS]).slice(0, count).map((cat, index) => ({ ...cat, value: values[index] ?? 1 }));
}

function spread(rng: Rng, count: number, lo: number, hi: number, maxSum: number): number[] {
  const values = Array.from({ length: count }, () => rng.int(lo, hi));
  let guard = 0;
  while (values.reduce((sum, value) => sum + value, 0) > maxSum && guard < 12) {
    guard += 1;
    const index = values.indexOf(Math.max(...values));
    if ((values[index] ?? lo) <= lo) break;
    values[index] = (values[index] ?? lo) - 1;
  }
  return values;
}

function nudge(items: GraphCat[], scale: number): GraphCat[] {
  const step = Math.max(1, scale);
  return items.map((item, index) => (index === 0 ? { ...item, value: item.value + step } : item));
}

function differentPair(items: GraphCat[]): { high: number; low: number } | null {
  let high = 0;
  let low = 0;
  items.forEach((item, index) => {
    if (item.value > items[high]!.value) high = index;
    if (item.value < items[low]!.value) low = index;
  });
  if (items[high]!.value === items[low]!.value) return null;
  return { high, low };
}

function uniqueIndex(values: number[], target: number): number | null {
  const hits = values.map((value, index) => (value === target ? index : -1)).filter((index) => index >= 0);
  return hits.length === 1 ? hits[0]! : null;
}

function fractionChoices(rng: Rng, num: number, den: number): string[] {
  const answer = `${num}/${den}`;
  const pool: string[] = [];
  const hi = Math.max(den + 2, num + 3);
  for (let n = 0; n <= hi; n += 1) {
    if (n !== num) pool.push(`${n}/${den}`);
  }
  return uniqueChoices(rng, answer, pool);
}

function factOf(board: GraphsBoard): string {
  if (board.mode === "line") return `line:${board.ask}:${board.den}:${board.marks.join(".")}:${board.focus}`;
  const body = board.items.map((item) => `${item.name}${item.value}`).join("-");
  return `${board.mode}:${board.ask}:${board.scale}:${body}:${board.focus}:${board.other}`;
}
