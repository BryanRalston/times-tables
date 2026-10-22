import { getLocale } from "../i18n";

/** Storybooks are English for now. Spanish and Portuguese hide the shelf. */
export function storiesOffered(): boolean {
  const locale = getLocale();
  return locale !== "es" && locale !== "pt";
}
