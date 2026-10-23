import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isPrecacheFile } from "../../../scripts/academy-precache.mjs";
import { landingPages, sheetPages } from "./landings";
import { GOATCOUNTER_ENDPOINT, GOATCOUNTER_SRC } from "./counter";
import { academySeoFiles, HOME_DESCRIPTION, HOME_TITLE, sitemapXml, worksheetHtml } from "./html";
import { WORKSHEETS } from "./catalog";

const VERIFY_LINE = "google-site-verification: google2c987beeafe3d9b2.html";
const TRACKING = /gtag\(|googletagmanager|google-analytics|GTM-|fbq\(|analytics\.js/;

let files: Map<string, string> | null = null;

function pageHtml(path: string): string {
  files ??= new Map(academySeoFiles().map((row) => [row.path, row.body]));
  const body = files.get(path);
  if (!body) throw new Error(path);
  return body;
}

describe("search landing pages", () => {
  it("publishes a crawlable page for every example game", () => {
    const pages = landingPages().filter((page) => page.locale.id === "en" && page.kind === "game");
    const bySlug = new Map(pages.map((page) => [page.path, page]));
    const expected: Record<string, string> = {
      "times-tables-game": "Free times tables game for kids (grades 2–4) | Squishee Academy",
      "telling-time-game": "Free telling time game for kids (grades 1–4) | Squishee Academy",
      "money-game": "Free counting money game for kids (Pre-K to grade 4) | Squishee Academy",
      "addition-subtraction-game": "Free addition and subtraction game for kids (kindergarten through grade 4) | Squishee Academy",
      "fractions-game": "Free fractions game for kids (grades 1–4) | Squishee Academy",
      "graphs-game": "Free graphs game for kids (Pre-K to grade 4) | Squishee Academy",
      "sight-words-game": "Free sight words game for kids (kindergarten through grade 4) | Squishee Academy",
      "phonics-game": "Free phonics game for kids (Pre-K to grade 4) | Squishee Academy",
      "shapes-geometry-game": "Free shapes and geometry game for kids (Pre-K to grade 4) | Squishee Academy",
    };
    for (const [slug, title] of Object.entries(expected)) {
      const page = bySlug.get(slug);
      expect(page?.title, slug).toBe(title);
      const html = pageHtml(`${slug}/index.html`);
      expect(html).toContain(`<title>${title}</title>`);
      expect(html).toContain(`<h1>${page?.h1}</h1>`);
      expect(html).toContain(`href="../#/play/${page?.gameId}">Play free</a>`);
      expect(html).toContain(`src="/shots/${page?.gameId}.png" width="480" height="720"`);
      expect(html).toContain("Free, no ads, no accounts, 7 languages.");
      expect(html).toContain("Common Core");
      expect(page?.codes.length).toBeGreaterThan(0);
      expect(html).toContain(page?.codes[0]);
      expect(html).toContain('"@type":["LearningResource","EducationalApplication"]');
      expect(html).toContain('"isAccessibleForFree":true');
      expect(html).toContain('"price":"0"');
      expect(html).toContain(`"typicalAgeRange":"${page?.ageRange}"`);
      expect(html).not.toMatch(TRACKING);
      expect(html).not.toContain("gc.zgo.at");
      expect(html).not.toContain("squisheeacademy.goatcounter.com");
      const scripts = html.match(/<script\b[^>]*>/g) ?? [];
      expect(scripts.every((tag) => tag.includes('type="application/ld+json"'))).toBe(true);
    }
    const times = bySlug.get("times-tables-game");
    expect(times?.ageRange).toBe("7-10");
    expect(times?.gradesLabel).toBe("grades 2–4");
  });

  it("gives every game a skill page and keeps titles unique in each language", () => {
    const pages = landingPages();
    const games = new Set(pages.filter((page) => page.kind === "game").map((page) => page.gameId));
    expect(games.size).toBe(15);
    for (const gameId of games) {
      expect(pages.some((page) => page.kind === "skill" && page.gameId === gameId && page.locale.id === "en")).toBe(true);
    }
    for (const lang of ["en", "es", "pt-BR", "fr", "zh-Hans", "hi", "ar"] as const) {
      const titles = pages.filter((page) => page.locale.id === lang).map((page) => page.title);
      expect(new Set(titles).size, lang).toBe(titles.length);
    }
    const skill = pages.find((page) => page.kind === "skill" && page.gameId === "times" && page.locale.id === "en");
    expect(skill?.path.startsWith("times-tables-game/")).toBe(true);
    const html = pageHtml(`${skill!.path}/index.html`);
    expect(html).toContain("Play free");
    expect(html).toContain('hreflang="x-default"');
    expect(html).toContain('hreflang="pt-BR"');
    expect(html).toContain('hreflang="zh-Hans"');
  });

  it("localizes the times tables page and marks Arabic right to left", () => {
    const arabic = pageHtml("ar/times-tables-game/index.html");
    expect(arabic).toContain('<html lang="ar" dir="rtl">');
    expect(arabic).toContain("جداول الضرب");
    expect(arabic).toContain("العب مجانًا");
    const spanish = pageHtml("es/times-tables-game/index.html");
    expect(spanish).toContain('lang="es"');
    expect(spanish).toContain("tablas de multiplicar");
    expect(spanish).toContain('href="../privacy/">Privacidad</a>');
    const portuguese = pageHtml("pt-br/telling-time-game/index.html");
    expect(portuguese).toContain('hreflang="pt-BR" href="https://squisheeacademy.com/pt-br/telling-time-game/"');
    const sheet = sheetPages().find((page) => page.locale.id === "ar" && page.sheet?.slug === "multiplication-7s");
    expect(sheet?.path).toBe("ar/worksheets/multiplication-7s");
    const sheetHtml = pageHtml("ar/worksheets/multiplication-7s/index.html");
    expect(sheetHtml).toContain('dir="rtl"');
    expect(sheetHtml).toContain("مفتاح الإجابات");
    expect(sheetHtml).toContain('url("../../../fonts/NotoSansArabic-subset.woff2")');
    const chinese = pageHtml("zh-hans/times-tables-game/index.html");
    expect(chinese).toContain('url("../../fonts/NotoSansSC-subset.woff2")');
    expect(chinese).not.toContain("/times-tables/academy/fonts/");
    const hindi = pageHtml("hi/times-tables-game/index.html");
    expect(hindi).toContain('url("../../fonts/NotoSansDevanagari-subset.woff2")');
    const english = pageHtml("times-tables-game/index.html");
    expect(english).not.toContain("NotoSansSC-subset");
  });

  it("lists every landing in the sitemap with hreflang alternates", () => {
    const xml = sitemapXml();
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain("<loc>https://squisheeacademy.com/times-tables-game/</loc>");
    expect(xml).toContain('hreflang="x-default" href="https://squisheeacademy.com/times-tables-game/"');
    expect(xml).toContain("<loc>https://squisheeacademy.com/es/money-game/</loc>");
    expect(xml).toContain("<loc>https://squisheeacademy.com/ar/graphs-game/</loc>");
    const blocks = xml.split("<url>").slice(1);
    expect(blocks.length).toBeGreaterThan(100);
    for (const block of blocks) {
      expect(block).toContain('hreflang="x-default"');
      expect(block).toContain("<loc>https://squisheeacademy.com/");
    }
    const home = readFileSync("academy/index.html", "utf8");
    expect(home).toContain(`<title>${HOME_TITLE}</title>`);
    expect(home).toContain(HOME_DESCRIPTION);
    expect(home).toContain('href="times-tables-game/"');
    expect(home).toContain('href="shapes-geometry-game/"');
    expect(home).toContain('href="privacy/"');
    expect(home).not.toMatch(TRACKING);
  });

  it("keeps the Google Search Console file and landing files out of the first download", () => {
    const file = readFileSync("academy/public/google2c987beeafe3d9b2.html", "utf8");
    expect(file.trim()).toBe(VERIFY_LINE);
    expect(file.split("\n").filter((line) => line.length > 0)).toEqual([VERIFY_LINE]);
    expect(isPrecacheFile("google2c987beeafe3d9b2.html")).toBe(false);
    expect(isPrecacheFile("times-tables-game/index.html")).toBe(false);
    expect(isPrecacheFile("shots/times.png")).toBe(false);
    expect(isPrecacheFile("fr/fractions-game/index.html")).toBe(false);
    expect(isPrecacheFile("worksheets/multiplication-7s/index.html")).toBe(true);
    const sheet = WORKSHEETS.find((row) => row.slug === "multiplication-7s");
    expect(sheet).toBeTruthy();
    expect(worksheetHtml(sheet!)).toContain("Play free");
  });

  it("allows GoatCounter on the domain build only, once per HTML page", () => {
    const plain = academySeoFiles();
    const domain = academySeoFiles({ visitorCounter: true });
    expect(domain.length).toBe(plain.length);
    for (const file of plain) {
      expect(file.body, file.path).not.toContain(GOATCOUNTER_SRC);
      expect(file.body, file.path).not.toContain(GOATCOUNTER_ENDPOINT);
    }
    let pages = 0;
    for (const file of domain) {
      if (!file.path.endsWith(".html")) {
        expect(file.body, file.path).not.toContain(GOATCOUNTER_SRC);
        continue;
      }
      pages += 1;
      expect(file.body.split(GOATCOUNTER_SRC).length - 1, file.path).toBe(1);
      expect(file.body.split(GOATCOUNTER_ENDPOINT).length - 1, file.path).toBe(1);
      expect(file.body, file.path).toContain('nav.doNotTrack === "1"');
      expect(file.body, file.path).toContain("nav.globalPrivacyControl === true");
      expect(file.body, file.path).not.toMatch(TRACKING);
      const tags = file.body.match(/<script\b[^>]*>/g) ?? [];
      expect(tags.every((tag) => tag.includes('type="application/ld+json"') || tag === "<script>"), file.path).toBe(true);
      expect(file.body, file.path).not.toMatch(/<script\b[^>]*\ssrc=["'](?:https?:)?\/\//i);
    }
    expect(pages).toBeGreaterThan(100);
    const arabic = domain.find((file) => file.path === "ar/privacy/index.html")?.body ?? "";
    expect(arabic).toContain('lang="ar" dir="rtl"');
    expect(arabic).toContain("GoatCounter");
    expect(arabic).toContain("Do Not Track");
    expect(arabic).toContain("COPPA");
    expect(arabic).toContain("hello@squisheeacademy.com");
  });
});
