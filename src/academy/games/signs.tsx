import { cx } from "../ui/bits";
import { SignPair } from "../ui/sign-board";
import { signsCard } from "./cards";
import { isSignLevel, makeSignsQuestion, makeSignsSheet } from "./signs-data";
import type { SignsTask } from "./signs-data";
import { SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceProps, GameModule, PromptProps } from "./types";

function taskOf(board: { mode: SignsTask["mode"]; left: number; right: number; mark: SignsTask["mark"] }): SignsTask {
  return {
    kind: "signs",
    mode: board.mode,
    left: board.left,
    right: board.right,
    mark: board.mark,
    speech: "",
    skill: "",
    factKey: "",
    praise: "",
  };
}

export function SignPrompt({ question, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "signs") return null;
  return (
    <SceneCard title={question.title} mascot={mascot} happy={happy} hint={question.hint} hands={question.visual.hands} answer={question.answer}>
      {null}
    </SceneCard>
  );
}

export function SignChoices({ question, reveal, onChoose }: ChoiceProps) {
  const board = question.visual.kind === "scene" && question.visual.board.game === "signs" ? question.visual.board : null;
  if (!board) return null;
  const task = taskOf(board);
  return (
    <div className="ac-sign-play">
      <SignPair task={task} />
      <div className={cx("ac-choices", "is-stack", reveal && "is-locked")} dir="ltr">
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
  ...signsCard,
  short: "Compare",
  makeQuestion: (rng, level, prefer) => makeSignsQuestion(rng, isSignLevel(level) ? level : "to10", prefer),
  makeSheetItem: (rng, level) => makeSignsSheet(rng, level),
  Prompt: SignPrompt,
});

export const signsGame: GameModule = { ...base, Choices: SignChoices };
