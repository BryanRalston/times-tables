import { keystoneCard } from "./cards";
import { KEYSTONE_STRANDS, makeKeystoneBossRound, makeKeystoneQuestion, makeKeystoneSheetItem } from "./keystone-data";
import type { ChoiceQ, GameModule, PromptProps, SheetItem } from "./types";

/** The game a Keystone card came from. Its Prompt and tiles draw the card. */
export function keystoneSource(question: ChoiceQ): GameModule | undefined {
  const level = question.skill.split(":")[1] ?? "";
  return (
    KEYSTONE_STRANDS.find((row) => row.game.id === question.game && row.levels.includes(level))?.game ??
    KEYSTONE_STRANDS.find((row) => row.game.id === question.game)?.game
  );
}

function KeystonePrompt(props: PromptProps) {
  const source = keystoneSource(props.question);
  if (!source) return null;
  const Prompt = source.Prompt;
  return <Prompt {...props} />;
}

function KeystoneSheet({ items }: { items: SheetItem[] }) {
  return (
    <ol className="ac-summit-sheet">
      {items.map((item, i) => (
        <li key={`${item.prompt}-${i}`}>
          <span dir="auto">{item.prompt}</span> <span className="ac-summit-blank">______</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Grade 6 Keystone. Mixed review rounds, and a boss that asks five different
 * grade 6 skills. `mixed` tells the play screen to draw each card with the
 * game it came from.
 */
export const keystoneGame: GameModule = {
  ...keystoneCard,
  mixed: true,
  makeQuestion: (rng, level, prefer) => makeKeystoneQuestion(rng, level, prefer),
  makeBossRound: (rng, grade, prefer) => makeKeystoneBossRound(rng, grade, prefer),
  makeSheetItem: (rng) => makeKeystoneSheetItem(rng),
  Prompt: KeystonePrompt,
  SheetBody: KeystoneSheet,
};
