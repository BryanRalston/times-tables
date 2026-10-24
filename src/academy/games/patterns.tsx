import { useEffect, useRef, useState } from "react";
import { show } from "../i18n";
import { cx } from "../ui/bits";
import { PatternBench } from "../ui/pattern-board";
import { patternsCard } from "./cards";
import { isPatternLevel, makePatternQuestion, makePatternSheet, patternMatches } from "./patterns-data";
import type { PatternTask } from "./patterns-data";
import { SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceProps, GameModule, PromptProps } from "./types";

function taskOf(board: { mode: PatternTask["mode"]; terms: number[]; step: number; answer: number }): PatternTask {
  return {
    kind: "pattern",
    mode: board.mode,
    terms: board.terms,
    step: board.step,
    answer: board.answer,
    speech: "",
    skill: "",
    factKey: "",
    praise: "",
  };
}

export function PatternPrompt({ question, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "patterns") return null;
  return (
    <SceneCard title={question.title} mascot={mascot} happy={happy} hint={question.hint} hands={question.visual.hands} answer={question.answer}>
      {null}
    </SceneCard>
  );
}

export function PatternChoices({ question, reveal, onChoose }: ChoiceProps) {
  const board = question.visual.kind === "scene" && question.visual.board.game === "patterns" ? question.visual.board : null;
  const [picked, setPicked] = useState<number | null>(null);
  const choiceRef = useRef<HTMLDivElement>(null);
  const task = board ? taskOf(board) : null;
  const ready = task ? patternMatches(task, picked) : false;
  const showChoices = ready || reveal;
  useEffect(() => {
    if (showChoices) choiceRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [showChoices, question.id]);
  if (!board || !task) return null;
  return (
    <div className="ac-pattern-play">
      <PatternBench key={question.id} task={task} locked={reveal} picked={picked} onPick={setPicked} />
      {showChoices ? (
        <div ref={choiceRef} className={cx("ac-choices", reveal && "is-locked")}>
          {question.choices.map((option) => (
            <button key={option} type="button" className={cx("ac-choice", reveal && option === question.answer && "is-yes")} disabled={!ready || reveal} onClick={() => onChoose(option)}>
              {option}
            </button>
          ))}
        </div>
      ) : (
        <p className="ac-tile-note">{show("Put a number on the blank.")}</p>
      )}
    </div>
  );
}

const base = sceneModule({
  ...patternsCard,
  short: "Patterns",
  makeQuestion: (rng, level) => makePatternQuestion(rng, isPatternLevel(level) ? level : "tens"),
  makeSheetItem: (rng, level) => makePatternSheet(rng, level),
  Prompt: PatternPrompt,
});

export const patternsGame: GameModule = { ...base, Choices: PatternChoices };
