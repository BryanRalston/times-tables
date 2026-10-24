import { useEffect, useRef, useState } from "react";
import { show } from "../i18n";
import { cx } from "../ui/bits";
import { GridBench } from "../ui/grid-board";
import { gridCard } from "./cards";
import { gridMatches, gridTaskFromBoard, isGridLevel, makeGridQuestion, makeGridSheet } from "./grid-data";
import { SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceProps, GameModule, PromptProps } from "./types";

export function GridPrompt({ question, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "grid") return null;
  return (
    <SceneCard title={question.title} mascot={mascot} happy={happy} hint={question.hint} hands={question.visual.hands} answer={question.answer}>
      {null}
    </SceneCard>
  );
}

export function GridChoices({ question, reveal, onChoose }: ChoiceProps) {
  const board = question.visual.kind === "scene" && question.visual.board.game === "grid" ? question.visual.board : null;
  const [ready, setReady] = useState(false);
  const choiceRef = useRef<HTMLDivElement>(null);
  const showChoices = ready || reveal;
  useEffect(() => {
    if (showChoices) choiceRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [showChoices, question.id]);
  if (!board) return null;
  const live = gridTaskFromBoard(board);
  const note =
    board.mode === "fence" ? show("Walk the fence, then pick an answer.") : board.mode === "side" ? show("Put a number on the blank.") : show("Count the squares, then pick an answer.");
  return (
    <div className="ac-grid-play">
      {board.mode === "side" ? (
        <div className="ac-side-row" aria-hidden="true">
          {Array.from({ length: board.known }, (_, index) => (
            <i key={index} className="ac-plot" />
          ))}
          <b>?</b>
        </div>
      ) : (
        <GridBench key={question.id} task={live} locked={reveal} onChange={(picked) => setReady(gridMatches(live, picked))} />
      )}
      {board.mode === "side" || showChoices ? (
        <div ref={choiceRef} className={cx("ac-choices", reveal && "is-locked")}>
          {question.choices.map((option) => (
            <button key={option} type="button" className={cx("ac-choice", reveal && option === question.answer && "is-yes")} disabled={reveal || (board.mode !== "side" && !ready)} onClick={() => onChoose(option)}>
              {option}
            </button>
          ))}
        </div>
      ) : (
        <p className="ac-tile-note">{note}</p>
      )}
    </div>
  );
}

const base = sceneModule({
  ...gridCard,
  short: "Garden",
  makeQuestion: (rng, level) => makeGridQuestion(rng, isGridLevel(level) ? level : "tiles"),
  makeSheetItem: (rng, level) => makeGridSheet(rng, level),
  Prompt: GridPrompt,
});

export const gridGame: GameModule = { ...base, Choices: GridChoices };
