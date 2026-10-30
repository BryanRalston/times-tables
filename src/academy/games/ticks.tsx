import { cx } from "../ui/bits";
import { TickLine } from "../ui/tick-board";
import { ticksCard } from "./cards";
import { isTickLevel, makeTickQuestion, makeTickSheet } from "./ticks-data";
import { SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceProps, GameModule, PromptProps } from "./types";

export function TickPrompt({ question, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "ticks") return null;
  const board = question.visual.board;
  return (
    <SceneCard title={question.title.replace(/^।\s*/, "")} mascot={mascot} happy={happy} hint={question.hint} hands={question.visual.hands} answer={question.answer}>
      <TickLine whole={board.whole} den={board.den} mark={board.num} />
    </SceneCard>
  );
}

export function TickChoices({ question, reveal, onChoose }: ChoiceProps) {
  const board = question.visual.kind === "scene" && question.visual.board.game === "ticks" ? question.visual.board : null;
  if (!board) return null;
  return (
    <div className={cx("ac-choices", reveal && "is-locked")} dir="ltr">
      {question.choices.map((option) => (
        <button key={option} type="button" className={cx("ac-choice", reveal && option === question.answer && "is-yes")} disabled={reveal} onClick={() => onChoose(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}

const base = sceneModule({
  ...ticksCard,
  short: "Line",
  makeQuestion: (rng, level) => makeTickQuestion(rng, isTickLevel(level) ? level : "fourths"),
  makeSheetItem: (rng, level) => makeTickSheet(rng, level),
  Prompt: TickPrompt,
});

export const ticksGame: GameModule = { ...base, Choices: TickChoices };
