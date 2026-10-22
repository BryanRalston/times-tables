import { loadFrench, loadPortuguese, setLocale, show } from "../i18n";
import type { AppLang, Save } from "../model";
import { cx } from "./bits";

export const LANGUAGE_CHOICES: readonly { id: AppLang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
  { id: "pt", label: "Português" },
  { id: "fr", label: "Français" },
];

export function withLang(save: Save, lang: AppLang): Save {
  setLocale(lang);
  return { ...save, lang, langChosen: true };
}

/** Load a lazy language pack, then apply it. English and Spanish are already in the first download. */
export function chooseLanguage(lang: AppLang, apply: (lang: AppLang) => void): void {
  if (lang === "pt") {
    void loadPortuguese().then(() => apply("pt"));
    return;
  }
  if (lang === "fr") {
    void loadFrench().then(() => apply("fr"));
    return;
  }
  apply(lang);
}

export function LanguageList({ lang, onLang }: { lang: AppLang; onLang: (lang: AppLang) => void }) {
  return (
    <div className="ac-lang-list" role="group" aria-label={show("Language")}>
      {LANGUAGE_CHOICES.map((choice) => (
        <button
          key={choice.id}
          type="button"
          className={cx("ac-grade", lang === choice.id && "is-on")}
          aria-pressed={lang === choice.id}
          onClick={() => chooseLanguage(choice.id, onLang)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}

export function LanguageToggle({ lang, onLang }: { lang: AppLang; onLang: (lang: AppLang) => void }) {
  return (
    <section className="ac-panel">
      <h2>{show("Language")}</h2>
      <LanguageList lang={lang} onLang={onLang} />
    </section>
  );
}
