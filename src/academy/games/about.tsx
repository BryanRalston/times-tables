import { cx } from "../ui/bits";
import { AboutRead } from "../ui/about-board";
import { aboutCard } from "./cards";
import { isAboutLevel, makeAboutQuestion, makeAboutSheet } from "./about-data";
import { SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceProps, GameModule, PromptProps } from "./types";

export function AboutPrompt({ question, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "about") return null;
  const board = question.visual.board;
  return (
    <SceneCard title={question.title.replace(/^।\s*/, "")} mascot={mascot} happy={happy} hint={question.hint} hands={question.visual.hands} answer={question.answer}>
      <p className="ac-lede">{board.story}</p>
    </SceneCard>
  );
}

export function AboutChoices({ question, reveal, onChoose }: ChoiceProps) {
  const board = question.visual.kind === "scene" && question.visual.board.game === "about" ? question.visual.board : null;
  if (!board) return null;
  return (
    <div className="ac-jump-play">
      <AboutRead n={board.n} />
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
  ...aboutCard,
  short: "Round",
  makeQuestion: (rng, level) => makeAboutQuestion(rng, isAboutLevel(level) ? level : "ten"),
  makeSheetItem: (rng, level) => makeAboutSheet(rng, level),
  Prompt: AboutPrompt,
});

export const aboutGame: GameModule = { ...base, Choices: AboutChoices };
