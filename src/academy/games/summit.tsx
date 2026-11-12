import { summitCard } from "./cards";
import { CubeArt } from "./cubes-art";
import { SUMMIT_STRANDS, makeSummitBossRound, makeSummitQuestion, makeSummitSheetItem } from "./summit-data";
import type { ChoiceQ, GameModule, PromptProps, SheetItem } from "./types";

/** The game a Summit card came from. Its Prompt and tiles draw the card. */
export function summitSource(question: ChoiceQ): GameModule | undefined {
  return SUMMIT_STRANDS.find((row) => row.game.id === question.game)?.game;
}

function SummitPrompt(props: PromptProps) {
  const source = summitSource(props.question);
  if (!source) return null;
  const Prompt = source.Prompt;
  return <Prompt {...props} />;
}

function SummitSheet({ items }: { items: SheetItem[] }) {
  return (
    <ol className="ac-summit-sheet">
      {items.map((item, i) => (
        <li key={`${item.prompt}-${i}`}>
          {item.cubes ? (
            <div className="ac-cubes-art" dir="ltr">
              <CubeArt board={item.cubes} />
            </div>
          ) : null}
          <span dir="auto">{item.prompt}</span> <span className="ac-summit-blank">______</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Grade 5 Summit. Mixed review rounds, and a boss that asks five different
 * grade 5 skills. `mixed` tells the play screen to draw each card with the
 * game it came from.
 */
export const summitGame: GameModule = {
  ...summitCard,
  mixed: true,
  makeQuestion: (rng, level, prefer) => makeSummitQuestion(rng, level, prefer),
  makeBossRound: (rng, grade, prefer) => makeSummitBossRound(rng, grade, prefer),
  makeSheetItem: (rng) => makeSummitSheetItem(rng),
  Prompt: SummitPrompt,
  SheetBody: SummitSheet,
};
