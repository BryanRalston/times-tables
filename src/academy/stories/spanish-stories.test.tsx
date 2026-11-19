import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { setLocale, show } from "../i18n";
import { storyAutoReadGrade, type Grade } from "../model";
import { sitemapXml, academySeoFiles } from "../seo/html";
import { STORY_SHELF_SLUG, storyShelfPages, TITLE_MAX } from "../seo/landings";
import { StoriesShelf, StoryReader } from "../ui/stories";
import { VOICE_FILES_ES } from "../voice/manifest-es";
import { planSpeech } from "../voice/plan";
import { STORIES, storyById } from "./catalog";
import { STORY_COPY } from "./copy";
import { storiesForGrade } from "./engine";
import { presentStory } from "./localize";
import { lineTokens } from "./read";

const ES = STORY_COPY.es;
const hasEs = (key: string) => Object.prototype.hasOwnProperty.call(VOICE_FILES_ES, key);
/** Short English words that never belong in a Spanish book line. */
const ENGLISH = new Set(["the", "can", "see", "is", "and", "has", "will", "said", "look", "who", "where", "play", "it", "they", "he", "she", "was", "went", "came", "with", "big", "little"]);
const CAST = new Set(STORIES.flatMap((story) => story.cast.map((id) => id.toLowerCase())).concat(["pig", "fox", "owl", "bear", "duck", "bunny", "frog", "panda", "koala", "otter", "hedgehog", "penguin", "chick", "peach"]));

function clipOk(key: string): boolean {
  const file = VOICE_FILES_ES[key];
  if (!file) return false;
  const abs = resolve("academy/public/voice", file);
  return existsSync(abs) && statSync(abs).size > 200 && file.startsWith("es/");
}

afterEach(() => setLocale("en"));

describe("Spanish storybooks", () => {
  it("has every English book in Spanish, with the same pages and questions", () => {
    expect(Object.keys(ES).sort()).toEqual(STORIES.map((story) => story.id).sort());
    for (const story of STORIES) {
      const copy = ES[story.id]!;
      expect(copy.pages.length, story.id).toBe(story.pages.length);
      expect(copy.checks.length, story.id).toBe(story.checks.length);
      expect(copy.title, story.id).not.toBe(story.title);
    }
  });

  it("leaves no English in any Spanish page, question, or choice", () => {
    const leaks: string[] = [];
    for (const story of STORIES) {
      const copy = ES[story.id]!;
      const lines = [copy.title, ...copy.pages, ...copy.checks.flatMap((check) => [check.prompt, ...check.labels])];
      const english = [story.title, ...story.pages.map((page) => page.text), ...story.checks.flatMap((check) => [check.prompt, ...check.choices.map((c) => c.label)])];
      lines.forEach((line, index) => {
        if (line === english[index] && !CAST.has(line.toLowerCase())) leaks.push(`${story.id}: same as English: ${line}`);
        for (const token of lineTokens(line)) if (ENGLISH.has(token.key) && !CAST.has(token.key)) leaks.push(`${story.id}: ${token.key} in ${line}`);
      });
    }
    expect(leaks).toEqual([]);
  });

  it("has a Spanish voice clip for every word on every page, question, and choice", () => {
    const missing: string[] = [];
    for (const story of STORIES) {
      const copy = ES[story.id]!;
      for (const line of [...copy.pages, ...copy.checks.flatMap((check) => [check.prompt, ...check.labels])]) {
        for (const token of lineTokens(line)) if (!clipOk(token.key)) missing.push(`${story.id}: ${token.key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("says the question's Yes! and the miss hint in Spanish, from Spanish clips", () => {
    setLocale("es");
    for (const line of [show("Yes!"), show("Let's look together.")]) {
      expect(line).not.toMatch(/Yes|look together/);
      const plan = planSpeech(line, hasEs);
      expect(plan, line).toBeTruthy();
      for (const piece of plan ?? []) for (const key of piece.key.split(" ")) expect(clipOk(key), `${line}: ${key}`).toBe(true);
    }
  });

  it("shows the reader and the question in Spanish", () => {
    setLocale("es");
    const story = storyById("g3-bear-warm")!;
    const html = renderToStaticMarkup(<StoryReader story={story} grade="3" sound={false} onFinish={() => {}} />);
    expect(html).toContain('lang="es"');
    for (const word of ["Léemelo", "Siguiente", "Atrás", "Cuentos"]) expect(html).toContain(word);
    for (const word of ["Read to me", ">Next<", ">Back<", "Stories"]) expect(html).not.toContain(word);
    expect(html).toContain("Bear y Duck salen en el barco.".split(" ")[0]);
    expect(presentStory(story).checks[0]?.prompt).toBe("¿Quién sale en el barco?");
  });

  it("puts the Spanish titles on the shelf for each grade", () => {
    setLocale("es");
    for (const grade of ["1", "3"] as Grade[]) {
      const html = renderToStaticMarkup(<StoriesShelf grade={grade} skills={{}} />);
      for (const story of storiesForGrade(grade)) {
        expect(html, story.id).toContain(ES[story.id]!.title);
        if (story.title !== ES[story.id]!.title) expect(html, story.id).not.toContain(`>${story.title}<`);
      }
      expect(html).toContain("páginas");
    }
  });

  it("uses natural, kid-friendly wording for lines that read stiffly before", () => {
    const all = Object.values(ES).flatMap((copy) => [copy.title, ...copy.pages]);
    for (const stiff of ["El paseo tibio", "El paseo estuvo muy rico.", "Un día amable", "La luna es una luz ahí.", "Yo predigo que vendrá el sol.", "Bear paseó muy a gusto.", "La va a volar otra vez.", "Koala está contento.", "Duck estaba contento."]) {
      expect(all).not.toContain(stiff);
    }
    // A spoken line after "dijo:" starts with a capital, like a quote.
    for (const line of all) {
      const after = line.split("dijo: ")[1];
      if (after) expect(after.replace(/^[¡¿]/, "")[0], line).toMatch(/[A-ZÁÉÍÓÚÑ]/);
    }
  });

  it("still reads by itself only through grade 2; from grade 3 the child taps to hear", () => {
    expect((["PK", "K", "1", "2", "3", "4", "5"] as Grade[]).filter(storyAutoReadGrade)).toEqual(["PK", "K", "1", "2"]);
    setLocale("es");
    const story = storyById("g1-fox-kite")!;
    expect(renderToStaticMarkup(<StoryReader story={story} grade="2" sound={false} onFinish={() => {}} />)).toContain('data-story-auto="yes"');
    expect(renderToStaticMarkup(<StoryReader story={story} grade="3" sound={false} onFinish={() => {}} />)).toContain('data-story-auto="no"');
  });
});

describe("read-along storybook page for search", () => {
  it("has one page per language, with the Spanish one listing every Spanish title", () => {
    const pages = storyShelfPages();
    expect(pages.map((page) => page.path)).toEqual([STORY_SHELF_SLUG, "es/read-along-stories", "pt-br/read-along-stories", "fr/read-along-stories", "zh-hans/read-along-stories", "hi/read-along-stories", "ar/read-along-stories"]);
    for (const page of pages) {
      expect(page.title.length, page.path).toBeLessThanOrEqual(TITLE_MAX);
      expect(page.description.length, page.path).toBeLessThanOrEqual(160);
      expect(page.books).toHaveLength(STORIES.length);
    }
    const files = academySeoFiles();
    const es = files.find((file) => file.path === "es/read-along-stories/index.html")?.body ?? "";
    expect(es).toContain('<html lang="es">');
    expect(es).toContain("<h1>Cuentos gratis para leer en voz alta</h1>");
    for (const copy of Object.values(ES)) expect(es).toContain(copy.title);
    expect(es).toContain('href="../../#/stories"');
    expect(es).toContain('hreflang="en" href="https://squisheeacademy.com/read-along-stories/"');
    expect(es).toContain('src="/shots/stories.png" width="480" height="720"');
    expect(es).not.toContain("The red hat");
    expect(sitemapXml()).toContain("<loc>https://squisheeacademy.com/es/read-along-stories/</loc>");
  });

  it("has a real 480x720 screenshot and a link from the home page", () => {
    const shot = readFileSync("academy/public/shots/stories.png");
    expect(shot.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect([shot.readUInt32BE(16), shot.readUInt32BE(20)]).toEqual([480, 720]);
    expect(readFileSync("academy/index.html", "utf8")).toContain('<a href="read-along-stories/">Read-along stories</a>');
  });
});
