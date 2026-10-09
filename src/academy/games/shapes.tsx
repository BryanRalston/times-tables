import type { Rng } from "@/lib/rng";
import type { Grade } from "../model";
import { sideCount, symmetryAnswer, type ShapeBoard, type ShapeName } from "./boards";
import { nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import { SceneCard, ShapeFig, sceneModule } from "./scene-ui";
import type { ChoiceQ, PromptProps, SheetItem } from "./types";

export const SHAPE_LEVELS = ["flat", "solid", "sides", "symmetry", "parts"] as const;
export type ShapeLevel = (typeof SHAPE_LEVELS)[number];

const LEVELS = [
  { id: "flat", label: "Flat shapes", num: 1 },
  { id: "solid", label: "Solid shapes", num: 2 },
  { id: "sides", label: "Sides and corners", num: 3 },
  { id: "symmetry", label: "Symmetry", num: 4 },
  { id: "parts", label: "Halves, thirds, fourths", num: 5 },
] as const;

const BARS = [
  { key: "shapes:flat", label: "Flat shapes" },
  { key: "shapes:solid", label: "Solid shapes" },
  { key: "shapes:sides", label: "Sides and corners" },
  { key: "shapes:symmetry", label: "Symmetry" },
  { key: "shapes:parts", label: "Equal parts" },
];

const FLAT: ShapeName[] = ["circle", "triangle", "square", "rectangle"];
const SOLID: ShapeName[] = ["cube", "sphere", "cone", "cylinder"];
const POLYGONS: ShapeName[] = ["triangle", "square", "rectangle", "pentagon", "hexagon"];
const PARTS = [
  { id: "halves", label: "halves", picture: "shape:halves" },
  { id: "thirds", label: "thirds", picture: "shape:thirds" },
  { id: "fourths", label: "fourths", picture: "shape:fourths" },
  { id: "unequal", label: "not equal", picture: "shape:unequal" },
] as const;

export function isShapeLevel(value: unknown): value is ShapeLevel {
  return typeof value === "string" && (SHAPE_LEVELS as readonly string[]).includes(value);
}

function defaultLevel(grade: Grade): ShapeLevel {
  switch (grade) {
    case "K":
      return "flat";
    case "1":
      return "solid";
    case "2":
      return "sides";
    case "3":
      return "parts";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

function nameQuestion(rng: Rng, shape: ShapeName, pool: ShapeName[], level: "flat" | "solid"): ChoiceQ {
  const board: ShapeBoard = { game: "shapes", mode: level, shape };
  return sceneQuestion(rng, {
    game: "shapes",
    title: "What shape is this?",
    hint: level === "flat" ? "A flat shape sits on the page" : "A solid shape you could hold",
    answer: shape,
    choices: uniqueChoices(rng, shape, pool),
    skill: `shapes:${level}`,
    tags: [level],
    solved: `It is a ${shape}`,
    picture: shape,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `${level}:${shape}`,
  });
}

function makeSides(rng: Rng): ChoiceQ {
  const shape = rng.pick(POLYGONS);
  const askSides = rng.next() < 0.5;
  const count = sideCount(shape);
  const board: ShapeBoard = { game: "shapes", mode: "sides", shape, ask: askSides ? "sides" : "corners" };
  return sceneQuestion(rng, {
    game: "shapes",
    title: askSides ? "How many sides?" : "How many corners?",
    hint: "Count around the shape",
    answer: String(count),
    choices: nearChoices(rng, count, 0, 8),
    skill: "shapes:sides",
    tags: ["sides"],
    solved: `A ${shape} has ${count} ${askSides ? "sides" : "corners"}`,
    picture: shape,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `sides:${shape}:${board.ask}`,
  });
}

function makeSymmetry(rng: Rng): ChoiceQ {
  const shape = rng.pick(["square", "rectangle", "triangle", "circle"] as const);
  const answer = symmetryAnswer(shape);
  const board: ShapeBoard = { game: "shapes", mode: "symmetry", shape };
  return sceneQuestion(rng, {
    game: "shapes",
    title: "How many lines of symmetry?",
    hint: "A line of symmetry makes two matching halves",
    answer,
    choices: uniqueChoices(rng, answer, ["1", "2", "3", "4", "more than 4"]),
    skill: "shapes:symmetry",
    tags: ["symmetry"],
    solved: `A ${shape} has ${answer} lines of symmetry`,
    picture: shape,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `symmetry:${shape}`,
  });
}

function makeParts(rng: Rng): ChoiceQ {
  const part = rng.pick(PARTS);
  const pictures: Record<string, string> = {};
  const labels: Record<string, string> = {};
  for (const row of PARTS) {
    pictures[row.id] = row.picture;
    labels[row.id] = "";
  }
  const board: ShapeBoard = { game: "shapes", mode: "parts", parts: part.id };
  return sceneQuestion(rng, {
    game: "shapes",
    title: `Which picture shows ${part.label === "not equal" ? "parts that are not equal" : part.label}?`,
    hint: "Equal parts are the same size",
    answer: part.id,
    choices: rng.shuffle(PARTS.map((row) => row.id)),
    skill: "shapes:parts",
    tags: ["parts"],
    solved: part.label,
    picture: part.picture,
    hands: true,
    quietChoices: false,
    labels,
    pictures,
    board,
    factKey: `parts:${part.id}`,
  });
}

export function makeShapeQuestion(rng: Rng, level: ShapeLevel): ChoiceQ {
  switch (level) {
    case "flat":
      return nameQuestion(rng, rng.pick(FLAT), FLAT, "flat");
    case "solid":
      return nameQuestion(rng, rng.pick(SOLID), SOLID, "solid");
    case "sides":
      return makeSides(rng);
    case "symmetry":
      return makeSymmetry(rng);
    case "parts":
      return makeParts(rng);
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

const SIDE_WORDS: Record<string, number> = {
  triangle: 3,
  square: 4,
  rectangle: 4,
  pentagon: 5,
  hexagon: 6,
};

function sheetItem(rng: Rng, level: string): SheetItem {
  const safe: ShapeLevel = isShapeLevel(level) ? level : "flat";
  switch (safe) {
    case "flat": {
      const shape = rng.pick(FLAT);
      const clue =
        shape === "circle"
          ? "no corners"
          : shape === "triangle"
            ? "3 sides"
            : shape === "square"
              ? "4 equal sides"
              : "4 sides and is longer than it is tall";
      return { prompt: `Name the flat shape with ${clue}.`, answer: shape };
    }
    case "solid": {
      const shape = rng.pick(SOLID);
      const clue =
        shape === "sphere"
          ? "rolls every way"
          : shape === "cone"
            ? "a point and a round base"
            : shape === "cube"
              ? "6 square faces"
              : "a round top and a round bottom, like a can";
      return { prompt: `Name the solid shape with ${clue}.`, answer: shape };
    }
    case "sides": {
      const shape = rng.pick(POLYGONS);
      const word = rng.next() < 0.5 ? "sides" : "corners";
      return { prompt: `How many ${word} does a ${shape} have?`, answer: String(SIDE_WORDS[shape] ?? sideCount(shape)) };
    }
    case "symmetry": {
      const shape = rng.pick(["square", "rectangle", "triangle", "circle"] as const);
      return { prompt: `How many lines of symmetry does a ${shape} have?`, answer: symmetryAnswer(shape) };
    }
    case "parts": {
      const part = rng.pick(PARTS);
      const equal = part.id === "halves" ? "2" : part.id === "thirds" ? "3" : part.id === "fourths" ? "4" : "";
      return {
        prompt: equal
          ? `A shape is split into ${equal} equal parts. What are the parts called?`
          : "A shape is split into parts that are not the same size. What do you call those parts?",
        answer: part.label,
      };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}

export function ShapesPrompt({ question, reveal, mascot, happy }: PromptProps) {
  void reveal;
  if (question.visual.kind !== "scene" || question.visual.board.game !== "shapes") return null;
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
      <ShapeArt board={board} />
    </SceneCard>
  );
}

function ShapeArt({ board }: { board: ShapeBoard }) {
  switch (board.mode) {
    case "flat":
    case "solid":
    case "sides":
    case "symmetry":
      return <ShapeFig name={board.shape} />;
    case "parts":
      return <p className="ac-big-num">Find it</p>;
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

export const shapesGame = sceneModule({
  id: "shapes",
  title: "Shapes",
  short: "Shapes",
  audience: "K–3",
  tint: "berry",
  mascot: "cat",
  sheetSlug: "shapes",
  sheetScreen: "sheet-shapes",
  blurb:
    "Free geometry practice for grades K–3. Name flat and solid shapes, count sides and corners, find lines of symmetry, and split shapes into halves, thirds, and fourths.",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "flat",
  isLevel: isShapeLevel,
  bars: BARS,
  chips: BARS,
  makeQuestion: (rng, level) => makeShapeQuestion(rng, isShapeLevel(level) ? level : "flat"),
  makeSheetItem: sheetItem,
  Prompt: ShapesPrompt,
});
