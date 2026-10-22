import { useEffect, useRef, useState } from "react";
import { t } from "../i18n";
import { cx } from "../ui/bits";
import { GraphBench } from "../ui/graph-board";
import { graphsCard } from "./cards";
import { isGraphLevel, makeGraphsQuestion, makeGraphsSheet, specFromBoard, targetCounts } from "./graph-data";
import { SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceProps, GameModule, PromptProps } from "./types";

export function GraphPrompt({ question, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "graphs") return null;
  return (
    <SceneCard
      title={question.title}
      mascot={mascot}
      happy={happy}
      hint={question.hint}
      hands={question.visual.hands}
      answer={question.answer}
    >
      {null}
    </SceneCard>
  );
}

export function GraphChoices({ question, reveal, onChoose }: ChoiceProps) {
  const board = question.visual.kind === "scene" && question.visual.board.game === "graphs" ? question.visual.board : null;
  const spec = board ? specFromBoard(board) : null;
  const target = spec ? targetCounts(spec) : [];
  const [counts, setCounts] = useState<number[]>(() => target.map(() => 0));
  const choiceRef = useRef<HTMLDivElement>(null);
  const ready = counts.length === target.length && target.every((count, index) => count === counts[index]);
  const showChoices = ready || reveal;
  useEffect(() => {
    if (showChoices) choiceRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [showChoices, question.id]);
  if (!board || !spec) return null;
  return (
    <div className="ac-graph-play">
      <GraphBench key={question.id} spec={spec} locked={reveal} onChange={setCounts} />
      {showChoices ? (
        <div ref={choiceRef} className={cx("ac-choices", reveal && "is-locked")}>
          {question.choices.map((option) => (
            <button
              key={option}
              type="button"
              className={cx("ac-choice", reveal && option === question.answer && "is-yes")}
              disabled={!ready || reveal}
              onClick={() => onChoose(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <p className="ac-tile-note">{t("Sort the pictures, then pick an answer.", "Ordena los dibujos y luego elige.")}</p>
      )}
    </div>
  );
}

const base = sceneModule({
  ...graphsCard,
  short: "Data",
  makeQuestion: (rng, level) => makeGraphsQuestion(rng, isGraphLevel(level) ? level : "sort"),
  makeSheetItem: (rng, level) => makeGraphsSheet(rng, level),
  Prompt: GraphPrompt,
});

export const graphsGame: GameModule = { ...base, Choices: GraphChoices };
