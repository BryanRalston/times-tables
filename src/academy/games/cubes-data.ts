import type { Rng } from "@/lib/rng";
import { easeOf, easeSpan } from "../adapt";
import { t } from "../i18n";
import type { CubeBoard, CubeBox } from "./boards";
import { mathText } from "./grade5";
import { nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import { TIMES, type ChoiceQ, type SheetItem } from "./types";

/**
 * Cube Builder, grade 5 volume (5.MD.C.3–5). Whole unit cubes only: no
 * fractional edges (grade 6), no unit conversion (5.MD.A), no line plots (5.MD.B).
 */
export const CUBE_LEVELS = ["count", "build", "formula", "two"] as const;
export type CubeLevel = (typeof CUBE_LEVELS)[number];

/** Build steppers. Every build target has at least one box inside these. */
export const BUILD_MAX: CubeBox = { l: 6, w: 4, h: 5 };
/** Count-the-cubes boxes stay small enough to count on a phone. */
export const COUNT_EDGE_MAX = 5;
export const COUNT_VOLUME_MAX = 40;

export function isCubeLevel(value: unknown): value is CubeLevel {
  return typeof value === "string" && (CUBE_LEVELS as readonly string[]).includes(value);
}

export function volumeOf(box: CubeBox): number {
  return box.l * box.w * box.h;
}

/** Cubes inside or at the back of a full box. They do not show, but they count. */
export function hiddenCubes(box: CubeBox): number {
  return Math.max(0, box.l - 1) * Math.max(0, box.w - 1) * Math.max(0, box.h - 1);
}

export function visibleCubes(box: CubeBox): number {
  return volumeOf(box) - hiddenCubes(box);
}

export interface Voxel {
  x: number;
  y: number;
  z: number;
  /** 0 for the first box, 1 for the second box in a two-box figure. */
  part: number;
}

/** Every unit cube in the figure. The second box sits right of the first, on the same floor. */
export function boxCubes(box: CubeBox, second?: CubeBox): Voxel[] {
  const out: Voxel[] = [];
  const fill = (b: CubeBox, x0: number, part: number) => {
    for (let z = 0; z < b.h; z += 1) for (let y = 0; y < b.w; y += 1) for (let x = 0; x < b.l; x += 1) out.push({ x: x + x0, y, z, part });
  };
  fill(box, 0, 0);
  if (second) fill(second, box.l, 1);
  return out;
}

/** "l × w × h" for one box, in the order the edge labels use. */
export function boxDims(box: CubeBox): string {
  return [box.l, box.w, box.h].join(" \u00d7 ");
}

/** Each cube needs a cube or the floor under it. */
export function isSupported(cubes: readonly Voxel[]): boolean {
  const at = new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`));
  return cubes.every((c) => c.z === 0 || at.has(`${c.x},${c.y},${c.z - 1}`));
}

export function boardVolume(board: CubeBoard): number {
  switch (board.mode) {
    case "count":
    case "formula":
      return volumeOf(board.box);
    case "build":
      return board.target;
    case "two":
      return volumeOf(board.box) + volumeOf(board.second);
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

/** Boxes inside the build steppers with this volume. Floor-fixed tasks keep length and width. */
export function buildBoxes(target: number, floor?: { l: number; w: number }): CubeBox[] {
  const out: CubeBox[] = [];
  for (let l = 1; l <= BUILD_MAX.l; l += 1) {
    for (let w = 1; w <= BUILD_MAX.w; w += 1) {
      for (let h = 1; h <= BUILD_MAX.h; h += 1) {
        if (floor && (l !== floor.l || w !== floor.w)) continue;
        if (l * w * h === target) out.push({ l, w, h });
      }
    }
  }
  return out;
}

export function buildMatches(board: CubeBoard, built: CubeBox): boolean {
  if (board.mode !== "build") return false;
  if (board.floorFixed && (built.l !== board.box.l || built.w !== board.box.w)) return false;
  return volumeOf(built) === board.target;
}

function roll(rng: Rng, lo: number, hi: number, prefer: readonly string[]): number {
  const span = easeSpan(lo, hi, easeOf(prefer));
  return rng.int(span.lo, span.hi);
}

export function rollCountBox(rng: Rng, prefer: readonly string[] = []): CubeBox {
  for (let guard = 0; guard < 40; guard += 1) {
    const box = { l: roll(rng, 2, 4, prefer), w: rng.int(2, 3), h: roll(rng, 2, 3, prefer) };
    if (volumeOf(box) <= COUNT_VOLUME_MAX) return box;
  }
  return { l: 3, w: 2, h: 2 };
}

export function rollBuild(rng: Rng, prefer: readonly string[] = []): Extract<CubeBoard, { mode: "build" }> {
  const ease = easeOf(prefer);
  if (ease === "gentle" || rng.next() < 0.35) {
    const box = { l: rng.int(2, 4), w: rng.int(2, 3), h: rng.int(2, 4) };
    return { game: "cubes", mode: "build", box, target: volumeOf(box), floorFixed: true };
  }
  const box = { l: roll(rng, 2, 5, prefer), w: rng.int(2, 3), h: roll(rng, 2, 4, prefer) };
  return { game: "cubes", mode: "build", box, target: volumeOf(box), floorFixed: false };
}

export function rollFormula(rng: Rng, prefer: readonly string[] = []): Extract<CubeBoard, { mode: "formula" }> {
  const ease = easeOf(prefer);
  const box = { l: roll(rng, 3, 7, prefer), w: rng.int(2, 4), h: roll(rng, 2, 5, prefer) };
  const ask = ease !== "gentle" && rng.next() < 0.4 ? "base" : "lwh";
  return { game: "cubes", mode: "formula", box, ask };
}

export function rollTwo(rng: Rng, prefer: readonly string[] = []): Extract<CubeBoard, { mode: "two" }> {
  const w = rng.int(2, 3);
  const h = roll(rng, 3, 4, prefer);
  const box = { l: rng.int(2, 3), w, h };
  const second = { l: roll(rng, 2, 3, prefer), w, h: rng.int(1, h - 1) };
  return { game: "cubes", mode: "two", box, second };
}

function product(...ns: number[]): string {
  return mathText(ns.join(` ${TIMES} `) + ` = ${ns.reduce((a, b) => a * b, 1)}`);
}

function intChoices(rng: Rng, answer: number, pinned: number[], pool: number[]): string[] {
  const ok = (n: number) => Number.isInteger(n) && n > 0 && n !== answer;
  const extra = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 4, answer - 4];
  return uniqueChoices(
    rng,
    String(answer),
    [...pool, ...extra].filter(ok).map(String),
    pinned.filter(ok).map(String),
  );
}

export function countChoices(rng: Rng, box: CubeBox): string[] {
  const v = volumeOf(box);
  const layer = box.l * box.w;
  // Slips: only the cubes you can see, one layer only, one layer off, edges added.
  return intChoices(rng, v, [visibleCubes(box), layer], [v - layer, v + layer, box.l + box.w + box.h]);
}

export function formulaChoices(rng: Rng, board: Extract<CubeBoard, { mode: "formula" }>): string[] {
  const { l, w, h } = board.box;
  const v = l * w * h;
  if (board.ask === "base") return intChoices(rng, v, [l * w + h, l * w], [v + l * w, v - l * w]);
  // Slips: added the edges, multiplied two then added the third, forgot the height.
  return intChoices(rng, v, [l + w + h, l * w + h], [l * w, v + l * w, v - l * w]);
}

export function twoChoices(rng: Rng, board: Extract<CubeBoard, { mode: "two" }>): string[] {
  const a = volumeOf(board.box);
  const b = volumeOf(board.second);
  // Slips: one big box at the tall height, only one part, one row off.
  const big = (board.box.l + board.second.l) * board.box.w * board.box.h;
  return intChoices(rng, a + b, [big, a], [b, a + b + board.box.w, a + b - board.box.w]);
}

function countTitle(rng: Rng): string {
  return rng.next() < 0.5
    ? t("How many unit cubes build this box?", "¿Cuántos cubos unidad forman esta caja?")
    : t("Some cubes are hidden in the back. How many cubes in all?", "Algunos cubos están escondidos atrás. ¿Cuántos cubos hay en total?");
}

export function buildTitle(board: Extract<CubeBoard, { mode: "build" }>): string {
  const { l, w } = board.box;
  const v = board.target;
  if (board.floorFixed) {
    return t(
      `The floor is ${l} by ${w}. Add layers to make ${v} cubes.`,
      `El piso mide ${l} por ${w}. Agrega capas hasta tener ${v} cubos.`,
      `O piso mede ${l} por ${w}. Junte camadas até ter ${v} cubos.`,
      `Le sol mesure ${l} sur ${w}. Ajoute des couches pour faire ${v} cubes.`,
      `底面是${l}乘${w}。一层一层加，搭出${v}个小正方体。`,
      `फ़र्श ${l} गुणा ${w} है। परतें जोड़कर ${v} घन बनाओ।`,
      `الأرضية ${mathText(`${l} ${TIMES} ${w}`)}. أضف طبقات حتى يصير الحجم ${mathText(`V = ${v}`)}`,
    );
  }
  return t(
    `Build a box with a volume of ${v} cubic units.`,
    `Construye una caja con un volumen de ${v} unidades cúbicas.`,
    `Monte uma caixa com volume de ${v} unidades cúbicas.`,
    `Construis une boîte de ${v} unités cubes de volume.`,
    `搭一个体积是${v}立方单位的长方体。`,
    `${v} घन इकाई आयतन का एक डिब्बा बनाओ।`,
    `ابنِ صندوقًا حجمه بالوحدات المكعبة ${mathText(`V = ${v}`)}`,
  );
}

function formulaTitle(board: Extract<CubeBoard, { mode: "formula" }>): string {
  if (board.ask === "lwh") return t("Use the formula. What is the volume?", "Usa la fórmula. ¿Cuál es el volumen?");
  const base = board.box.l * board.box.w;
  const h = board.box.h;
  return t(
    `The base is ${base} square units. The height is ${h}. What is the volume?`,
    `La base mide ${base} unidades cuadradas. La altura es ${h}. ¿Cuál es el volumen?`,
    `A base tem ${base} unidades quadradas. A altura é ${h}. Qual é o volume?`,
    `La base mesure ${base} unités carrées. La hauteur est ${h}. Quel est le volume ?`,
    `底面积是${base}平方单位，高是${h}。体积是多少？`,
    `आधार ${base} वर्ग इकाई है। ऊँचाई ${h} है। आयतन कितना है?`,
    `مساحة القاعدة ${mathText(`B = ${base}`)}، والارتفاع ${mathText(`h = ${h}`)}. ما الحجم؟`,
  );
}

export function cubeHint(mode: CubeLevel, ask?: "lwh" | "base"): string {
  switch (mode) {
    case "count":
      return t("Count one layer, then count the layers. Hidden cubes count too.", "Cuenta una capa y luego las capas. Los cubos escondidos también cuentan.");
    case "build":
      return t("Long × wide × tall is the number of cubes.", "Largo × ancho × alto es el número de cubos.");
    case "formula":
      return ask === "base"
        ? t("Volume = base × height", "Volumen = base × altura")
        : t("Volume = length × width × height", "Volumen = largo × ancho × alto");
    case "two":
      return t("Find each box's volume. Then add them.", "Halla el volumen de cada caja. Luego súmalos.");
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
}

export function cubeSolved(board: CubeBoard): string {
  switch (board.mode) {
    case "count":
    case "build":
    case "formula":
      return product(board.box.l, board.box.w, board.box.h);
    case "two": {
      const a = volumeOf(board.box);
      const b = volumeOf(board.second);
      return mathText(`${a} + ${b} = ${a + b}`);
    }
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

function layerLine(l: number, w: number): string {
  const n = l * w;
  return t(
    `One layer: ${l} ${TIMES} ${w} = ${n}`,
    `Una capa: ${l} ${TIMES} ${w} = ${n}`,
    `Uma camada: ${l} ${TIMES} ${w} = ${n}`,
    `Une couche : ${l} ${TIMES} ${w} = ${n}`,
    `一层：${l} ${TIMES} ${w} = ${n}`,
    `एक परत: ${l} ${TIMES} ${w} = ${n}`,
    `طبقة واحدة: ${mathText(`${l} ${TIMES} ${w} = ${n}`)}`,
  );
}

/** Worked example lines, one card per level. The last line is the answer. */
export function cubeCaptions(board: CubeBoard): string[] {
  switch (board.mode) {
    case "count": {
      const { l, w, h } = board.box;
      return [layerLine(l, w), t("Hidden cubes count too.", "Los cubos escondidos también cuentan."), product(l * w, h)];
    }
    case "build": {
      const { l, w, h } = board.box;
      return [layerLine(l, w), product(l * w, h), product(l, w, h)];
    }
    case "formula": {
      const { l, w, h } = board.box;
      if (board.ask === "base") return [mathText(`V = B ${TIMES} h`), product(l * w, h)];
      return [mathText(`V = l ${TIMES} w ${TIMES} h`), product(l, w, h)];
    }
    case "two": {
      const a = volumeOf(board.box);
      const b = volumeOf(board.second);
      return [product(board.box.l, board.box.w, board.box.h), product(board.second.l, board.second.w, board.second.h), mathText(`${a} + ${b} = ${a + b}`)];
    }
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

function boxKey(box: CubeBox): string {
  return `${box.l}x${box.w}x${box.h}`;
}

export function makeCubeQuestion(rng: Rng, level: CubeLevel, prefer: readonly string[] = []): ChoiceQ {
  const base = { game: "cubes", picture: "cubes", labels: {}, skill: `cubes:${level}`, tags: [level] };
  switch (level) {
    case "count": {
      const box = rollCountBox(rng, prefer);
      const board: CubeBoard = { game: "cubes", mode: "count", box };
      return sceneQuestion(rng, {
        ...base,
        title: countTitle(rng),
        hint: cubeHint("count"),
        answer: String(volumeOf(box)),
        choices: countChoices(rng, box),
        solved: cubeSolved(board),
        hands: false,
        quietChoices: false,
        board,
        factKey: `count:${boxKey(box)}`,
      });
    }
    case "build": {
      const board = rollBuild(rng, prefer);
      return sceneQuestion(rng, {
        ...base,
        title: buildTitle(board),
        hint: cubeHint("build"),
        answer: String(board.target),
        choices: nearChoices(rng, board.target, 1, BUILD_MAX.l * BUILD_MAX.w * BUILD_MAX.h),
        solved: cubeSolved(board),
        hands: true,
        quietChoices: true,
        board,
        factKey: `build:${board.floorFixed ? "floor" : "free"}:${boxKey(board.box)}`,
      });
    }
    case "formula": {
      const board = rollFormula(rng, prefer);
      return sceneQuestion(rng, {
        ...base,
        title: formulaTitle(board),
        hint: cubeHint("formula", board.ask),
        answer: String(volumeOf(board.box)),
        choices: formulaChoices(rng, board),
        solved: cubeSolved(board),
        hands: false,
        quietChoices: false,
        board,
        factKey: `formula:${board.ask}:${boxKey(board.box)}`,
      });
    }
    case "two": {
      const board = rollTwo(rng, prefer);
      return sceneQuestion(rng, {
        ...base,
        title:
          rng.next() < 0.5
            ? t("Two boxes are joined. What is the total volume?", "Dos cajas están unidas. ¿Cuál es el volumen total?")
            : t("This shape is made of two boxes. How many cubes in all?", "Esta figura está hecha de dos cajas. ¿Cuántos cubos hay en total?"),
        hint: cubeHint("two"),
        answer: String(boardVolume(board)),
        choices: twoChoices(rng, board),
        solved: cubeSolved(board),
        hands: false,
        quietChoices: false,
        board,
        factKey: `two:${boxKey(board.box)}+${boxKey(board.second)}`,
      });
    }
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

/** Worksheet rows draw the box; the prompt is the answer-key line. */
export function makeCubeSheet(rng: Rng, level: string): SheetItem {
  const safe: CubeLevel = isCubeLevel(level) ? level : "count";
  switch (safe) {
    case "count": {
      const box = rollCountBox(rng);
      return { prompt: t("Volume =", "Volumen ="), answer: String(volumeOf(box)), cubes: { game: "cubes", mode: "count", box } };
    }
    case "build": {
      const board = rollBuild(rng);
      const { l, w, h } = board.box;
      return {
        prompt: mathText(`${l} ${TIMES} ${w} ${TIMES} ? = ${board.target}`),
        answer: String(h),
        cubes: { ...board, floorFixed: true },
      };
    }
    case "formula": {
      const board = rollFormula(rng);
      return { prompt: t("Volume =", "Volumen ="), answer: String(volumeOf(board.box)), cubes: board };
    }
    case "two": {
      const board = rollTwo(rng);
      return { prompt: t("Volume =", "Volumen ="), answer: String(boardVolume(board)), cubes: board };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}
