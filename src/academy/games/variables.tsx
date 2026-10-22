import type { Rng } from "@/lib/rng";
import { t, yesDetail } from "../i18n";
import { variablesCard } from "./cards";
import { Groups } from "../ui/bits";
import { CountToken } from "../ui/count-token";
import type { VariableBoard, VariableBox, VariableMode } from "./boards";
import { nearChoices, sceneQuestion } from "./pick";
import { SceneCard, sceneModule } from "./scene-ui";
import { MINUS, TIMES, type ChoiceQ, type GameModule, type PromptProps, type SheetItem } from "./types";

export const VARIABLE_LEVELS = ["addend", "either", "factor", "times", "steps"] as const;
export type VariableLevel = (typeof VARIABLE_LEVELS)[number];

type Truth = Omit<VariableBoard, "game" | "left" | "right" | "result" | "extra">;

export function isVariableLevel(value: unknown): value is VariableLevel {
  return typeof value === "string" && (VARIABLE_LEVELS as readonly string[]).includes(value);
}

function plainResult(fact: Pick<Truth, "op" | "a" | "b">): number {
  switch (fact.op) {
    case "+":
      return fact.a + fact.b;
    case "-":
      return fact.a - fact.b;
    case "×":
      return fact.a * fact.b;
    case "÷":
      return fact.b === 0 ? 0 : fact.a / fact.b;
    default: {
      const neverOp: never = fact.op;
      return neverOp;
    }
  }
}

function stepTotal(fact: Pick<Truth, "a" | "b" | "c" | "extraOp">): number {
  const product = fact.a * fact.b;
  return fact.extraOp === "+" ? product + fact.c : product - fact.c;
}

export function variableAnswer(fact: Pick<Truth, "mode" | "op" | "extraOp" | "a" | "b" | "c" | "box">): number {
  switch (fact.box) {
    case "left":
      return fact.a;
    case "right":
      return fact.b;
    case "extra":
      return fact.c;
    case "result":
      return fact.mode === "steps" ? stepTotal(fact) : plainResult(fact);
    default: {
      const neverBox: never = fact.box;
      return neverBox;
    }
  }
}

function symbol(op: Truth["op"]): string {
  switch (op) {
    case "+":
      return "+";
    case "-":
      return MINUS;
    case "×":
      return TIMES;
    case "÷":
      return "÷";
    default: {
      const neverOp: never = op;
      return neverOp;
    }
  }
}

export function variableSolved(fact: Truth): string {
  if (fact.mode === "steps") {
    const extra = fact.extraOp === "+" ? "+" : MINUS;
    return `${fact.a} ${TIMES} ${fact.b} ${extra} ${fact.c} = ${stepTotal(fact)}`;
  }
  return `${fact.a} ${symbol(fact.op)} ${fact.b} = ${plainResult(fact)}`;
}

function countLine(n: number, one: string, many: string, oneEs: string, manyEs: string): string {
  if (n === 1) return t(`1 ${one}`, `1 ${oneEs}`, `1 ${oneEs}`);
  return t(`${n} ${many}`, `${n} ${manyEs}`, `${n} ${manyEs}`);
}

/** Step captions a miss can speak from clips that already exist. */
export function variableCaptions(fact: Truth): string[] {
  const solved = variableSolved(fact);
  if (fact.mode === "steps") {
    const product = fact.a * fact.b;
    const extra = fact.extraOp === "+" ? "+" : MINUS;
    return [`${fact.a} ${TIMES} ${fact.b} = ${product}`, `${product} ${extra} ${fact.c} = ${stepTotal(fact)}`];
  }
  if (fact.op === "+") {
    const start = fact.box === "left" ? fact.b : fact.a;
    const add = fact.box === "left" ? fact.a : fact.b;
    return [t(`Start with ${start}`, `Empieza con ${start}`, `Comece com ${start}`), t(`Add ${add}`, `Suma ${add}`, `Some ${add}`), solved];
  }
  if (fact.op === "-") {
    return [t(`Start with ${fact.a}`, `Empieza con ${fact.a}`, `Comece com ${fact.a}`), t(`Take away ${fact.b}`, `Quita ${fact.b}`, `Tire ${fact.b}`), solved];
  }
  if (fact.op === "×") {
    return [countLine(fact.a, "group", "groups", "grupo", "grupos"), t(`${fact.b} in each group`, `${fact.b} en cada grupo`, `${fact.b} em cada grupo`), solved];
  }
  const each = plainResult(fact);
  return [countLine(fact.b, "group", "groups", "grupo", "grupos"), t(`${each} in each group`, `${each} en cada grupo`, `${each} em cada grupo`), solved];
}

export function variableKey(fact: Truth): string {
  return `${fact.mode}:${fact.a}:${fact.op}:${fact.b}:${fact.extraOp}:${fact.c}:${fact.box}`;
}

function boardFrom(fact: Truth): VariableBoard {
  const total = fact.mode === "steps" ? stepTotal(fact) : plainResult(fact);
  return {
    game: "variables",
    ...fact,
    left: fact.box === "left" ? null : fact.a,
    right: fact.box === "right" ? null : fact.b,
    result: fact.box === "result" ? null : total,
    extra: fact.mode === "steps" ? (fact.box === "extra" ? null : fact.c) : null,
  };
}

function pickBox(rng: Rng, boxes: readonly VariableBox[]): VariableBox {
  return rng.pick([...boxes]);
}

function baseFact(mode: VariableMode, op: Truth["op"], a: number, b: number, box: VariableBox, c = 0, extraOp: "+" | "-" = "+"): Truth {
  return { mode, op, extraOp, a, b, c, box };
}

export function rollVariable(rng: Rng, level: VariableLevel): VariableBoard {
  switch (level) {
    case "addend": {
      const sum = rng.int(2, 10);
      const leftUnknown = rng.next() < 0.5;
      const unknown = rng.int(1, sum - 1);
      const known = sum - unknown;
      const a = leftUnknown ? unknown : known;
      const b = leftUnknown ? known : unknown;
      return boardFrom(baseFact("addend", "+", a, b, leftUnknown ? "left" : "right"));
    }
    case "either": {
      if (rng.next() < 0.5) {
        const sum = rng.int(2, 20);
        const a = rng.int(1, sum - 1);
        return boardFrom(baseFact("either", "+", a, sum - a, pickBox(rng, ["left", "right", "result"])));
      }
      const a = rng.int(2, 20);
      const b = rng.int(1, a - 1);
      return boardFrom(baseFact("either", "-", a, b, pickBox(rng, ["left", "right", "result"])));
    }
    case "factor": {
      const a = rng.int(1, 5);
      const b = rng.int(1, 5);
      return boardFrom(baseFact("factor", "×", a, b, pickBox(rng, ["left", "right"])));
    }
    case "times": {
      if (rng.next() < 0.55) {
        const a = rng.int(1, 10);
        const b = rng.int(1, 10);
        return boardFrom(baseFact("times", "×", a, b, pickBox(rng, ["left", "right", "result"])));
      }
      const b = rng.int(1, 10);
      const quotient = rng.int(1, 10);
      return boardFrom(baseFact("times", "÷", b * quotient, b, pickBox(rng, ["left", "right", "result"])));
    }
    case "steps": {
      const a = rng.int(2, 5);
      const b = rng.int(1, 5);
      const product = a * b;
      const minus = rng.next() < 0.4 && product > 2;
      const extraOp = minus ? "-" : "+";
      const c = minus ? rng.int(1, Math.min(5, product - 1)) : rng.int(1, 5);
      return boardFrom(baseFact("steps", "×", a, b, pickBox(rng, ["left", "right", "extra", "result"]), c, extraOp));
    }
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

export type PictureKind = "holes" | "take" | "groups" | "none";

export function pictureKind(board: VariableBoard): PictureKind {
  if (board.mode === "addend") return "holes";
  if (board.mode === "either" && board.op === "+" && board.a + board.b <= 10) return "holes";
  if (board.mode === "either" && board.op === "-" && board.a <= 10) return "take";
  if (board.op === "×" && board.a <= 5 && board.b <= 10 && board.a * board.b <= 20) return "groups";
  if (board.op === "÷" && board.b <= 5 && board.a / board.b <= 5 && board.a <= 20) return "groups";
  return "none";
}

function hintFor(kind: PictureKind): string {
  if (kind === "holes" || kind === "take") return t("Count the dots", "Cuenta los puntos");
  if (kind === "groups") return t("Count the groups", "Cuenta los grupos");
  return t("What is missing?", "¿Qué falta?");
}

function titleFor(rng: Rng): string {
  const roll = rng.int(0, 2);
  if (roll === 0) return t("Tap the missing number!", "¡Toca el número que falta!");
  if (roll === 1) return t("What number is hiding?", "¿Qué número se esconde?");
  return t("What is missing?", "¿Qué falta?");
}

function choiceHi(level: VariableLevel): number {
  switch (level) {
    case "addend":
      return 10;
    case "either":
      return 20;
    case "factor":
      return 25;
    case "times":
      return 100;
    case "steps":
      return 30;
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

export function printVariable(board: VariableBoard): string {
  const blank = "__";
  const left = board.box === "left" ? blank : String(board.a);
  const right = board.box === "right" ? blank : String(board.b);
  if (board.mode === "steps") {
    const extra = board.box === "extra" ? blank : String(board.c);
    const result = board.box === "result" ? blank : String(stepTotal(board));
    const extraOp = board.extraOp === "+" ? "+" : MINUS;
    return `${left} ${TIMES} ${right} ${extraOp} ${extra} = ${result}`;
  }
  const result = board.box === "result" ? blank : String(plainResult(board));
  return `${left} ${symbol(board.op)} ${right} = ${result}`;
}

export function makeVariableQuestion(rng: Rng, level: VariableLevel): ChoiceQ {
  const board = rollVariable(rng, level);
  const answer = variableAnswer(board);
  const kind = pictureKind(board);
  const solved = variableSolved(board);
  return sceneQuestion(rng, {
    game: "variables",
    title: titleFor(rng),
    hint: hintFor(kind),
    answer: String(answer),
    choices: nearChoices(rng, answer, 0, choiceHi(level)),
    skill: `variables:${level}`,
    tags: [],
    solved,
    picture: kind,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: variableKey(board),
  });
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const safe: VariableLevel = isVariableLevel(level) ? level : "addend";
  const board = rollVariable(rng, safe);
  return { prompt: printVariable(board), answer: String(variableAnswer(board)) };
}

function Faces({ n, faded = false }: { n: number; faded?: boolean }) {
  return (
    <span className="ac-var-faces">
      {Array.from({ length: n }, (_, i) => (
        <CountToken key={i} faded={faded} />
      ))}
    </span>
  );
}

function Holes({ n }: { n: number }) {
  return (
    <span className="ac-var-holes" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}

function AddendPicture({ board }: { board: VariableBoard }) {
  if (board.box === "result") {
    return (
      <div className="ac-var-pic">
        <Faces n={board.a} />
        <span className="ac-op-mini">+</span>
        <Faces n={board.b} />
      </div>
    );
  }
  return (
    <div className="ac-var-pic">
      {board.box === "left" ? <Holes n={board.a} /> : <Faces n={board.a} />}
      <span className="ac-op-mini">+</span>
      {board.box === "right" ? <Holes n={board.b} /> : <Faces n={board.b} />}
    </div>
  );
}

function TakePicture({ board }: { board: VariableBoard }) {
  const kept = board.a - board.b;
  if (board.box === "left") {
    return (
      <div className="ac-var-pic">
        <span className="ac-var-cluster is-box">
          <Faces n={kept} />
          <Faces n={board.b} faded />
        </span>
      </div>
    );
  }
  return (
    <div className="ac-var-pic">
      <span className={board.box === "result" ? "ac-var-cluster is-box" : "ac-var-cluster"}>
        <Faces n={kept} />
      </span>
      <span className={board.box === "right" ? "ac-var-cluster is-box" : "ac-var-cluster"}>
        <Faces n={board.b} faded />
      </span>
    </div>
  );
}

function VariablePicture({ board }: { board: VariableBoard }) {
  const kind = pictureKind(board);
  const art = pictureArt(kind, board);
  if (!art) return null;
  return <div aria-hidden="true">{art}</div>;
}

function pictureArt(kind: PictureKind, board: VariableBoard) {
  switch (kind) {
    case "holes":
      return <AddendPicture board={board} />;
    case "take":
      return <TakePicture board={board} />;
    case "groups":
      if (board.op === "÷") return <Groups a={plainResult(board)} b={board.b} />;
      return <Groups a={board.a} b={board.b} />;
    case "none":
      return null;
    default: {
      const neverKind: never = kind;
      return neverKind;
    }
  }
}

export function VariableEquation({
  board,
  blankText,
}: {
  board: VariableBoard;
  blankText: string;
}) {
  return (
    <p className="ac-eq ac-eq-var">
      <EqSlot value={board.left} blank={board.box === "left"} blankText={blankText} />
      <span className="ac-op">{symbol(board.op)}</span>
      <EqSlot value={board.right} blank={board.box === "right"} blankText={blankText} />
      {board.mode === "steps" ? (
        <>
          <span className="ac-op">{board.extraOp === "+" ? "+" : MINUS}</span>
          <EqSlot value={board.extra} blank={board.box === "extra"} blankText={blankText} />
        </>
      ) : null}
      <span className="ac-op">=</span>
      <EqSlot value={board.result} blank={board.box === "result"} blankText={blankText} />
    </p>
  );
}

function EqSlot({ value, blank, blankText }: { value: number | null; blank: boolean; blankText: string }) {
  if (!blank) return <span>{value}</span>;
  return (
    <span className="ac-eq-box" aria-label={blankText ? undefined : "blank"}>
      {blankText || (
        <span className="ac-eq-mark" aria-hidden="true">
          ?
        </span>
      )}
    </span>
  );
}

export function VariablesPrompt({ question, reveal, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "variables") return null;
  const board = question.visual.board;
  return (
    <SceneCard title={question.title} mascot={mascot} happy={happy} hint={question.hint} hands={false} answer={question.answer}>
      <VariablePicture board={board} />
      <VariableEquation board={board} blankText={reveal ? question.answer : ""} />
    </SceneCard>
  );
}

export const variablesGame: GameModule = sceneModule({
  ...variablesCard,
  short: "What is missing",
  makeQuestion: (rng, level) => makeVariableQuestion(rng, isVariableLevel(level) ? level : "addend"),
  makeSheetItem: sheetItem,
  Prompt: VariablesPrompt,
});

export function praiseFor(board: VariableBoard): string {
  return yesDetail(variableSolved(board));
}
