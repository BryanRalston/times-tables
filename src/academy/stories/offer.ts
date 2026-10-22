import { getLocale } from "../i18n";

/** Storybooks are English for now. Other languages hide the shelf. */
export function storiesOffered(): boolean {
  return getLocale() === "en";
}
