import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getLocale, setLocale } from "../i18n";
import { blankChild, freshSave } from "../storage";
import { HelloScreen } from "./extra";
import { HomeScreen } from "./home";
import { LANGUAGE_NAME_LINE, LanguageWelcome, suggestLang } from "./lang";

function pressed(html: string, lang: string): boolean {
  const match = html.match(new RegExp(`<button[^>]*data-lang="${lang}"[^>]*>`));
  return match?.[0].includes('aria-pressed="true"') ?? false;
}

describe("language choice", () => {
  it("suggests a supported browser language and leaves every other browser on English", () => {
    expect(suggestLang("en-US")).toBe("en");
    expect(suggestLang("es-MX")).toBe("es");
    expect(suggestLang("pt-BR")).toBe("pt");
    expect(suggestLang("fr-CA")).toBe("fr");
    expect(suggestLang("zh-Hans")).toBe("zh");
    expect(suggestLang("hi-IN")).toBe("hi");
    expect(suggestLang("ar-EG")).toBe("ar");
    expect(suggestLang("de-DE")).toBe("en");
    expect(suggestLang("")).toBe("en");
  });

  it("lists each language in its own script and waits for continue", () => {
    setLocale("en");
    const html = renderToStaticMarkup(
      createElement(LanguageWelcome, { save: freshSave(), onSave: () => {}, browserLanguage: "en-US" }),
    );
    expect(html).toContain("Choose your language");
    expect(html).toContain("Continue");
    for (const name of LANGUAGE_NAME_LINE.split(", ")) expect(html).toContain(name);
    expect(pressed(html, "en")).toBe(true);
    expect(pressed(html, "es")).toBe(false);
    expect(pressed(html, "ar")).toBe(false);
    expect(getLocale()).toBe("en");
  });

  it("pre-selects the browser language without switching", () => {
    setLocale("en");
    const html = renderToStaticMarkup(
      createElement(LanguageWelcome, { save: freshSave(), onSave: () => {}, browserLanguage: "ar-SA" }),
    );
    expect(pressed(html, "ar")).toBe(true);
    expect(pressed(html, "en")).toBe(false);
    expect(html).toContain("Choose your language");
    expect(html).toContain('dir="rtl"');
    expect(getLocale()).toBe("en");
  });
});

describe("hello screen", () => {
  it("keeps a language button after the first choice", () => {
    const save = freshSave();
    save.lang = "es";
    save.langChosen = true;
    const html = renderToStaticMarkup(createElement(HelloScreen, { save, onSave: () => {}, sound: false }));
    expect(html).toContain('data-lang-button="es"');
    expect(html).toContain("Español");
    expect(html).not.toContain("data-lang-step");
  });
});

describe("home header", () => {
  it("shows the current language and the seven language names", () => {
    const child = blankChild({ name: "Sam" });
    const html = renderToStaticMarkup(
      createElement(HomeScreen, {
        child,
        lang: "en",
        sound: false,
        onClaim: () => {},
        onLang: () => {},
        onPlay: () => {},
      }),
    );
    expect(html).toContain('data-lang-button="en"');
    expect(html).toContain("English");
    expect(html).toContain("Play in 7 languages");
    expect(html).toContain(LANGUAGE_NAME_LINE);
    expect(html).toContain("<svg");
  });
});
