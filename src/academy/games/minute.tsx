import { t } from "../i18n";
import { AnalogClock, cx } from "../ui/bits";
import { minuteCard } from "./cards";
import { isMinuteLevel, makeMinuteQuestion, makeMinuteSheet } from "./minute-data";
import { SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceProps, GameModule, PromptProps, SheetItem } from "./types";

export function MinutePrompt({ question, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "minute") return null;
  const board = question.visual.board;
  return (
    <SceneCard title={question.title} mascot={mascot} happy={happy} hint={question.hint} hands={question.visual.hands} answer={question.answer}>
      <AnalogClock hours={board.hours} minutes={board.minutes} />
    </SceneCard>
  );
}

export function MinuteChoices({ question, reveal, onChoose }: ChoiceProps) {
  const board = question.visual.kind === "scene" && question.visual.board.game === "minute" ? question.visual.board : null;
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

export function MinuteSheet({ items }: { items: SheetItem[] }) {
  return (
    <div className="ac-clock-grid">
      {items.map((item, i) =>
        item.clock ? (
          <figure key={`${item.answer}-${i}`}>
            <AnalogClock hours={item.clock.hours} minutes={item.clock.minutes} />
            <figcaption>{t("What time is it?", "¿Qué hora es?")} __________</figcaption>
          </figure>
        ) : null,
      )}
    </div>
  );
}

const base = sceneModule({
  ...minuteCard,
  short: "Minutes",
  makeQuestion: (rng, level) => makeMinuteQuestion(rng, isMinuteLevel(level) ? level : "early"),
  makeSheetItem: (rng, level) => makeMinuteSheet(rng, level),
  Prompt: MinutePrompt,
});

export const minuteGame: GameModule = { ...base, Choices: MinuteChoices, SheetBody: MinuteSheet };
