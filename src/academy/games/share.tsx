import { useEffect, useRef, useState } from "react";
import { remainderShown, show, t } from "../i18n";
import { cx } from "../ui/bits";
import { ShareBench } from "../ui/share-board";
import { LongDivArt } from "./grade5-ops-art";
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

function remainderWord(r: number): string {
  return t(`remainder ${r}`, `residuo ${r}`, `resto ${r}`, `reste ${r}`, `余${r}`, `शेष ${r}`, `الباقي ${r}`);
}

function remainderLabel(text: string): string {
  const match = /^(\d+) remainder (\d+)$/.exec(text);
  return match ? `${match[1]} ${remainderWord(Number(match[2]))}` : remainderShown(text);
}

/** "27 remainder 16" as a big quotient over a small remainder line, so four tiles fit on a phone. */
function RemainderTile({ text }: { text: string }) {
  const match = /^(\d+) remainder (\d+)$/.exec(text);
  if (!match) return <b>{text}</b>;
  return (
    <>
      <b>{match[1]}</b>
      <small>{remainderWord(Number(match[2]))}</small>
    </>
  );
}

export function SharePrompt({ question, reveal, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "share") return null;
  const board = question.visual.board;
  return (
    <SceneCard title={question.title} mascot={mascot} happy={happy} hint={question.hint} hands={question.visual.hands} answer={question.answer}>
      {board.mode === "longDiv" ? <LongDivArt board={board} reveal={reveal} /> : null}
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
  if (board.mode === "longDiv") {
    // Grade 5: a written division card. There is no cookie bench to deal first.
    return (
      <div className={cx("ac-choices", reveal && "is-locked")}>
        {question.choices.map((option) => (
          <button key={option} type="button" className={cx("ac-choice", "is-remainder", reveal && option === question.answer && "is-yes")} aria-label={remainderLabel(option)} disabled={reveal} onClick={() => onChoose(option)}>
            <RemainderTile text={option} />
          </button>
        ))}
      </div>
    );
  }
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
