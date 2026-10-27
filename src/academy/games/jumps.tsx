import { cx } from "../ui/bits";
import { JumpRead } from "../ui/jump-board";
import { jumpsCard } from "./cards";
import { isJumpLevel, makeJumpQuestion, makeJumpSheet } from "./jumps-data";
import { SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceProps, GameModule, PromptProps } from "./types";

export function JumpPrompt({ question, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "jumps") return null;
  return (
    <SceneCard title={question.title} mascot={mascot} happy={happy} hint={question.hint} hands={question.visual.hands} answer={question.answer}>
      {null}
    </SceneCard>
  );
}

export function JumpChoices({ question, reveal, onChoose }: ChoiceProps) {
  const board = question.visual.kind === "scene" && question.visual.board.game === "jumps" ? question.visual.board : null;
  if (!board) return null;
  return (
    <div className="ac-jump-play">
      <JumpRead n={board.start} />
      <div className={cx("ac-choices", reveal && "is-locked")} dir="ltr">
        {question.choices.map((option) => (
          <button key={option} type="button" className={cx("ac-choice", reveal && option === question.answer && "is-yes")} disabled={reveal} onClick={() => onChoose(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

const base = sceneModule({
  ...jumpsCard,
  short: "10 more",
  makeQuestion: (rng, level, prefer) => makeJumpQuestion(rng, isJumpLevel(level) ? level : "ten", prefer),
  makeSheetItem: (rng, level) => makeJumpSheet(rng, level),
  Prompt: JumpPrompt,
});

export const jumpsGame: GameModule = { ...base, Choices: JumpChoices };
