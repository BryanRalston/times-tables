import { useEffect, useRef, useState } from "react";
import { show } from "../i18n";
import { cx } from "../ui/bits";
import { ShareBench } from "../ui/share-board";
import { shareCard } from "./cards";
import { isShareLevel, makeShareQuestion, makeShareSheet, shareSettled } from "./share-data";
import type { ShareTask } from "./share-data";
import { SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceProps, GameModule, PromptProps } from "./types";

function taskOf(board: { mode: ShareTask["mode"]; total: number; plates: number; each: number; leftover: number }): ShareTask {
  return {
    kind: "share",
    mode: board.mode,
    total: board.total,
    plates: board.plates,
    each: board.each,
    leftover: board.leftover,
    speech: "",
    skill: "",
    factKey: "",
    praise: "",
  };
}

export function SharePrompt({ question, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "share") return null;
  return (
    <SceneCard title={question.title} mascot={mascot} happy={happy} hint={question.hint} hands={question.visual.hands} answer={question.answer}>
      {null}
    </SceneCard>
  );
}

export function ShareChoices({ question, reveal, onChoose }: ChoiceProps) {
  const board = question.visual.kind === "scene" && question.visual.board.game === "share" ? question.visual.board : null;
  const [ready, setReady] = useState(false);
  const choiceRef = useRef<HTMLDivElement>(null);
  const showChoices = ready || reveal;
  useEffect(() => {
    if (showChoices) choiceRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [showChoices, question.id]);
  if (!board) return null;
  const task = taskOf(board);
  return (
    <div className="ac-share-play">
      <ShareBench
        key={question.id}
        task={task}
        locked={reveal}
        onChange={(counts, bank) => setReady(shareSettled(task, counts, bank))}
      />
      {showChoices ? (
        <div ref={choiceRef} className={cx("ac-choices", reveal && "is-locked")}>
          {question.choices.map((option) => (
            <button key={option} type="button" className={cx("ac-choice", reveal && option === question.answer && "is-yes")} disabled={!ready || reveal} onClick={() => onChoose(option)}>
              {option}
            </button>
          ))}
        </div>
      ) : (
        <p className="ac-tile-note">{show("Deal the cookies, then pick an answer.")}</p>
      )}
    </div>
  );
}

const base = sceneModule({
  ...shareCard,
  short: "Shares",
  makeQuestion: (rng, level) => makeShareQuestion(rng, isShareLevel(level) ? level : "pairs"),
  makeSheetItem: (rng, level) => makeShareSheet(rng, level),
  Prompt: SharePrompt,
});

export const shareGame: GameModule = { ...base, Choices: ShareChoices };
