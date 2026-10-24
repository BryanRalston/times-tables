import type { Rng } from "@/lib/rng";
import { t } from "../i18n";
import type { GridBoard, GridLevel } from "./boards";
import { nearChoices, sceneQuestion } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

export const GRID_LEVELS = ["tiles", "fence", "side"] as const;

/** Irregular polyominoes. A full rectangle would repeat the shapes game. */
const FIGURES: readonly (readonly (readonly [number, number])[])[] = [
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[1, 0], [2, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1], [2, 0]],
  [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1]],
];

export interface GridTask {
  kind: "grid";
  mode: GridLevel;
  cells: [number, number][];
  rows: number;
  cols: number;
  edges: number;
  known: number;
  missing: number;
  useArea: boolean;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export function isGridLevel(value: unknown): value is GridLevel {
  return typeof value === "string" && (GRID_LEVELS as readonly string[]).includes(value);
}

export function gridBounds(cells: readonly (readonly [number, number])[]): { rows: number; cols: number } {
  const rows = Math.max(0, ...cells.map(([, y]) => y)) + 1;
  const cols = Math.max(0, ...cells.map(([x]) => x)) + 1;
  return { rows, cols };
}

export function sharedSides(cells: readonly (readonly [number, number])[]): number {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  let shared = 0;
  for (const [x, y] of cells) {
    if (set.has(`${x + 1},${y}`)) shared += 1;
    if (set.has(`${x},${y + 1}`)) shared += 1;
  }
  return shared;
}

export function gridPerimeter(cells: readonly (readonly [number, number])[]): number {
  return cells.length * 4 - sharedSides(cells) * 2;
}

export type GridEdge = { x: number; y: number; side: "n" | "e" | "s" | "w" };

export function exposedEdges(cells: readonly (readonly [number, number])[]): GridEdge[] {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  const edges: GridEdge[] = [];
  for (const [x, y] of cells) {
    if (!set.has(`${x},${y - 1}`)) edges.push({ x, y, side: "n" });
    if (!set.has(`${x + 1},${y}`)) edges.push({ x, y, side: "e" });
    if (!set.has(`${x},${y + 1}`)) edges.push({ x, y, side: "s" });
    if (!set.has(`${x - 1},${y}`)) edges.push({ x, y, side: "w" });
  }
  return edges;
}

export function gridAnswer(task: Pick<GridTask, "mode" | "cells" | "edges" | "missing">): number {
  switch (task.mode) {
    case "tiles":
      return task.cells.length;
    case "fence":
      return task.edges;
    case "side":
      return task.missing;
    default: {
      const neverMode: never = task.mode;
      return neverMode;
    }
  }
}

function sizeTitle(rows: number, cols: number, around: boolean): string {
  if (around) {
    return t(
      `This shape is ${rows} tall and ${cols} wide. How many units around?`,
      `Esta figura mide ${rows} de alto y ${cols} de ancho. ¿Cuántas unidades hay alrededor?`,
      `Esta figura tem ${rows} de altura e ${cols} de largura. Quantas unidades ao redor?`,
      `Cette figure fait ${rows} de haut et ${cols} de large. Combien d'unités autour ?`,
      `这个图形高${rows}格、宽${cols}格。四周一共多少格边？`,
      `यह आकृति ${rows} ऊँची और ${cols} चौड़ी है। चारों ओर कितनी इकाइयाँ हैं?`,
      `هذا الشكل ارتفاعه ${rows} وعرضه ${cols}. كم وحدة حول الشكل؟`,
    );
  }
  return t(
    `This shape is ${rows} tall and ${cols} wide. How many squares?`,
    `Esta figura mide ${rows} de alto y ${cols} de ancho. ¿Cuántos cuadrados?`,
    `Esta figura tem ${rows} de altura e ${cols} de largura. Quantos quadrados?`,
    `Cette figure fait ${rows} de haut et ${cols} de large. Combien de carrés ?`,
    `这个图形高${rows}格、宽${cols}格。一共有多少格？`,
    `यह आकृति ${rows} ऊँची और ${cols} चौड़ी है। कितने वर्ग हैं?`,
    `هذا الشكل ارتفاعه ${rows} وعرضه ${cols}. كم مربعاً؟`,
  );
}

function sideTitle(total: number, known: number, area: boolean): string {
  if (area) {
    return t(
      `The area is ${total}. One side is ${known}. What is the other side?`,
      `El área es ${total}. Un lado mide ${known}. ¿Cuánto mide el otro lado?`,
      `A área é ${total}. Um lado mede ${known}. Qual é o outro lado?`,
      `L'aire est ${total}. Un côté mesure ${known}. Quelle est la longueur de l'autre côté ?`,
      `面积是${total}。一条边是${known}。另一条边是多少？`,
      `क्षेत्रफल ${total} है। एक भुजा ${known} है। दूसरी भुजा क्या है?`,
      `المساحة ${total}. أحد الأضلاع ${known}. ما الضلع الآخر؟`,
    );
  }
  return t(
    `The distance around is ${total}. One side is ${known}. What is the other side?`,
    `La distancia alrededor es ${total}. Un lado mide ${known}. ¿Cuánto mide el otro lado?`,
    `A distância ao redor é ${total}. Um lado mede ${known}. Qual é o outro lado?`,
    `Le tour mesure ${total}. Un côté mesure ${known}. Quelle est la longueur de l'autre côté ?`,
    `周长是${total}。一条边是${known}。另一条边是多少？`,
    `चारों ओर की दूरी ${total} है। एक भुजा ${known} है। दूसरी भुजा क्या है?`,
    `المحيط ${total}. أحد الأضلاع ${known}. ما الضلع الآخر؟`,
  );
}

function squaresWord(n: number): string {
  return t(`${n} squares`, `${n} cuadrados`, `${n} quadrados`, `${n} carrés`, `${n}格`, `${n} वर्ग`, `${n} مربعات`);
}

function aroundWord(n: number): string {
  return t(
    `${n} units around`,
    `${n} unidades alrededor`,
    `${n} unidades ao redor`,
    `${n} unités autour`,
    `四周${n}`,
    `चारों ओर ${n}`,
    `${n} حول الشكل`,
  );
}

function missingWord(n: number): string {
  return t(
    `The missing side is ${n}`,
    `El lado que falta mide ${n}`,
    `O lado que falta mede ${n}`,
    `Le côté manquant mesure ${n}`,
    `缺的边是${n}`,
    `छूटी भुजा ${n} है`,
    `الضلع الناقص ${n}`,
  );
}

export function gridHint(mode: GridLevel): string {
  switch (mode) {
    case "tiles":
      return t("Tap each square.", "Toca cada cuadrado.", "Toque cada quadrado.", "Touche chaque carré.", "点一下每一格。", "हर वर्ग पर टैप करो।", "اضغط كل مربع.");
    case "fence":
      return t("Tap each edge.", "Toca cada lado.", "Toque cada lado.", "Touche chaque bord.", "点一下每一条边。", "हर किनारे पर टैप करो।", "اضغط كل ضلع.");
    case "side":
      return t(
        "Use the area or the distance around.",
        "Usa el área o la distancia alrededor.",
        "Use a área ou a distância ao redor.",
        "Utilise l'aire ou le tour.",
        "用面积或者周长。",
        "क्षेत्रफल या चारों ओर की दूरी इस्तेमाल करो।",
        "استخدم المساحة أو المحيط.",
      );
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
}

function figureTask(mode: "tiles" | "fence", rng: Rng): GridTask {
  const cells = [...rng.pick(FIGURES)].map(([x, y]) => [x, y] as [number, number]);
  const { rows, cols } = gridBounds(cells);
  const edges = gridPerimeter(cells);
  const speech = sizeTitle(rows, cols, mode === "fence");
  const praise = mode === "fence" ? aroundWord(edges) : squaresWord(cells.length);
  const signature = cells.map(([x, y]) => `${x}${y}`).join("");
  return {
    kind: "grid",
    mode,
    cells,
    rows,
    cols,
    edges,
    known: 0,
    missing: 0,
    useArea: false,
    speech,
    skill: `grid:${mode}`,
    factKey: `${mode}:${signature}`,
    praise,
  };
}

function sideTask(rng: Rng): GridTask {
  const known = rng.int(2, 9);
  let missing = rng.int(2, 9);
  if (missing === known) missing = known === 9 ? 2 : known + 1;
  const useArea = rng.next() < 0.5;
  const total = useArea ? known * missing : 2 * (known + missing);
  return {
    kind: "grid",
    mode: "side",
    cells: [],
    rows: missing,
    cols: known,
    edges: 2 * (known + missing),
    known,
    missing,
    useArea,
    speech: sideTitle(total, known, useArea),
    skill: "grid:side",
    factKey: `side:${useArea ? "a" : "p"}:${known}:${missing}`,
    praise: missingWord(missing),
  };
}

function roll(level: GridLevel, rng: Rng): GridTask {
  switch (level) {
    case "tiles":
      return figureTask("tiles", rng);
    case "fence":
      return figureTask("fence", rng);
    case "side":
      return sideTask(rng);
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

export function makeGridTask(level: string, rng: Rng, avoid?: string): GridTask {
  const safe: GridLevel = isGridLevel(level) ? level : "tiles";
  let task = roll(safe, rng);
  for (let i = 0; i < 12 && avoid && task.factKey === avoid; i += 1) task = roll(safe, rng);
  return task;
}

export function gridCellKeys(cells: readonly (readonly [number, number])[]): string[] {
  return cells.map(([x, y]) => `${x},${y}`);
}

export function gridEdgeKeys(cells: readonly (readonly [number, number])[]): string[] {
  return exposedEdges(cells).map((edge) => `${edge.x},${edge.y},${edge.side}`);
}

export function gridMatches(task: GridTask, picked: readonly string[]): boolean {
  switch (task.mode) {
    case "tiles": {
      const want = gridCellKeys(task.cells);
      return want.length > 0 && want.length === picked.length && want.every((key) => picked.includes(key));
    }
    case "fence": {
      const want = gridEdgeKeys(task.cells);
      return want.length > 0 && want.length === picked.length && want.every((key) => picked.includes(key));
    }
    case "side":
      return picked.length === 1 && picked[0] === String(task.missing);
    default: {
      const neverMode: never = task.mode;
      return neverMode;
    }
  }
}

export function taskBoard(task: GridTask): GridBoard {
  return {
    game: "grid",
    mode: task.mode,
    cells: task.cells,
    rows: task.rows,
    cols: task.cols,
    edges: task.edges,
    known: task.known,
    missing: task.missing,
    useArea: task.useArea,
  };
}

export function gridTaskFromBoard(board: GridBoard): GridTask {
  return {
    kind: "grid",
    mode: board.mode,
    cells: board.cells.map(([x, y]) => [x, y] as [number, number]),
    rows: board.rows,
    cols: board.cols,
    edges: board.edges,
    known: board.known,
    missing: board.missing,
    useArea: board.useArea,
    speech: "",
    skill: `grid:${board.mode}`,
    factKey: board.mode,
    praise: "",
  };
}

export function makeGridQuestion(rng: Rng, level: string): ChoiceQ {
  const task = makeGridTask(level, rng);
  const answer = gridAnswer(task);
  const hi = task.mode === "side" ? 12 : 24;
  return sceneQuestion(rng, {
    game: "grid",
    title: task.speech,
    hint: gridHint(task.mode),
    answer: String(answer),
    choices: nearChoices(rng, answer, 1, hi, [answer + 1, Math.max(1, answer - 1), task.rows + task.cols]),
    skill: task.skill,
    tags: ["grid", task.mode],
    solved: task.praise,
    picture: "grid",
    hands: true,
    quietChoices: false,
    labels: {},
    board: taskBoard(task),
    factKey: task.factKey,
  });
}

export function makeGridSheet(rng: Rng, level: string): SheetItem {
  const task = makeGridTask(level, rng);
  return { prompt: task.speech, answer: String(gridAnswer(task)) };
}
