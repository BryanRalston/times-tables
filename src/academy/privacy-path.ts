import type { Locale } from "./i18n";

/** Static privacy page for the language the family is using. English stays at /privacy/. */
export function privacyPathForLocale(lang: Locale): string {
  switch (lang) {
    case "en":
      return "privacy/";
    case "es":
      return "es/privacy/";
    case "pt":
      return "pt-br/privacy/";
    case "fr":
      return "fr/privacy/";
    case "zh":
      return "zh-hans/privacy/";
    case "hi":
      return "hi/privacy/";
    case "ar":
      return "ar/privacy/";
    default: {
      const neverLang: never = lang;
      return neverLang;
    }
  }
}
