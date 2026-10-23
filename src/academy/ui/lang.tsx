import { useEffect, useState } from "react";
import { loadArabic, loadChinese, loadFrench, loadHindi, loadPortuguese, setLocale, show } from "../i18n";
import type { AppLang, Save } from "../model";
import { Logo, cx } from "./bits";

export const LANGUAGE_CHOICES: readonly { id: AppLang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
  { id: "pt", label: "Português" },
  { id: "fr", label: "Français" },
  { id: "zh", label: "中文" },
  { id: "hi", label: "हिन्दी" },
  { id: "ar", label: "العربية" },
];

/** Names stay in their own scripts on every screen. */
export const LANGUAGE_NAME_LINE = LANGUAGE_CHOICES.map((choice) => choice.label).join(", ");

function languageLabel(lang: AppLang): string {
  return LANGUAGE_CHOICES.find((choice) => choice.id === lang)?.label ?? "English";
}

function htmlLang(lang: AppLang): string {
  switch (lang) {
    case "en":
      return "en";
    case "es":
      return "es";
    case "pt":
      return "pt-BR";
    case "fr":
      return "fr";
    case "zh":
      return "zh-Hans";
    case "hi":
      return "hi";
    case "ar":
      return "ar";
    default: {
      const neverLang: never = lang;
      return neverLang;
    }
  }
}

/**
 * Highlight a supported browser language. Does not change the saved language.
 * The family confirms with Continue.
 */
export function suggestLang(language?: string): AppLang {
  const raw = (language ?? readNavigatorLanguage()).toLowerCase();
  const code = raw.split("-")[0];
  switch (code) {
    case "en":
    case "es":
    case "pt":
    case "fr":
    case "zh":
    case "hi":
    case "ar":
      return code;
    default:
      return "en";
  }
}

function readNavigatorLanguage(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.language || "";
}

export function withLang(save: Save, lang: AppLang): Save {
  setLocale(lang);
  return { ...save, lang, langChosen: true };
}

/** Load a lazy language pack, then apply it. English and Spanish are already in the first download. */
export function chooseLanguage(lang: AppLang, apply: (lang: AppLang) => void): void {
  switch (lang) {
    case "pt":
      void loadPortuguese().then(() => apply("pt"));
      return;
    case "fr":
      void loadFrench().then(() => apply("fr"));
      return;
    case "zh":
      void loadChinese().then(() => apply("zh"));
      return;
    case "hi":
      void loadHindi().then(() => apply("hi"));
      return;
    case "ar":
      void loadArabic().then(() => apply("ar"));
      return;
    case "en":
    case "es":
      apply(lang);
      return;
    default: {
      const neverLang: never = lang;
      apply(neverLang);
    }
  }
}

export function PlayLanguages() {
  return (
    <p className="ac-lang-line">
      <span>{show("Play in 7 languages")}</span>
      <span className="ac-lang-names"> {LANGUAGE_NAME_LINE}</span>
    </p>
  );
}

export function LanguageList({
  lang,
  onLang,
  commit = true,
}: {
  lang: AppLang;
  onLang: (lang: AppLang) => void;
  /** When false, the tap only highlights a choice. Continue applies it. */
  commit?: boolean;
}) {
  return (
    <div className="ac-lang-list" role="group" aria-label={show("Language")}>
      {LANGUAGE_CHOICES.map((choice) => (
        <button
          key={choice.id}
          type="button"
          lang={htmlLang(choice.id)}
          dir={choice.id === "ar" ? "rtl" : undefined}
          data-lang={choice.id}
          className={cx("ac-grade", lang === choice.id && "is-on")}
          aria-pressed={lang === choice.id}
          onClick={() => {
            if (!commit) {
              onLang(choice.id);
              return;
            }
            chooseLanguage(choice.id, onLang);
          }}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.7 3.9 5.8 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.8-3.9-9s1.3-6.3 3.9-9z" />
    </svg>
  );
}

/** Globe plus the current language name. Opens the full list. The choice is saved by the parent. */
export function LanguageButton({ lang, onLang }: { lang: AppLang; onLang: (lang: AppLang) => void }) {
  const [open, setOpen] = useState(false);
  const label = languageLabel(lang);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <span className="ac-lang-slot">
      <button
        type="button"
        className="ac-lang-button"
        data-lang-button={lang}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${show("Language")}: ${label}`}
        onClick={() => setOpen(true)}
      >
        <GlobeIcon />
        <span lang={htmlLang(lang)} dir={lang === "ar" ? "rtl" : undefined}>
          {label}
        </span>
      </button>
      {open ? (
        <div
          className="ac-modal"
          role="dialog"
          aria-modal="true"
          aria-label={show("Language")}
          onClick={() => setOpen(false)}
        >
          <div className="ac-modal-card ac-lang-dialog" onClick={(event) => event.stopPropagation()}>
            <h2>{show("Language")}</h2>
            <LanguageList
              lang={lang}
              onLang={(next) => {
                onLang(next);
                setOpen(false);
              }}
            />
            <button type="button" className="ac-quiet" onClick={() => setOpen(false)}>
              {show("Close")}
            </button>
          </div>
        </div>
      ) : null}
    </span>
  );
}

/** First visit, before a profile exists. English is selected until the browser language matches. */
export function LanguageWelcome({
  save,
  onSave,
  browserLanguage,
}: {
  save: Save;
  onSave: (save: Save) => void;
  browserLanguage?: string;
}) {
  const [pick, setPick] = useState<AppLang>(() => suggestLang(browserLanguage));
  const [busy, setBusy] = useState(false);

  return (
    <div className="ac-shell" data-lang-step="welcome">
      <header className="ac-top">
        <Logo />
      </header>
      <section className="ac-hero ac-lang-welcome">
        <h1>{show("Choose your language")}</h1>
        <LanguageList lang={pick} onLang={setPick} commit={false} />
        <button
          type="button"
          className="ac-go"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            chooseLanguage(pick, (lang) => onSave(withLang(save, lang)));
          }}
        >
          {show("Continue")}
        </button>
      </section>
    </div>
  );
}
