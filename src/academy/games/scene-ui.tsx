import { useEffect, useState, type ReactNode } from "react";
import type { Grade } from "../model";
import { SquisheeImg, cx } from "../ui/bits";
import { CountToken } from "../ui/count-token";
import type { MeasureItem, ShapeName } from "./boards";
import { labelFor } from "./pick";
import type { ChoiceProps, ChoiceQ, GameModule, LevelDef, SheetItem, SkillRow } from "./types";

export function SceneCard({
  title,
  mascot,
  happy,
  hint,
  hands,
  answer,
  children,
}: {
  title: string;
  mascot: string;
  happy: boolean;
  hint: string;
  hands: boolean;
  answer: string;
  children: ReactNode;
}) {
  return (
    <section className="ac-qcard" data-hands={hands ? "yes" : "no"} data-answer={answer}>
      <h1>{title}</h1>
      <SquisheeImg id={mascot} className={cx("ac-mascot", happy && "is-happy")} />
      {children}
      <p className="ac-hint">{hint}</p>
    </section>
  );
}

export function SquisheeRow({ n, name }: { n: number; name: string }) {
  return (
    <div className="ac-emoji-row" aria-label={`${n} ${name}`}>
      {Array.from({ length: n }, (_, i) => (
        <CountToken key={i} />
      ))}
    </div>
  );
}

export function EmojiRow({ emoji, n, name }: { emoji: string; n: number; name: string }) {
  return (
    <div className="ac-emoji-row" aria-label={`${n} ${name}`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i}>{emoji}</span>
      ))}
    </div>
  );
}

export function TenFrames({ frames }: { frames: number[] }) {
  return (
    <div className="ac-frames">
      {frames.map((filled, frame) => (
        <div key={frame} className="ac-ten" aria-hidden="true">
          {Array.from({ length: 10 }, (_, cell) =>
            cell < filled ? <CountToken key={cell} /> : <i key={cell} />,
          )}
        </div>
      ))}
    </div>
  );
}

export function DotClusters({ clusters }: { clusters: number[] }) {
  return (
    <div className="ac-clusters" aria-hidden="true">
      {clusters.map((count, i) => (
        <span key={i} className="ac-cluster">
          {Array.from({ length: count }, (_, n) => (
            <i key={n} />
          ))}
        </span>
      ))}
    </div>
  );
}

export function BaseTen({ n }: { n: number }) {
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  if (hundreds > 4) return <p className="ac-big-num">{n}</p>;
  return (
    <div className="ac-base" aria-hidden="true">
      {Array.from({ length: hundreds }, (_, i) => (
        <i key={`h${i}`} className="ac-flat" />
      ))}
      {Array.from({ length: tens }, (_, i) => (
        <i key={`t${i}`} className="ac-rod" />
      ))}
      <span className="ac-ones">
        {Array.from({ length: ones }, (_, i) => (
          <i key={`o${i}`} className="ac-dot is-pink" />
        ))}
      </span>
    </div>
  );
}

export function ShapeFig({ name }: { name: ShapeName }) {
  const label = name;
  switch (name) {
    case "circle":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <circle cx="60" cy="50" r="36" />
        </svg>
      );
    case "triangle":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <polygon points="60,10 110,90 10,90" />
        </svg>
      );
    case "square":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <rect x="28" y="18" width="64" height="64" />
        </svg>
      );
    case "rectangle":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <rect x="12" y="28" width="96" height="48" />
        </svg>
      );
    case "pentagon":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <polygon points="60,8 108,42 90,92 30,92 12,42" />
        </svg>
      );
    case "hexagon":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <polygon points="36,12 84,12 110,50 84,88 36,88 10,50" />
        </svg>
      );
    case "cube":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <polygon points="28,38 62,22 96,38 62,54" />
          <polygon points="28,38 62,54 62,86 28,70" />
          <polygon points="62,54 96,38 96,70 62,86" />
        </svg>
      );
    case "sphere":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <circle cx="60" cy="50" r="36" />
          <ellipse cx="48" cy="38" rx="10" ry="6" className="is-shine" />
        </svg>
      );
    case "cone":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <ellipse cx="60" cy="78" rx="32" ry="12" />
          <polygon points="60,12 92,78 28,78" />
        </svg>
      );
    case "cylinder":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <ellipse cx="60" cy="24" rx="32" ry="12" />
          <path d="M28 24 V76 Q28 90 60 90 Q92 90 92 76 V24" />
          <ellipse cx="60" cy="76" rx="32" ry="12" />
        </svg>
      );
    default: {
      const neverName: never = name;
      return neverName;
    }
  }
}

export function FractionBar({ num, den }: { num: number; den: number }) {
  return (
    <div className="ac-frac" aria-label={`${num} of ${den}`}>
      {Array.from({ length: den }, (_, i) => (
        <i key={i} className={i < num ? "is-on" : ""} />
      ))}
    </div>
  );
}

export function FractionLine({ den, mark }: { den: number; mark: number }) {
  const ticks = Array.from({ length: den + 1 }, (_, i) => i);
  return (
    <svg className="ac-line" viewBox="0 0 320 80" role="img" aria-label="Number line from 0 to 1">
      <line x1="20" y1="36" x2="300" y2="36" className="ac-line-base" />
      {ticks.map((i) => {
        const x = 20 + (280 * i) / den;
        const text = i === 0 ? "0" : i === den ? "1" : `${i}/${den}`;
        return (
          <g key={i}>
            <line x1={x} y1="28" x2={x} y2="44" className="ac-line-tick" />
            <text x={x} y="66" textAnchor="middle">
              {text}
            </text>
            {i === mark ? <circle cx={x} cy="36" r="7" className="ac-line-dot" /> : null}
          </g>
        );
      })}
    </svg>
  );
}

export function Ruler({ inches }: { inches: number }) {
  return (
    <div className="ac-ruler-wrap">
      <div className="ac-ruler-obj" style={{ width: inches * 22 }} />
      <div className="ac-ruler" aria-hidden="true">
        {Array.from({ length: 13 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </div>
    </div>
  );
}

export function PictureGraph({ items }: { items: MeasureItem[] }) {
  return (
    <div className="ac-picto" aria-hidden="true">
      {items.map((item) => (
        <p key={item.name}>
          <span>
            {item.emoji} {item.name}
          </span>
          <span>{item.emoji.repeat(item.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function BarGraph({ items }: { items: MeasureItem[] }) {
  return (
    <div className="ac-graph" aria-hidden="true">
      {items.map((item) => (
        <div key={item.name} className="ac-graph-col">
          <i style={{ height: item.value * 12 }} />
          <span>
            {item.emoji}
            <small>{item.name}</small>
          </span>
        </div>
      ))}
    </div>
  );
}

export function StoryGroups({
  op,
  a,
  b,
  emoji,
}: {
  op: "+" | "-" | "×" | "÷";
  a: number;
  b: number;
  emoji: string;
}) {
  if (op === "+") {
    return (
      <div className="ac-emoji-row">
        <span>{emoji.repeat(a)}</span>
        <span className="ac-op-mini">+</span>
        <span>{emoji.repeat(b)}</span>
      </div>
    );
  }
  if (op === "-") {
    return (
      <div className="ac-emoji-row">
        <span>{emoji.repeat(Math.max(0, a - b))}</span>
        <span className="ac-gone">{emoji.repeat(b)}</span>
      </div>
    );
  }
  if (op === "×") {
    return (
      <div className="ac-groups" aria-hidden="true">
        {Array.from({ length: a }, (_, i) => (
          <span key={i} className="ac-group">
            {emoji.repeat(b)}
          </span>
        ))}
      </div>
    );
  }
  return <EmojiRow emoji={emoji} n={a} name="things" />;
}

function TextChoices({ question, onChoose }: { question: ChoiceQ; onChoose: ChoiceProps["onChoose"] }) {
  const labels = question.visual.kind === "scene" ? question.visual.labels : {};
  return (
    <div className="ac-choices">
      {question.choices.map((choice) => (
        <button key={choice} type="button" className="ac-choice is-word" onClick={() => onChoose(choice)}>
          {labels[choice] ?? choice}
        </button>
      ))}
    </div>
  );
}

function choiceCaption(label: string | undefined, choice: string): string {
  if (label === undefined) return choice;
  return label;
}

function pictureName(label: string | undefined, choice: string, picture: string): string {
  if (picture.startsWith("sq:")) {
    const n = Number(picture.slice(3));
    return Number.isFinite(n) ? `${n} squishees` : "A group of squishees";
  }
  if (label) return label;
  return choice;
}

function PictureFace({ picture }: { picture: string }) {
  if (picture.startsWith("sq:")) {
    const n = Number(picture.slice(3));
    if (Number.isFinite(n) && n > 0) {
      return (
        <span aria-hidden="true">
          <SquisheeRow n={n} name="squishees" />
        </span>
      );
    }
  }
  return (
    <span className="ac-pic-emoji" aria-hidden="true">
      {picture}
    </span>
  );
}

function PictureChoices({ question, onChoose }: { question: ChoiceQ; onChoose: ChoiceProps["onChoose"] }) {
  const visual = question.visual.kind === "scene" ? question.visual : null;
  const pictures = visual?.pictures ?? {};
  const labels = visual?.labels ?? {};
  return (
    <div className="ac-choices">
      {question.choices.map((choice) => {
        const caption = choiceCaption(labels[choice], choice);
        return (
          <button
            key={choice}
            type="button"
            className="ac-choice is-card"
            aria-label={pictureName(labels[choice], choice, pictures[choice] ?? "")}
            onClick={() => onChoose(choice)}
          >
            <PictureFace picture={pictures[choice] ?? ""} />
            {caption ? <small>{caption}</small> : null}
          </button>
        );
      })}
    </div>
  );
}

function useTries(resetKey: string) {
  const [tries, setTries] = useState(0);
  const [note, setNote] = useState("");
  useEffect(() => {
    setTries(0);
    setNote("");
  }, [resetKey]);
  return { tries, setTries, note, setNote };
}

function TenBuilder({
  answer,
  onChoose,
}: {
  answer: string;
  onChoose: ChoiceProps["onChoose"];
}) {
  const [on, setOn] = useState<boolean[]>(() => Array(10).fill(false));
  const { tries, setTries, note, setNote } = useTries(answer);
  const filled = on.filter(Boolean).length;

  function check() {
    if (String(filled) === answer) {
      onChoose(answer);
      return;
    }
    if (tries === 0) {
      setTries(1);
      setNote(filled === 0 ? "Tap a spot for each squishee." : "Count the squishees and try again.");
      return;
    }
    onChoose(String(filled));
  }

  return (
    <div className="ac-build">
      <div className="ac-ten">
        {on.map((filledCell, i) => (
          <button
            key={i}
            type="button"
            className={cx("ac-cell", filledCell && "is-on")}
            aria-label={filledCell ? "Squishee" : "Empty"}
            aria-pressed={filledCell}
            onClick={() => setOn((rows) => rows.map((cell, n) => (n === i ? !cell : cell)))}
          >
            {filledCell ? <CountToken /> : null}
          </button>
        ))}
      </div>
      <p className="ac-tile-note">{note}</p>
      <button type="button" className="ac-check" onClick={check}>
        Check
      </button>
    </div>
  );
}

function BlockBuilder({ answer, onChoose }: { answer: string; onChoose: ChoiceProps["onChoose"] }) {
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);
  const { tries, setTries, note, setNote } = useTries(answer);
  const value = tens * 10 + ones;

  function check() {
    if (String(value) === answer) {
      onChoose(answer);
      return;
    }
    if (tries === 0) {
      setTries(1);
      setNote("A ten is a tall rod. A one is a little cube.");
      return;
    }
    onChoose(String(value));
  }

  return (
    <div className="ac-build">
      <BaseTen n={value} />
      <div className="ac-steppers">
        <Stepper label="tens" value={tens} onChange={setTens} max={9} />
        <Stepper label="ones" value={ones} onChange={setOnes} max={9} />
      </div>
      <p className="ac-tile-note">{note}</p>
      <button type="button" className="ac-check" onClick={check}>
        Check
      </button>
    </div>
  );
}

function Stepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="ac-stepper">
      <button type="button" aria-label={`Fewer ${label}`} onClick={() => onChange(Math.max(0, value - 1))}>
        −
      </button>
      <span>
        {value} {label}
      </span>
      <button type="button" aria-label={`More ${label}`} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

function ShadeBuilder({
  den,
  answer,
  onChoose,
}: {
  den: number;
  answer: string;
  onChoose: ChoiceProps["onChoose"];
}) {
  const [on, setOn] = useState<boolean[]>(() => Array(den).fill(false));
  const { tries, setTries, note, setNote } = useTries(answer);
  const shaded = on.filter(Boolean).length;

  useEffect(() => {
    setOn(Array(den).fill(false));
  }, [den, answer]);

  function check() {
    const made = `${shaded}/${den}`;
    if (made === answer || (shaded === den && answer === "1") || (shaded === 0 && answer === "0")) {
      onChoose(answer);
      return;
    }
    if (tries === 0) {
      setTries(1);
      setNote("Tap a part to shade it. Tap again to clear it.");
      return;
    }
    onChoose(made);
  }

  return (
    <div className="ac-build">
      <div className="ac-frac">
        {on.map((part, i) => (
          <button
            key={i}
            type="button"
            className={cx("ac-frac-btn", part && "is-on")}
            aria-pressed={part}
            aria-label={part ? "Shaded part" : "Empty part"}
            onClick={() => setOn((rows) => rows.map((cell, n) => (n === i ? !cell : cell)))}
          />
        ))}
      </div>
      <p className="ac-tile-note">{note}</p>
      <button type="button" className="ac-check" onClick={check}>
        Check
      </button>
    </div>
  );
}

function LengthChoices({
  items,
  onChoose,
}: {
  items: MeasureItem[];
  onChoose: ChoiceProps["onChoose"];
}) {
  return (
    <div className="ac-choices">
      {items.map((item) => (
        <button
          key={item.name}
          type="button"
          className="ac-choice is-card"
          aria-label={item.name}
          onClick={() => onChoose(item.name)}
        >
          <i className="ac-len" style={{ width: `${item.value * 18}px` }} aria-hidden="true" />
          <small>
            {item.emoji} {item.name}
          </small>
        </button>
      ))}
    </div>
  );
}

export function SceneChoices({ question, onChoose }: ChoiceProps) {
  if (question.visual.kind !== "scene") return <TextChoices question={question} onChoose={onChoose} />;
  const board = question.visual.board;
  if (board.game === "count" && board.mode === "build") {
    return <TenBuilder answer={question.answer} onChoose={onChoose} />;
  }
  if (board.game === "place" && board.mode === "build") {
    return <BlockBuilder answer={question.answer} onChoose={onChoose} />;
  }
  if (board.game === "fractions" && board.mode === "shade") {
    return <ShadeBuilder den={board.den} answer={question.answer} onChoose={onChoose} />;
  }
  if (board.game === "measure" && board.mode === "compare") {
    return <LengthChoices items={board.items} onChoose={onChoose} />;
  }
  if (question.visual.pictures) return <PictureChoices question={question} onChoose={onChoose} />;
  return <TextChoices question={question} onChoose={onChoose} />;
}

export function ProblemList({ items }: { items: SheetItem[] }) {
  return (
    <ol className="ac-problems">
      {items.map((item, i) => (
        <li key={`${item.prompt}-${i}`}>{item.prompt}</li>
      ))}
    </ol>
  );
}

export function sceneModule(opts: {
  id: string;
  title: string;
  short: string;
  audience: string;
  tint: string;
  mascot: string;
  sheetSlug: string;
  sheetScreen: string;
  blurb: string;
  levels: LevelDef[];
  defaultLevel: (grade: Grade) => string;
  sheetDefaultLevel: string;
  isLevel: (value: unknown) => boolean;
  bars: SkillRow[];
  chips: SkillRow[];
  makeQuestion: GameModule["makeQuestion"];
  makeSheetItem: GameModule["makeSheetItem"];
  Prompt: GameModule["Prompt"];
}): GameModule {
  return {
    id: opts.id,
    title: opts.title,
    audience: opts.audience,
    tint: opts.tint,
    mascot: opts.mascot,
    sheetSlug: opts.sheetSlug,
    sheetScreen: opts.sheetScreen,
    blurb: opts.blurb,
    sheetCount: 10,
    layout: "card",
    levels: opts.levels,
    defaultLevel: opts.defaultLevel,
    sheetDefaultLevel: opts.sheetDefaultLevel,
    isLevel: opts.isLevel,
    pill: (level) => `${opts.short} · Level ${level.num}`,
    makeQuestion: opts.makeQuestion,
    makeSheetItem: opts.makeSheetItem,
    Prompt: opts.Prompt,
    Choices: SceneChoices,
    SheetBody: ProblemList,
    bars: opts.bars,
    chips: opts.chips,
    skillLabel: (key) => labelFor(opts.bars, key) ?? labelFor(opts.chips, key),
    chipLabel: (key) => labelFor(opts.chips, key),
  };
}
