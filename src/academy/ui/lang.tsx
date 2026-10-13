import { setLocale, show } from "../i18n";
import type { AppLang, Save } from "../model";
import { cx } from "./bits";

export function withLang(save: Save, lang: AppLang): Save {
  setLocale(lang);
  return { ...save, lang, langChosen: true };
}

export function LanguageToggle({ lang, onLang }: { lang: AppLang; onLang: (lang: AppLang) => void }) {
  return (
    <section className="ac-panel">
      <h2>{show("Language")}</h2>
      <div className="ac-grades" role="group" aria-label={show("Language")}>
        <button type="button" className={cx("ac-grade", lang === "en" && "is-on")} aria-pressed={lang === "en"} onClick={() => onLang("en")}>
          English
        </button>
        <button type="button" className={cx("ac-grade", lang === "es" && "is-on")} aria-pressed={lang === "es"} onClick={() => onLang("es")}>
          Español
        </button>
      </div>
    </section>
  );
}
