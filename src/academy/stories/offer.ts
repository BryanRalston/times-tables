import { getLocale } from "../i18n";

/** Storybooks are English for now. Spanish hides the shelf. */
export function storiesOffered(): boolean {
  return getLocale() !== "es";
}
