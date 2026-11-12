import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { storyLine } from "../buddy/story";
import { GAME_CARDS } from "../games/cards";
import type { SceneVisual } from "../games/types";
import { GRADE_BANDS } from "../grade-map";
import { contentGrades, gameRangeLabel, gradeSpan, GRADES_IN_ORDER, levelHomeGrade, sheetRangeLabel } from "../grade-range";
import { setLocale } from "../i18n";
import type { Grade } from "../model";
import { WORKSHEETS } from "./catalog";
import { ageRange, GAME_COPY, gradePhrase, sheetGradeLabel, sheetIndexTitle } from "./copy";
import { landingPages, sheetPages } from "./landings";

const LOCALES = ["es", "pt", "fr", "zh", "hi", "ar"] as const;

/** The English range phrase the copy uses for a span of grades. */
function englishPhrase(span: readonly Grade[]): RegExp {
  const lo = span[0]!;
  const hi = span[span.length - 1]!;
  if (lo === hi) return new RegExp(`\\bgrade ${hi}\\b`);
  if (lo === "PK") return new RegExp(`Pre-K (?:through|to) grade ${hi}\\b`);
  if (lo === "K") return new RegExp(`kindergarten through grade ${hi}\\b`);
  return new RegExp(`grades ${lo}–${hi}\\b`);
}

/** Every top grade a piece of English copy claims: "through grade 4", "grades 2–5", "for grade 3". */
function claimedTops(text: string): string[] {
  const tops: string[] = [];
  for (const m of text.matchAll(/(?:through|to) grade (\d)|grades \d–(\d)|\bfor grade (\d)/g)) tops.push(m[1] ?? m[2] ?? m[3]!);
  return tops;
}

describe("content grade map", () => {
  it("gives each level the first grade that teaches it, never a review grade", () => {
    expect(levelHomeGrade("count", "neighbor")).toBe("1");
    expect(levelHomeGrade("sight", "fourth")).toBe("4");
    expect(levelHomeGrade("fractions", "addUnlike")).toBe("5");
    expect(contentGrades("sight")).toEqual(["K", "1", "2", "3", "4"]);
    expect(contentGrades("count")).toEqual(["PK", "K", "1", "2"]);
    for (const [id, bands] of Object.entries(GRADE_BANDS)) {
      for (const grade of contentGrades(id)) {
        const band = bands[grade];
        const lower = GRADES_IN_ORDER.slice(0, GRADES_IN_ORDER.indexOf(grade)).flatMap((g) => (bands[g]?.offer === "later" ? [] : bands[g]?.levels ?? []));
        expect(band.offer, `${id} ${grade}`).not.toBe("later");
        expect(band.levels.some((level) => !lower.includes(level)), `${id} ${grade} has a level of its own`).toBe(true);
      }
    }
  });
});

describe("range labels come from the content grade map", () => {
  it("home cards, game blurbs, and landing pages name the content range", () => {
    for (const card of GAME_CARDS) {
      const grades = contentGrades(card.id);
      if (card.id === "summit") {
        expect(card.audience).toBe("Grade 5 boss");
        continue;
      }
      expect(card.audience, card.id).toBe(gameRangeLabel(grades));
      expect(card.blurb, card.id).toMatch(englishPhrase(gradeSpan(grades)));
      const top = gradeSpan(grades).at(-1)!;
      for (const claimed of claimedTops(card.blurb)) expect(claimed, `${card.id} blurb`).toBe(top);
      const copy = GAME_COPY.find((row) => row.id === card.id);
      if (copy) expect(copy.grades, card.id).toEqual(gradeSpan(grades));
    }
  });

  it("game worksheet pages carry the same range in title, meta, and noscript copy", () => {
    for (const card of GAME_CARDS) {
      if (card.id === "summit") continue;
      const span = gradeSpan(contentGrades(card.id));
      const html = readFileSync(`academy/worksheets/${card.sheetSlug}/index.html`, "utf8");
      expect(html, card.sheetSlug).toContain(`(${sheetRangeLabel(span)}) | Squishee Academy</title>`);
      const head = html.replace(/<title>[^<]*<\/title>/, "");
      for (const claimed of claimedTops(head)) expect(claimed, card.sheetSlug).toBe(span.at(-1));
      if (span.length > 1) expect(head, card.sheetSlug).toMatch(englishPhrase(span));
    }
  });

  it("each ready-made sheet's range comes from the levels its items practice", () => {
    for (const sheet of WORKSHEETS) {
      expect(sheet.levels.length, sheet.slug).toBeGreaterThan(0);
      for (const level of sheet.levels) expect(levelHomeGrade(sheet.game, level), `${sheet.slug} ${level}`).toBeDefined();
      const span = gradeSpan(contentGrades(sheet.game, sheet.levels));
      expect(sheet.title, sheet.slug).toContain(`(${sheetRangeLabel(span)})`);
      for (const claimed of claimedTops(sheet.description)) expect(claimed, sheet.slug).toBe(span.at(-1));
      for (const lang of ["es", "pt-BR", "fr", "zh-Hans", "hi", "ar"] as const) {
        expect(sheetGradeLabel(sheet.title, lang).length, `${sheet.slug} ${lang}`).toBeGreaterThan(0);
      }
    }
    for (const page of sheetPages()) {
      const sheet = page.sheet!;
      const span = gradeSpan(contentGrades(sheet.game, sheet.levels));
      expect(page.ageRange, sheet.slug).toBe(ageRange(span));
      expect(page.gradesLabel, `${sheet.slug} ${page.locale.id}`).toBe(sheetGradeLabel(sheet.title, page.locale.id));
    }
  });

  it("game landing pages in every language use the game's content range", () => {
    for (const page of landingPages().filter((row) => row.kind === "game")) {
      const span = gradeSpan(contentGrades(page.gameId));
      expect(page.gradesLabel, `${page.path}`).toBe(gradePhrase(page.locale.id, span));
      expect(page.ageRange, page.path).toBe(ageRange(span));
    }
  });

  it("keeps the worksheet index at grade 5 because grade 5 worksheets are on it", () => {
    expect(GAME_CARDS.some((card) => card.id !== "summit" && contentGrades(card.id).includes("5"))).toBe(true);
    expect(sheetIndexTitle("en")).toContain("Pre-K to Grade 5");
  });

  it("translates every range label and blurb in all six languages", () => {
    const packs = LOCALES.map((lang) => readFileSync(`src/academy/i18n-${lang}.ts`, "utf8"));
    for (const card of GAME_CARDS) {
      for (const [i, pack] of packs.entries()) {
        expect(pack.includes(`"${card.audience}":`), `${LOCALES[i]} ${card.audience}`).toBe(true);
        expect(pack.includes(`"${card.blurb}":`), `${LOCALES[i]} ${card.id} blurb`).toBe(true);
      }
    }
  });
});

describe("fractions story line by grade", () => {
  afterEach(() => setLocale("en"));
  const visual = (mode: string): SceneVisual =>
    ({
      kind: "scene",
      picture: "",
      hands: false,
      quietChoices: false,
      labels: {},
      board: { game: "fractions", mode, num: 3, den: 4, num2: 1, den2: 2, op: "-", common: 4 },
    }) as unknown as SceneVisual;

  it("gives grade 5 an unlike fractions and decimals line and keeps the shape line below", () => {
    const five = storyLine(visual("addUnlike"), "peach", "cookie", "5");
    expect(five).toContain("unlike fractions and decimals");
    expect(five.split(" ").length).toBeLessThanOrEqual(14);
    for (const grade of ["1", "2", "3", "4"] as const) {
      expect(storyLine(visual("addLike"), "peach", "cookie", grade), grade).toContain("share a shape");
    }
    expect(storyLine(visual("addLike"), "peach", "cookie")).toContain("share a shape");
  });

  it("translates the grade 5 line", () => {
    const english = storyLine(visual("addUnlike"), "peach", "cookie", "5");
    for (const lang of LOCALES) {
      setLocale(lang);
      const line = storyLine(visual("addUnlike"), "peach", "cookie", "5");
      expect(line, lang).not.toBe(english);
      expect(line, lang).not.toBe(storyLine(visual("addUnlike"), "peach", "cookie", "3"));
    }
  });
});
