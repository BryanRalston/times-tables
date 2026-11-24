import { BalanceEquation, BalanceScale } from "./balance-art";
import { isBalanceLevel, makeBalanceQuestion, makeBalanceSheet } from "./balance-data";
import { balanceCard } from "./cards";
import { SceneCard, sceneModule } from "./scene-ui";
import type { GameModule, PromptProps } from "./types";

export function BalancePrompt({ question, reveal, mascot, happy }: PromptProps) {
  if (question.visual.kind !== "scene" || question.visual.board.game !== "balance") return null;
  const tilt = !reveal ? "ask" : happy ? "level" : "left";
  const board = question.visual.board;
  return (
    <SceneCard title={question.title} mascot={mascot} happy={happy} hint={question.hint} hands={question.visual.hands} answer={question.answer}>
      <BalanceEquation board={board} />
      <div className="ac-scale-wrap">
        <BalanceScale board={board} tilt={tilt} />
      </div>
    </SceneCard>
  );
}

export const balanceGame: GameModule = sceneModule({
  ...balanceCard,
  short: "Balance",
  makeQuestion: (rng, level, prefer) => makeBalanceQuestion(rng, isBalanceLevel(level) ? level : "addsub", prefer),
  makeSheetItem: (rng, level) => makeBalanceSheet(rng, level),
  Prompt: BalancePrompt,
});
