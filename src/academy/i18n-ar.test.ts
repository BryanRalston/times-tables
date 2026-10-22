import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { gameOffered } from "./games/offer";
import {
  arabicFraction,
  arabicMinuteWords,
  arabicNumberWords,
  gradeText,
  howManyPhrase,
  installArabic,
  setLocale,
  thingName,
} from "./i18n";
import { ES } from "./i18n-es";
import { AR, BOSS_AR, PERSONA_AR, PERSONA_FALLBACK_AR, TRAIT_AR } from "./i18n-ar";

installArabic({ AR, PERSONA_AR, PERSONA_FALLBACK_AR, BOSS_AR, TRAIT_AR });

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (
      /\.(ts|tsx)$/.test(name) &&
      !name.includes(".test.") &&
      name !== "i18n-pt.ts" &&
      name !== "i18n-es.ts" &&
      name !== "i18n-fr.ts" &&
      name !== "i18n-zh.ts" &&
      name !== "i18n-hi.ts" &&
      name !== "i18n-ar.ts"
    ) {
      out.push(path);
    }
  }
  return out;
}

/** First string argument of t() or show() when it is a plain literal. */
function staticKeys(): string[] {
  const keys = new Set<string>();
  const call = /\b(?:t|show)\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
  for (const file of walk("src/academy")) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(call)) {
      const body = match[2] ?? "";
      if (body.includes("${")) continue;
      keys.add(body.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\'/g, "'"));
    }
  }
  return [...keys];
}

describe("Arabic copy", () => {
  afterEach(() => setLocale("en"));

  it("has every Spanish key and every static English string", () => {
    const missing: string[] = [];
    for (const key of Object.keys(ES)) {
      if (!AR[key]?.trim()) missing.push(key);
    }
    for (const key of staticKeys()) {
      if (!AR[key]?.trim()) missing.push(`static:${key}`);
    }
    expect(missing.slice(0, 20)).toEqual([]);
    expect(missing).toHaveLength(0);
    const blob = JSON.stringify(AR) + JSON.stringify(PERSONA_AR) + JSON.stringify(BOSS_AR);
    expect(blob).not.toMatch(/[¡¿]/);
    expect(PERSONA_FALLBACK_AR.line.length).toBeGreaterThan(2);
    expect(Object.keys(PERSONA_AR)).toHaveLength(42);
    expect(Object.keys(BOSS_AR)).toHaveLength(15);
    expect(Object.keys(TRAIT_AR).length).toBeGreaterThanOrEqual(10);
  });

  it("uses school grades, Arabic number words, and hides alphabet games", () => {
    setLocale("ar");
    expect(howManyPhrase("apples", 2, "apples")).toBe("كم تفاحات");
    expect(howManyPhrase("fish", 2, "fish")).toBe("كم أسماك");
    expect(howManyPhrase("stars", 2, "stars")).toBe("كم نجوم");
    expect(howManyPhrase("bones", 2, "bones")).toBe("كم عظام");
    expect(howManyPhrase("bugs", 2, "bugs")).toBe("كم حشرات");
    expect(howManyPhrase("cookies", 2, "cookies")).toBe("كم بسكويت");
    expect(thingName("apples", 1, "apple")).toBe("تفاحة");
    expect(arabicNumberWords(0)).toBe("صفر");
    expect(arabicNumberWords(2)).toBe("اثنان");
    expect(arabicNumberWords(11)).toBe("أحد عشر");
    expect(arabicNumberWords(21)).toBe("واحد وعشرون");
    expect(arabicNumberWords(101)).toBe("مئة وواحد");
    expect(arabicNumberWords(200)).toBe("مئتان");
    expect(arabicNumberWords(2000)).toBe("ألفان");
    expect(arabicMinuteWords(0)).toBe("تمامًا");
    expect(arabicMinuteWords(15)).toBe("والربع");
    expect(arabicMinuteWords(30)).toBe("والنصف");
    expect(arabicMinuteWords(45)).toBe("إلا ربع");
    expect(arabicFraction(1, 2)).toBe("نصف");
    expect(arabicFraction(1, 4)).toBe("ربع");
    expect(arabicFraction(3, 4)).toBe("ثلاثة أرباع");
    expect(arabicFraction(2, 3)).toBe("ثلثان");
    expect(gradeText("PK")).toBe("روضة");
    expect(gradeText("K")).toBe("تمهيدي");
    expect(gradeText("1")).toBe("الصف 1");
    expect(gradeText("4")).toBe("الصف 4");
    expect(gameOffered("phonics")).toBe(false);
    expect(gameOffered("sight")).toBe(false);
    expect(gameOffered("spelling")).toBe(false);
    expect(gameOffered("count")).toBe(true);
    expect(gameOffered("times")).toBe(true);
  });
});
