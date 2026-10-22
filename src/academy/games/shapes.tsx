import type { Rng } from "@/lib/rng";
import { getLocale, partPhrase, shapeWithArticle, shapeWord, t } from "../i18n";
import { buddyName, pickTalk } from "./flavor";
import { shapesCard } from "./cards";
import { sideCount, symmetryAnswer, type ShapeBoard, type ShapeName } from "./boards";
import { nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import { makeAngleQuestion, makeColorQuestion, makeMatchQuestion, makePatternQuestion, spanSheet } from "./span";
import { geometryArt, geometrySheet, makeGeometryQuestion } from "./geometry";
import { AngleFig, ColorSwatch, GeoMark, SceneCard, ShapeFig, sceneModule } from "./scene-ui";
import type { ChoiceQ, PromptProps, SheetItem } from "./types";

export const SHAPE_LEVELS = [
  "color",
  "match",
  "pattern",
  "flat",
  "solid",
  "position",
  "sort",
  "traits",
  "compose",
  "sides",
  "faces",
  "rows",
  "symmetry",
  "quads",
  "share",
  "parts",
  "cover",
  "fold",
  "angles",
] as const;
export type ShapeLevel = (typeof SHAPE_LEVELS)[number];

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

function nameQuestion(rng: Rng, shape: ShapeName, pool: ShapeName[], level: "flat" | "solid"): ChoiceQ {
  const board: ShapeBoard = { game: "shapes", mode: level, shape };
  const buddy = buddyName(rng);
  const labels: Record<string, string> = {};
  for (const id of pool) labels[id] = shapeWord(id);
  return sceneQuestion(rng, {
    game: "shapes",
    title: pickTalk(rng, [
      ["What shape is this?", "¿Qué figura es esta?"],
      [`${buddy} holds up a shape. What shape is it?`, `${buddy} muestra una figura. ¿Qué figura es?`, `${buddy} mostra uma figura. Que figura é?`, `${buddy} montre une figure. Quelle figure est-ce ?`, `${buddy}举起一个图形。这是什么图形？`, `${buddy} एक आकृति दिखाता है। वह कौन सी आकृति है?`, `${buddy} يرفع شكلًا. ما هذا الشكل؟`],
    ]),
    hint: level === "flat" ? t("A flat shape sits on the page", "Una figura plana se queda en la hoja") : t("A solid shape you could hold", "Una figura que puedes tener en la mano"),
    answer: shape,
    choices: uniqueChoices(rng, shape, pool),
    skill: `shapes:${level}`,
    tags: [level],
    solved: t(`It is a ${shape}`, `Es ${shapeWithArticle(shape)}`, `É ${shapeWithArticle(shape)}`, `C'est ${shapeWithArticle(shape)}`, `这是${shapeWord(shape)}`, `यह ${shapeWord(shape)} है`, `هذا الشكل ${shapeWord(shape)}`),
    picture: shape,
    hands: false,
    quietChoices: false,
    labels,
    board,
    factKey: `${level}:${shape}`,
  });
}

function makeSides(rng: Rng): ChoiceQ {
  const shape = rng.pick(POLYGONS);
  const askSides = rng.next() < 0.5;
  const count = sideCount(shape);
  const board: ShapeBoard = { game: "shapes", mode: "sides", shape, ask: askSides ? "sides" : "corners" };
  const buddy = buddyName(rng);
  const named = shapeWithArticle(shape);
  return sceneQuestion(rng, {
    game: "shapes",
    title: askSides
      ? pickTalk(rng, [
          ["How many sides?", "¿Cuántos lados tiene?"],
          [`${buddy} asks how many sides`, `${buddy} pregunta cuántos lados tiene`, `${buddy} pergunta quantos lados`, `${buddy} demande combien de côtés`, `${buddy}问有几条边`, `${buddy} पूछता है कितनी भुजाएँ हैं`, `${buddy} يسأل كم عدد الأضلاع`],
        ])
      : pickTalk(rng, [
          ["How many corners?", "¿Cuántas esquinas tiene?"],
          [`${buddy} asks how many corners`, `${buddy} pregunta cuántas esquinas tiene`, `${buddy} pergunta quantos cantos`, `${buddy} demande combien de coins`, `${buddy}问有几个角`, `${buddy} पूछता है कितने कोने हैं`, `${buddy} يسأل كم عدد الزوايا`],
        ]),
    hint: t("Count around the shape", "Cuenta alrededor de la figura"),
    answer: String(count),
    choices: nearChoices(rng, count, 0, 8),
    skill: "shapes:sides",
    tags: ["sides"],
    solved: askSides
      ? t(`A ${shape} has ${count} sides`, `${named} tiene ${count} lados`, `${named} tem ${count} lados`, `${named} a ${count} côtés`, `${shapeWord(shape)}有${count}条边`, `${shapeWord(shape)} की ${count} भुजाएँ होती हैं`, `لدى ${shapeWord(shape)} ${count} أضلاع`)
      : t(`A ${shape} has ${count} corners`, `${named} tiene ${count} esquinas`, `${named} tem ${count} vértices`, `${named} a ${count} sommets`, `${shapeWord(shape)}有${count}个角`, `${shapeWord(shape)} के ${count} कोने होते हैं`, `لدى ${shapeWord(shape)} ${count} زوايا`),
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
  const rawAnswer = symmetryAnswer(shape);
  const answer = rawAnswer === "more than 4" && getLocale() === "hi" ? "4 से अधिक" : rawAnswer === "more than 4" && getLocale() === "ar" ? "أكثر من 4" : rawAnswer;
  const choiceIds = ["1", "2", "3", "4", "more than 4"].map((id) =>
    id === "more than 4" && getLocale() === "hi" ? "4 से अधिक" : id === "more than 4" && getLocale() === "ar" ? "أكثر من 4" : id,
  );
  const zhSymmetry = answer === "more than 4" ? `${shapeWord(shape)}的对称轴多于4条` : `${shapeWord(shape)}有${answer}条对称轴`;
  const hiSymmetry = answer === "more than 4" ? `${shapeWord(shape)} की 4 से अधिक सममिति रेखाएँ होती हैं` : `${shapeWord(shape)} की ${answer} सममिति रेखाएँ होती हैं`;
  const arSymmetry = rawAnswer === "more than 4" ? `لدى ${shapeWord(shape)} أكثر من 4 محاور تناظر` : `لدى ${shapeWord(shape)} ${answer} من محاور التناظر`;
  const board: ShapeBoard = { game: "shapes", mode: "symmetry", shape };
  const buddy = buddyName(rng);
  return sceneQuestion(rng, {
    game: "shapes",
    title: pickTalk(rng, [
      ["How many lines of symmetry?", "¿Cuántas líneas de simetría tiene?"],
      [`${buddy} folds the shape. How many lines of symmetry?`, `${buddy} dobla la figura. ¿Cuántas líneas de simetría tiene?`, `${buddy} dobra a figura. Quantas linhas de simetria?`, `${buddy} plie la figure. Combien de lignes de symétrie ?`, `${buddy}把图形对折。有几条对称轴？`, `${buddy} आकृति को मोड़ता है। कितनी सममिति रेखाएँ हैं?`, `${buddy} يطوي الشكل. كم محور تناظر؟`],
    ]),
    hint: t("A line of symmetry makes two matching halves", "Una línea de simetría hace dos mitades iguales"),
    answer,
    choices: uniqueChoices(rng, answer, choiceIds),
    skill: "shapes:symmetry",
    tags: ["symmetry"],
    solved: t(`A ${shape} has ${answer} lines of symmetry`, `${shapeWithArticle(shape)} tiene ${answer === "more than 4" ? "más de 4" : answer} líneas de simetría`, `${shapeWithArticle(shape)} tem ${answer === "more than 4" ? "mais de 4" : answer} linhas de simetria`, `${shapeWithArticle(shape)} a ${answer === "more than 4" ? "plus de 4" : answer} axes de symétrie`, zhSymmetry, hiSymmetry, arSymmetry),
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
    title:
      part.label === "not equal"
        ? t("Which picture shows parts that are not equal?", "¿Qué dibujo muestra partes que no son iguales?")
        : t(`Which picture shows ${part.label}?`, `¿Qué dibujo muestra ${partPhrase(part.label)}?`, `Qual desenho mostra ${partPhrase(part.label)}?`, `Quel dessin montre ${partPhrase(part.label)} ?`, `哪张图是${partPhrase(part.label)}？`, `कौन सा चित्र ${partPhrase(part.label)} दिखाता है?`, `أي صورة تُظهر ${partPhrase(part.label)}؟`),
    hint: t("Equal parts are the same size", "Las partes iguales son del mismo tamaño"),
    answer: part.id,
    choices: rng.shuffle(PARTS.map((row) => row.id)),
    skill: "shapes:parts",
    tags: ["parts"],
    solved: t(part.label, partPhrase(part.id)),
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
    case "color":
      return makeColorQuestion(rng);
    case "match":
      return makeMatchQuestion(rng);
    case "pattern":
      return makePatternQuestion(rng);
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
    case "angles":
      return makeAngleQuestion(rng);
    case "position":
    case "sort":
    case "traits":
    case "compose":
    case "faces":
    case "rows":
    case "quads":
    case "share":
    case "cover":
    case "fold":
      return makeGeometryQuestion(rng, level);
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
    case "color":
    case "match":
    case "pattern":
    case "angles": {
      const printed = spanSheet(rng, "shapes", safe);
      if (printed) return printed;
      return { prompt: t("Name the matching shape.", "Nombra la figura igual."), answer: "circle" };
    }
    case "flat": {
      const shape = rng.pick(FLAT);
      const clue =
        shape === "circle"
          ? t("no corners", "sin esquinas")
          : shape === "triangle"
            ? t("3 sides", "3 lados")
            : shape === "square"
              ? t("4 equal sides", "4 lados iguales")
              : t("4 sides and is longer than it is tall", "4 lados y es más largo que alto");
      return { prompt: t(`Name the flat shape with ${clue}.`, `Nombra la figura plana: ${clue}.`, `Diga a figura plana: ${clue}.`, `Dis la figure plate : ${clue}.`, `说出有${clue}的平面图形。`, `${clue} वाली सपाट आकृति का नाम बताओ।`, `سمِّ الشكل المسطح: ${clue}.`), answer: shape };
    }
    case "solid": {
      const shape = rng.pick(SOLID);
      const clue =
        shape === "sphere"
          ? t("rolls every way", "rueda para todos lados")
          : shape === "cone"
            ? t("a point and a round base", "una punta y una base redonda")
            : shape === "cube"
              ? t("6 square faces", "6 caras cuadradas")
              : t("a round top and a round bottom, like a can", "una tapa redonda y una base redonda, como una lata");
      return { prompt: t(`Name the solid shape with ${clue}.`, `Nombra el cuerpo geométrico: ${clue}.`, `Diga o sólido: ${clue}.`, `Dis le solide : ${clue}.`, `说出有${clue}的立体图形。`, `${clue} वाली ठोस आकृति का नाम बताओ।`, `سمِّ المجسم: ${clue}.`), answer: shape };
    }
    case "sides": {
      const shape = rng.pick(POLYGONS);
      const word = rng.next() < 0.5 ? "sides" : "corners";
      return {
        prompt:
          word === "sides"
            ? t(`How many sides does a ${shape} have?`, `¿Cuántos lados tiene ${shapeWithArticle(shape)}?`, `Quantos lados tem ${shapeWithArticle(shape)}?`, `Combien de côtés a ${shapeWithArticle(shape)} ?`, `${shapeWord(shape)}有几条边？`, `${shapeWord(shape)} की कितनी भुजाएँ होती हैं?`, `كم عدد أضلاع ${shapeWord(shape)}؟`)
            : t(`How many corners does a ${shape} have?`, `¿Cuántas esquinas tiene ${shapeWithArticle(shape)}?`, `Quantos vértices tem ${shapeWithArticle(shape)}?`, `Combien de sommets a ${shapeWithArticle(shape)} ?`, `${shapeWord(shape)}有几个角？`, `${shapeWord(shape)} के कितने कोने होते हैं?`, `كم عدد زوايا ${shapeWord(shape)}؟`),
        answer: String(SIDE_WORDS[shape] ?? sideCount(shape)),
      };
    }
    case "symmetry": {
      const shape = rng.pick(["square", "rectangle", "triangle", "circle"] as const);
      return {
        prompt: t(
          `How many lines of symmetry does a ${shape} have?`,
          `¿Cuántas líneas de simetría tiene ${shapeWithArticle(shape)}?`, `Quantas linhas de simetria tem ${shapeWithArticle(shape)}?`,
        `Combien d'axes de symétrie a ${shapeWithArticle(shape)} ?`, `${shapeWord(shape)}有几条对称轴？`, `${shapeWord(shape)} की कितनी सममिति रेखाएँ होती हैं?`, `كم عدد محاور التناظر لدى ${shapeWord(shape)}؟`),
        answer: symmetryAnswer(shape),
      };
    }
    case "position":
    case "sort":
    case "traits":
    case "compose":
    case "faces":
    case "rows":
    case "quads":
    case "share":
    case "cover":
    case "fold":
      return geometrySheet(rng, safe);
    case "parts": {
      const part = rng.pick(PARTS);
      const equal = part.id === "halves" ? "2" : part.id === "thirds" ? "3" : part.id === "fourths" ? "4" : "";
      return {
        prompt: equal
          ? t(
              `A shape is split into ${equal} equal parts. What are the parts called?`,
              `Una figura está partida en ${equal} partes iguales. ¿Cómo se llaman?`, `Uma figura está dividida em ${equal} partes iguais. Como elas se chamam?`,
            `Une figure est partagée en ${equal} parts égales. Comment s'appellent ces parts ?`, `一个图形平均分成${equal}份。这些份叫什么？`, `एक आकृति ${equal} बराबर भागों में बँटी है। इन भागों को क्या कहते हैं?`, `شكل مقسوم إلى ${equal} أجزاء متساوية. ما اسم هذه الأجزاء؟`)
          : t(
              "A shape is split into parts that are not the same size. What do you call those parts?",
              "Una figura está partida en partes que no son del mismo tamaño. ¿Cómo se llaman?",
            ),
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
    case "color":
      return <ColorSwatch color={board.color} />;
    case "match":
      return <ShapeFig name={board.shape} />;
    case "pattern":
      return (
        <div className="ac-pattern">
          {board.items.map((color, index) => (
            <ColorSwatch key={`${color}-${index}`} color={color} />
          ))}
          <span className="ac-pattern-next">?</span>
        </div>
      );
    case "flat":
    case "solid":
    case "sides":
    case "symmetry":
      return <ShapeFig name={board.shape} />;
    case "parts":
      return <p className="ac-big-num">{t("Find it", "Búscala")}</p>;
    case "angles":
      return <AngleFig kind={board.kind} />;
    case "position":
    case "sort":
    case "traits":
    case "compose":
    case "faces":
    case "rows":
    case "quads":
    case "share":
    case "cover":
    case "fold": {
      const code = geometryArt(board);
      return code ? <GeoMark code={code} /> : null;
    }
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

export const shapesGame = sceneModule({
  ...shapesCard,
  short: "Shapes",
  makeQuestion: (rng, level) => makeShapeQuestion(rng, isShapeLevel(level) ? level : "flat"),
  makeSheetItem: sheetItem,
  Prompt: ShapesPrompt,
});
