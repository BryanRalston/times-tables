import { STORIES } from "./catalog";
import { storySpeechLines } from "./localize";

/** Every read-along line in the language that is on screen. */
export function storySpokenLines(): string[] {
  return STORIES.flatMap((story) => storySpeechLines(story));
}
