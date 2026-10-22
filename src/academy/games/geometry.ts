import type { Rng } from "@/lib/rng";
import { shapeWord, spanishShaded, starPlace, t } from "../i18n";
import type {
  FlatKind,
  FoldFig,
  PositionWord,
  QuadName,
  ShapeBoard,
  ShapeColor,
  ShapeName,
} from "./boards";
import { nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

const POSITIONS: readonly PositionWord[] = ["above", "below", "beside", "behind"];
const FLATS: readonly FlatKind[] = ["circle", "triangle", "square", "rectangle"];
const SOLIDS: readonly ShapeName[] = ["cube", "sphere", "cone", "cylinder"];
const QUADS: readonly QuadName[] = ["rhombus", "rectangle", "square", "trapezoid"];
const COLORS: readonly ShapeColor[] = ["red", "blue", "yellow", "green"];
const FOLDS: ReadonlyArray<readonly [FoldFig, boolean]> = [
  ["square", true],
  ["rectangle", true],
  ["triangle", true],
  ["circle", true],
  ["square", false],
  ["rectangle", false],
  ["triangle", false],
  ["circle", false],
];

const GEOMETRY_LEVELS = ["position", "sort", "traits", "compose", "faces", "rows", "quads", "share", "cover", "fold"] as const;
export type GeometryLevel = (typeof GEOMETRY_LEVELS)[number];

export function isGeometryLevel(value: string): value is GeometryLevel {
  return (GEOMETRY_LEVELS as readonly string[]).includes(value);
}

function either(rng: Rng, first: string, second: string): string {
  return rng.next() < 0.5 ? first : second;
}

function blank(ids: readonly string[]): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const id of ids) labels[id] = "";
  return labels;
}

function picturesOf(ids: readonly string[], picture: (id: string) => string): Record<string, string> {
  const pictures: Record<string, string> = {};
  for (const id of ids) pictures[id] = picture(id);
  return pictures;
}

function ask(
  rng: Rng,
  spec: {
    level: GeometryLevel;
    title: string;
    hint: string;
    answer: string;
    choices: string[];
    solved: string;
    picture: string;
    labels: Record<string, string>;
    pictures?: Record<string, string>;
    quiet: boolean;
    board: ShapeBoard;
    factKey: string;
  },
): ChoiceQ {
  return sceneQuestion(rng, {
    game: "shapes",
    title: spec.title,
    hint: spec.hint,
    answer: spec.answer,
    choices: spec.choices,
    skill: `shapes:${spec.level}`,
    tags: [spec.level],
    solved: spec.solved,
    picture: spec.picture,
    hands: true,
    quietChoices: spec.quiet,
    labels: spec.labels,
    pictures: spec.pictures,
    board: spec.board,
    factKey: spec.factKey,
  });
}

function namedShape(shape: string): string {
  switch (shape) {
    case "circle":
      return t("It is a circle", "Es el círculo");
    case "triangle":
      return t("It is a triangle", "Es el triángulo");
    case "square":
      return t("It is a square", "Es el cuadrado");
    case "rectangle":
      return t("It is a rectangle", "Es el rectángulo");
    case "cube":
      return t("It is a cube", "Es el cubo");
    case "sphere":
      return t("It is a sphere", "Es la esfera");
    case "cone":
      return t("It is a cone", "Es el cono");
    case "cylinder":
      return t("It is a cylinder", "Es el cilindro");
    case "rhombus":
      return t("It is a rhombus", "Es el rombo");
    case "trapezoid":
      return t("It is a trapezoid", "Es el trapecio");
    default:
      return t("Find the same shape", "Busca la misma figura");
  }
}

function positionQuestion(rng: Rng): ChoiceQ {
  const place = rng.pick([...POSITIONS]);
  const pictures = picturesOf(POSITIONS, (id) => `geo:pos:${id}`);
  return ask(rng, {
    level: "position",
    title: either(
      rng,
      t("Where is the star?", "¿Dónde está la estrella?"),
      t("Where is the star now?", "¿Dónde está la estrella ahora?"),
    ),
    hint: t("Look at the pictures", "Mira los dibujos"),
    answer: place,
    choices: rng.shuffle([...POSITIONS]),
    solved: starPlace(place),
    picture: pictures[place] ?? "geo:pos:above",
    labels: blank(POSITIONS),
    pictures,
    quiet: true,
    board: { game: "shapes", mode: "position", place },
    factKey: `position:${place}`,
  });
}

function sortQuestion(rng: Rng): ChoiceQ {
  const flat = rng.next() < 0.5;
  const answer = rng.pick([...(flat ? FLATS : SOLIDS)]);
  const decoys = rng.shuffle([...(flat ? SOLIDS : FLATS)]).slice(0, 3);
  const choices = rng.shuffle([answer, ...decoys]);
  return ask(rng, {
    level: "sort",
    title: flat
      ? t("A flat shape sits on the page.", "Una figura plana se queda en la hoja.")
      : t("A solid shape you could hold.", "Un cuerpo que puedes sostener."),
    hint: t("Look at the pictures", "Mira los dibujos"),
    answer,
    choices,
    solved: namedShape(answer),
    picture: `geo:shape:${answer}`,
    labels: blank(choices),
    pictures: picturesOf(choices, (id) => `geo:shape:${id}`),
    quiet: true,
    board: { game: "shapes", mode: "sort", shape: answer, ask: flat ? "flat" : "solid" },
    factKey: `sort:${flat ? "flat" : "solid"}:${answer}`,
  });
}

function traitCode(shape: FlatKind, color: ShapeColor, big: boolean, turn: boolean): string {
  return `geo:trait:${shape}:${color}:${big ? "big" : "small"}:${turn ? "turn" : "still"}`;
}

function traitsQuestion(rng: Rng): ChoiceQ {
  const shape = rng.pick([...FLATS]);
  const color = rng.pick([...COLORS]);
  const big = rng.next() < 0.5;
  const turn = shape !== "circle" && rng.next() < 0.7;
  const pictures = picturesOf(FLATS, (id) => `geo:shape:${id}`);
  const sides = shape === "triangle" ? 3 : shape === "circle" ? 0 : 4;
  const hint =
    shape === "circle"
      ? t("A flat shape sits on the page", "Una figura plana se queda en la hoja")
      : t(`A ${shape} has ${sides} sides.`, shape === "triangle" ? `El triángulo tiene ${sides} lados.` : shape === "square" ? `El cuadrado tiene ${sides} lados.` : `El rectángulo tiene ${sides} lados.`, shape === "triangle" ? `O triângulo tem ${sides} lados.` : shape === "square" ? `O quadrado tem ${sides} lados.` : `O retângulo tem ${sides} lados.`, shape === "triangle" ? `Le triangle a ${sides} côtés.` : shape === "square" ? `Le carré a ${sides} côtés.` : `Le rectangle a ${sides} côtés.`, `${shapeWord(shape)}有${sides}条边。`, `${shapeWord(shape)} की ${sides} भुजाएँ होती हैं।`);
  return ask(rng, {
    level: "traits",
    title: either(rng, t("What shape is this?", "¿Qué figura es esta?"), t("Find the same shape.", "Busca la misma figura.")),
    hint,
    answer: shape,
    choices: rng.shuffle([...FLATS]),
    solved: namedShape(shape),
    picture: traitCode(shape, color, big, turn),
    labels: blank(FLATS),
    pictures,
    quiet: true,
    board: { game: "shapes", mode: "traits", shape, color, big, turn },
    factKey: `traits:${shape}:${color}:${big ? "big" : "small"}`,
  });
}

function composeQuestion(rng: Rng): ChoiceQ {
  const made = rng.pick(["rectangle", "square", "circle"] as const);
  const pool = ["circle", "triangle", "square", "rectangle"];
  return ask(rng, {
    level: "compose",
    title: either(rng, t("What shape is this?", "¿Qué figura es esta?"), t("Find the same shape.", "Busca la misma figura.")),
    hint:
      made === "circle"
        ? t("A flat shape sits on the page", "Una figura plana se queda en la hoja")
        : made === "square"
          ? t("A square has 4 sides.", "El cuadrado tiene 4 lados.")
          : t("A rectangle has 4 sides.", "El rectángulo tiene 4 lados."),
    answer: made,
    choices: rng.shuffle(pool),
    solved: namedShape(made),
    picture: `geo:join:${made}`,
    labels: blank(pool),
    pictures: picturesOf(pool, (id) => `geo:shape:${id}`),
    quiet: true,
    board: { game: "shapes", mode: "compose", made },
    factKey: `compose:${made}`,
  });
}

function facesQuestion(rng: Rng): ChoiceQ {
  if (rng.next() < 0.5) {
    const solids = ["cube", "sphere", "cone", "cylinder"];
    return ask(rng, {
      level: "faces",
      title: t("What shape is this?", "¿Qué figura es esta?"),
      hint: t("It is a cube", "Es el cubo"),
      answer: "cube",
      choices: rng.shuffle(solids),
      solved: t("It is a cube", "Es el cubo"),
      picture: "geo:net",
      labels: blank(solids),
      pictures: picturesOf(solids, (id) => `geo:shape:${id}`),
      quiet: true,
      board: { game: "shapes", mode: "faces", kind: "name" },
      factKey: "faces:cube",
    });
  }
  return ask(rng, {
    level: "faces",
    title: t("Count the squares.", "Cuenta los cuadritos."),
    hint: t("It is a cube", "Es el cubo"),
    answer: "6",
    choices: nearChoices(rng, 6, 3, 8),
    solved: t("6 square units", "6 unidades cuadradas"),
    picture: "geo:net",
    labels: {},
    quiet: false,
    board: { game: "shapes", mode: "faces", kind: "net" },
    factKey: "faces:6",
  });
}

function gridPair(rng: Rng, level: "rows" | "cover"): { rows: number; cols: number } {
  if (level === "rows") {
    const rows = rng.int(2, 3);
    const cols = rng.int(2, 4);
    return { rows, cols };
  }
  const rows = rng.int(3, 5);
  const cols = rng.int(4, 5);
  if (rows < 4 && cols < 4) return { rows: 4, cols };
  return { rows, cols };
}

function gridQuestion(rng: Rng, level: "rows" | "cover"): ChoiceQ {
  const { rows, cols } = gridPair(rng, level);
  const product = rows * cols;
  const board: ShapeBoard = { game: "shapes", mode: level, rows, cols };
  return ask(rng, {
    level,
    title: t(`${rows} rows of ${cols}. Count the squares.`, `${rows} filas de ${cols}. Cuenta los cuadritos.`, `${rows} linhas de ${cols}. Conte os quadradinhos.`, `${rows} lignes de ${cols}. Compte les petits carrés.`, `${rows}行，每行${cols}个。数一数小方格。`, `${cols} की ${rows} पंक्तियाँ। वर्ग गिनो।`),
    hint:
      level === "cover"
        ? t("Area is length times width", "El área es largo por ancho")
        : t("Count the squares", "Cuenta los cuadritos"),
    answer: String(product),
    choices: nearChoices(rng, product, 1, 30, [rows, cols, rows + cols, rows * cols]),
    solved: t(`${product} square units`, `${product} unidades cuadradas`, `${product} unidades quadradas`, `${product} unités carrées`, `${product}平方单位`, `${product} वर्ग इकाई`),
    picture: `geo:grid:${rows}x${cols}`,
    labels: {},
    quiet: false,
    board,
    factKey: `${level}:${rows}x${cols}`,
  });
}

function quadWord(name: QuadName): string {
  switch (name) {
    case "rhombus":
      return t("rhombus", "rombo");
    case "rectangle":
      return t("rectangle", "rectángulo");
    case "square":
      return t("square", "cuadrado");
    case "trapezoid":
      return t("trapezoid", "trapecio");
    default: {
      const neverName: never = name;
      return neverName;
    }
  }
}

function quadsQuestion(rng: Rng): ChoiceQ {
  const shape = rng.pick([...QUADS]);
  const labels: Record<string, string> = {};
  for (const name of QUADS) labels[name] = quadWord(name);
  return ask(rng, {
    level: "quads",
    title: either(
      rng,
      t("What shape is this?", "¿Qué figura es esta?"),
      t("Which shape do you see?", "¿Qué figura ves?"),
    ),
    hint: t("Count around the shape", "Cuenta alrededor de la figura"),
    answer: shape,
    choices: rng.shuffle([...QUADS]),
    solved: namedShape(shape),
    picture: `geo:quad:${shape}`,
    labels,
    pictures: picturesOf(QUADS, (id) => `geo:quad:${id}`),
    quiet: true,
    board: { game: "shapes", mode: "quads", shape },
    factKey: `quads:${shape}`,
  });
}

function shareSolved(den: 2 | 3 | 4): string {
  switch (den) {
    case 2:
      return t("One half is shaded", spanishShaded("1/2"));
    case 3:
      return t("One third is shaded", spanishShaded("1/3"));
    case 4:
      return t("One fourth is shaded", spanishShaded("1/4"));
    default: {
      const neverDen: never = den;
      return neverDen;
    }
  }
}

function shareQuestion(rng: Rng): ChoiceQ {
  const den = rng.pick([2, 3, 4] as const);
  const answer = `1/${den}`;
  const pool = ["1/2", "1/3", "1/4", den === 2 ? "2/2" : den === 3 ? "2/3" : "2/4"];
  return ask(rng, {
    level: "share",
    title: either(
      rng,
      t("What unit fraction is shaded?", "¿Qué fracción unitaria está sombreada?"),
      t("What fraction is shaded?", "¿Qué fracción está sombreada?"),
    ),
    hint: t("Equal parts are the same size", "Las partes iguales son del mismo tamaño"),
    answer,
    choices: uniqueChoices(rng, answer, pool),
    solved: shareSolved(den),
    picture: `geo:share:${den}`,
    labels: {},
    quiet: false,
    board: { game: "shapes", mode: "share", den },
    factKey: `share:1/${den}`,
  });
}

function foldId(fig: FoldFig, mirror: boolean): string {
  return `${fig}:${mirror ? "yes" : "no"}`;
}

function foldQuestion(rng: Rng): ChoiceQ {
  const trues = FOLDS.filter((row) => row[1]);
  const falses = FOLDS.filter((row) => !row[1]);
  const answerRow = rng.pick([...trues]);
  const picked = [answerRow, ...rng.shuffle([...falses]).slice(0, 3)];
  const ids = picked.map((row) => foldId(row[0], row[1]));
  const answer = foldId(answerRow[0], answerRow[1]);
  return ask(rng, {
    level: "fold",
    title: either(
      rng,
      t("A line of symmetry makes two matching halves.", "Una línea de simetría hace dos mitades iguales."),
      t("Which picture has two matching halves?", "¿Qué dibujo tiene dos mitades iguales?"),
    ),
    hint: t("Look at the pictures", "Mira los dibujos"),
    answer,
    choices: rng.shuffle(ids),
    solved: t("A line of symmetry makes two matching halves", "Una línea de simetría hace dos mitades iguales"),
    picture: `geo:fold:${answer}`,
    labels: blank(ids),
    pictures: picturesOf(ids, (id) => `geo:fold:${id}`),
    quiet: true,
    board: { game: "shapes", mode: "fold", fig: answerRow[0], mirror: true },
    factKey: `fold:${answer}`,
  });
}

export function makeGeometryQuestion(rng: Rng, level: GeometryLevel): ChoiceQ {
  switch (level) {
    case "position":
      return positionQuestion(rng);
    case "sort":
      return sortQuestion(rng);
    case "traits":
      return traitsQuestion(rng);
    case "compose":
      return composeQuestion(rng);
    case "faces":
      return facesQuestion(rng);
    case "rows":
      return gridQuestion(rng, "rows");
    case "quads":
      return quadsQuestion(rng);
    case "share":
      return shareQuestion(rng);
    case "cover":
      return gridQuestion(rng, "cover");
    case "fold":
      return foldQuestion(rng);
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

export function geometrySheet(rng: Rng, level: GeometryLevel): SheetItem {
  switch (level) {
    case "position": {
      const place = rng.pick([...POSITIONS]);
      const clue =
        place === "above"
          ? t("over the box", "encima de la caja")
          : place === "below"
            ? t("under the box", "debajo de la caja")
            : place === "beside"
              ? t("next to the box", "junto a la caja")
              : t("in back of the box", "detrás de la caja");
      return {
        prompt: t(`The star sits ${clue}. Name the position.`, `La estrella está ${clue}. Nombra la posición.`, `A estrela está ${clue}. Diga a posição.`, `L'étoile est ${clue}. Dis la position.`, `星星在${clue}。说出这个位置。`, `तारा ${clue} बैठा है। स्थिति का नाम बताओ।`),
        answer: place,
      };
    }
    case "sort": {
      const flat = rng.next() < 0.5;
      const answer = rng.pick([...(flat ? FLATS : SOLIDS)]);
      return {
        prompt: flat
          ? t("Name a flat shape that sits on the page.", "Nombra una figura plana que se queda en la hoja.")
          : t("Name a solid shape you could hold.", "Nombra un cuerpo que puedes sostener."),
        answer,
      };
    }
    case "traits": {
      const shape = rng.pick([...FLATS]);
      const clue =
        shape === "circle"
          ? t("no corners", "sin esquinas")
          : shape === "triangle"
            ? t("3 sides", "3 lados")
            : shape === "square"
              ? t("4 equal sides", "4 lados iguales")
              : t("4 sides and is longer than it is tall", "4 lados y es más largo que alto");
      return {
        prompt: t(
          `Color and size do not change a shape. Name the flat shape with ${clue}.`,
          `El color y el tamaño no cambian la figura. Nombra la figura plana: ${clue}.`, `A cor e o tamanho não mudam a figura. Diga a figura plana: ${clue}.`,
        `La couleur et la taille ne changent pas la figure. Dis la figure plate : ${clue}.`, `颜色和大小不会改变图形。说出有${clue}的平面图形。`, `रंग और आकार आकृति नहीं बदलते। ${clue} वाली सपाट आकृति का नाम बताओ।`),
        answer: shape,
      };
    }
    case "compose": {
      const made = rng.pick(["rectangle", "square", "circle"] as const);
      const pieces = made === "circle" ? t("two half circles", "dos medios círculos") : t("two triangles", "dos triángulos");
      return {
        prompt: t(`Join ${pieces}. What shape is the outside?`, `Junta ${pieces}. ¿Qué figura queda afuera?`, `Junte ${pieces}. Qual figura fica de fora?`, `Assemble ${pieces}. Quelle figure est dehors ?`, `把${pieces}拼起来。外面是什么图形？`, `${pieces} जोड़ो। बाहर कौन सी आकृति है?`),
        answer: made,
      };
    }
    case "faces":
      return { prompt: t("A cube net is made of squares. How many squares?", "La red de un cubo está hecha de cuadrados. ¿Cuántos cuadrados?"), answer: "6" };
    case "rows":
    case "cover": {
      const { rows, cols } = gridPair(rng, level);
      return {
        prompt: t(
          `A rectangle has ${rows} rows of ${cols} squares. How many squares?`,
          `Un rectángulo tiene ${rows} filas de ${cols} cuadrados. ¿Cuántos cuadrados?`, `Um retângulo tem ${rows} linhas de ${cols} quadrados. Quantos quadrados?`,
        `Un rectangle a ${rows} lignes de ${cols} carrés. Combien de carrés ?`, `长方形有${rows}行，每行${cols}个小方格。有几个小方格？`, `एक आयत में ${cols} वर्गों की ${rows} पंक्तियाँ हैं। कितने वर्ग हैं?`),
        answer: String(rows * cols),
      };
    }
    case "quads": {
      const shape = rng.pick([...QUADS]);
      const clue =
        shape === "rhombus"
          ? t("4 equal sides and no square corners", "4 lados iguales y sin esquinas cuadradas")
          : shape === "rectangle"
            ? t("4 square corners and is longer than it is tall", "4 esquinas cuadradas y es más largo que alto")
            : shape === "square"
              ? t("4 equal sides and 4 square corners", "4 lados iguales y 4 esquinas cuadradas")
              : t("exactly one pair of parallel sides", "exactamente un par de lados paralelos");
      return {
        prompt: t(`Name the quadrilateral with ${clue}.`, `Nombra el cuadrilátero: ${clue}.`, `Diga o quadrilátero: ${clue}.`, `Dis le quadrilatère : ${clue}.`, `说出有${clue}的四边形。`, `${clue} वाले चतुर्भुज का नाम बताओ।`),
        answer: shape,
      };
    }
    case "share": {
      const den = rng.pick([2, 3, 4] as const);
      return {
        prompt: t(
          `A shape is split into ${den} equal parts. One part is shaded. What unit fraction?`,
          `Una figura está partida en ${den} partes iguales. Una parte está sombreada. ¿Qué fracción unitaria?`, `Uma figura está dividida em ${den} partes iguais. Uma parte está pintada. Que fração unitária?`,
        `Une figure est partagée en ${den} parts égales. Une part est coloriée. Quelle fraction unitaire ?`, `一个图形平均分成${den}份。涂了颜色的是1份。是几分之一？`, `एक आकृति ${den} बराबर भागों में बँटी है। एक भाग रंगा है। कौन सा इकाई भिन्न है?`),
        answer: `1/${den}`,
      };
    }
    case "fold":
      return {
        prompt: t(
          "Which shape has a line of symmetry: a square folded in half, or a rectangle folded on a diagonal?",
          "¿Qué figura tiene una línea de simetría: un cuadrado doblado a la mitad, o un rectángulo doblado en una diagonal?",
        ),
        answer: "square",
      };
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

export function geometryArt(board: ShapeBoard): string | null {
  switch (board.mode) {
    case "position":
      return `geo:pos:${board.place}`;
    case "sort":
      return `geo:shape:${board.shape}`;
    case "traits":
      return traitCode(board.shape, board.color, board.big, board.turn);
    case "compose":
      return `geo:join:${board.made}`;
    case "faces":
      return "geo:net";
    case "rows":
    case "cover":
      return `geo:grid:${board.rows}x${board.cols}`;
    case "quads":
      return `geo:quad:${board.shape}`;
    case "share":
      return `geo:share:${board.den}`;
    case "fold":
      return `geo:fold:${board.fig}:${board.mirror ? "yes" : "no"}`;
    case "flat":
    case "solid":
    case "sides":
    case "symmetry":
    case "parts":
    case "color":
    case "match":
    case "pattern":
    case "angles":
      return null;
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}
