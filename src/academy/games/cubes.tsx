import { useEffect, useState } from "react";
import { t } from "../i18n";
import { cx } from "../ui/bits";
import type { CubeBox } from "./boards";
import { cubesCard } from "./cards";
import { CubeArt, CubeFigure } from "./cubes-art";
import { BUILD_MAX, boxCubes, buildMatches, isCubeLevel, makeCubeQuestion, makeCubeSheet, volumeOf } from "./cubes-data";
import { mathText } from "./grade5";
import { SceneCard, sceneModule } from "./scene-ui";
import { TIMES, type ChoiceProps, type GameModule, type PromptProps, type SheetItem } from "./types";

export function CubesPrompt({ question, reveal, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "cubes") return null;
  const board = question.visual.board;
  const formula =
    board.mode === "formula" ? (board.ask === "base" ? `V = B ${TIMES} h` : `V = l ${TIMES} w ${TIMES} h`) : null;
  return (
    <SceneCard title={question.title} mascot={mascot} happy={happy} hint={question.hint} hands={question.visual.hands} answer={question.answer}>
      {board.mode === "build" ? (
        <p className="ac-cubes-target" dir="ltr">
          V = {board.target}
        </p>
      ) : (
        <div className="ac-cubes-art" dir="ltr">
          <CubeArt board={board} reveal={reveal} />
        </div>
      )}
      {formula ? (
        <p className="ac-cubes-formula" dir="ltr">
          {formula}
        </p>
      ) : null}
    </SceneCard>
  );
}

function Stepper({
  name,
  value,
  max,
  fixed,
  locked,
  onChange,
}: {
  name: string;
  value: number;
  max: number;
  fixed: boolean;
  locked: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div className={cx("ac-cubes-step", fixed && "is-fixed")}>
      <span className="ac-cubes-step-name">{name}</span>
      <div className="ac-cubes-step-row" dir="ltr">
        {fixed ? null : (
          <button
            type="button"
            disabled={locked || value <= 1}
            aria-label={t(`Less ${name}`, `Menos ${name}`, `Menos ${name}`, `Moins ${name}`, `${name}减一`, `${name} एक कम`, `أنقص: ${name}`)}
            onClick={() => onChange(Math.max(1, value - 1))}
          >
            −
          </button>
        )}
        <b>{value}</b>
        {fixed ? null : (
          <button
            type="button"
            disabled={locked || value >= max}
            aria-label={t(`More ${name}`, `Más ${name}`, `Mais ${name}`, `Plus ${name}`, `${name}加一`, `${name} एक ज़्यादा`, `زِد: ${name}`)}
            onClick={() => onChange(Math.min(max, value + 1))}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

/** Tap to stack: set the floor, then add layers. The box must hold the target number of cubes. */
export function CubeBuilder({ question, reveal, onChoose }: ChoiceProps) {
  const board = question.visual.kind === "scene" && question.visual.board.game === "cubes" && question.visual.board.mode === "build" ? question.visual.board : null;
  const start = (): CubeBox => (board?.floorFixed ? { l: board.box.l, w: board.box.w, h: 1 } : { l: 1, w: 1, h: 1 });
  const [box, setBox] = useState<CubeBox>(start);
  const [tries, setTries] = useState(0);
  const [note, setNote] = useState("");
  useEffect(() => {
    setBox(start());
    setTries(0);
    setNote("");
    // A new card starts a new build.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);
  if (!board) return null;

  const set = (key: keyof CubeBox) => (n: number) => {
    setNote("");
    setBox((b) => ({ ...b, [key]: n }));
  };

  function check() {
    if (!board) return;
    if (buildMatches(board, box)) {
      onChoose(question.answer);
      return;
    }
    if (tries === 0) {
      setTries(1);
      setNote(t("Multiply long × wide × tall, then fix your box.", "Multiplica largo × ancho × alto y arregla tu caja."));
      return;
    }
    onChoose(String(volumeOf(box)));
  }

  return (
    <div className={cx("ac-cubes-build", reveal && "is-locked")}>
      <div className="ac-cubes-art is-build" dir="ltr">
        <CubeFigure cubes={boxCubes(box)} floor={box} hue={() => "pink"} dropTop className="is-build" />
      </div>
      <p className="ac-cubes-readout" dir="ltr">
        {mathText(`${box.l} ${TIMES} ${box.w} ${TIMES} ${box.h}`)}
      </p>
      <div className="ac-cubes-steps">
        <Stepper name={t("long", "largo")} value={box.l} max={BUILD_MAX.l} fixed={board.floorFixed} locked={reveal} onChange={set("l")} />
        <Stepper name={t("wide", "ancho")} value={box.w} max={BUILD_MAX.w} fixed={board.floorFixed} locked={reveal} onChange={set("w")} />
        <Stepper name={t("tall", "alto")} value={box.h} max={BUILD_MAX.h} fixed={false} locked={reveal} onChange={set("h")} />
      </div>
      {note ? <p className="ac-tile-note">{note}</p> : null}
      <button type="button" className="ac-check" disabled={reveal} onClick={check}>
        {t("Check", "Revisar")}
      </button>
    </div>
  );
}

export function CubesChoices(props: ChoiceProps) {
  const { question, reveal, onChoose } = props;
  if (question.visual.kind !== "scene" || question.visual.board.game !== "cubes") return null;
  if (question.visual.board.mode === "build") return <CubeBuilder {...props} />;
  return (
    <div className={cx("ac-choices", reveal && "is-locked")} dir="ltr">
      {question.choices.map((option) => (
        <button
          key={option}
          type="button"
          className={cx("ac-choice", reveal && option === question.answer && "is-yes")}
          disabled={reveal}
          onClick={() => onChoose(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function CubesSheet({ items }: { items: SheetItem[] }) {
  return (
    <div className="ac-cubes-sheet">
      {items.map((item, i) => (
        <figure key={`${item.prompt}-${i}`}>
          {item.cubes ? (
            <div className="ac-cubes-art" dir="ltr">
              <CubeArt board={item.cubes} />
            </div>
          ) : null}
          <figcaption dir="auto">
            {item.prompt} ______
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

const base = sceneModule({
  ...cubesCard,
  short: "Cubes",
  makeQuestion: (rng, level, prefer) => makeCubeQuestion(rng, isCubeLevel(level) ? level : "count", prefer),
  makeSheetItem: (rng, level) => makeCubeSheet(rng, level),
  Prompt: CubesPrompt,
});

export const cubesGame: GameModule = { ...base, Choices: CubesChoices, SheetBody: CubesSheet };
