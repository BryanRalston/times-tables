import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { gameOffered } from "./games/offer";
import {
  gradeText,
  hindiFraction,
  hindiMinuteWords,
  hindiNumberWords,
  howManyPhrase,
  installHindi,
  setLocale,
  thingName,
} from "./i18n";
import { ES } from "./i18n-es";
import { BOSS_HI, PERSONA_FALLBACK_HI, PERSONA_HI, TRAIT_HI, HI } from "./i18n-hi";

installHindi({ HI, PERSONA_HI, PERSONA_FALLBACK_HI, BOSS_HI, TRAIT_HI });

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

describe("Hindi copy", () => {
  afterEach(() => setLocale("en"));

  it("has every Spanish key and every static English string", () => {
    const missing: string[] = [];
    for (const key of Object.keys(ES)) {
      if (!HI[key]?.trim()) missing.push(key);
    }
    for (const key of staticKeys()) {
      if (!HI[key]?.trim()) missing.push(`static:${key}`);
    }
    expect(missing.slice(0, 20)).toEqual([]);
    expect(missing).toHaveLength(0);
    const blob = JSON.stringify(HI) + JSON.stringify(PERSONA_HI) + JSON.stringify(BOSS_HI);
    expect(blob).not.toMatch(/[¡¿]/);
    expect(PERSONA_FALLBACK_HI.line.length).toBeGreaterThan(2);
    expect(Object.keys(PERSONA_HI)).toHaveLength(42);
    expect(Object.keys(BOSS_HI)).toHaveLength(20);
    expect(Object.keys(TRAIT_HI).length).toBeGreaterThanOrEqual(10);
  });

  it("uses gender, school grades, and Hindi number words", () => {
    setLocale("hi");
    expect(howManyPhrase("apples", 2, "apples")).toBe("कितने सेब");
    expect(howManyPhrase("fish", 2, "fish")).toBe("कितनी मछलियाँ");
    expect(howManyPhrase("stars", 2, "stars")).toBe("कितने तारे");
    expect(howManyPhrase("bones", 2, "bones")).toBe("कितनी हड्डियाँ");
    expect(howManyPhrase("bugs", 2, "bugs")).toBe("कितने कीड़े");
    expect(howManyPhrase("cookies", 2, "cookies")).toBe("कितने बिस्कुट");
    expect(thingName("apples", 1, "apple")).toBe("सेब");
    expect(hindiNumberWords(2)).toBe("दो");
    expect(hindiNumberWords(15)).toBe("पंद्रह");
    expect(hindiNumberWords(21)).toBe("इक्कीस");
    expect(hindiNumberWords(101)).toBe("एक सौ एक");
    expect(hindiNumberWords(200)).toBe("दो सौ");
    expect(hindiNumberWords(2000)).toBe("दो हज़ार");
    expect(hindiNumberWords(100000)).toBe("एक लाख");
    expect(hindiMinuteWords(0)).toBe("बजे");
    expect(hindiMinuteWords(15)).toBe("सवा");
    expect(hindiMinuteWords(30)).toBe("साढ़े");
    expect(hindiMinuteWords(45)).toBe("पौने");
    expect(hindiFraction(1, 2)).toBe("आधा");
    expect(hindiFraction(1, 4)).toBe("एक चौथाई");
    expect(hindiFraction(2, 3)).toBe("दो बटा तीन");
    expect(gradeText("PK")).toBe("नर्सरी");
    expect(gradeText("K")).toBe("केजी");
    expect(gradeText("1")).toBe("कक्षा 1");
    expect(gradeText("4")).toBe("कक्षा 4");
    expect(gameOffered("phonics")).toBe(false);
    expect(gameOffered("sight")).toBe(false);
    expect(gameOffered("spelling")).toBe(false);
    expect(gameOffered("count")).toBe(true);
    expect(gameOffered("times")).toBe(true);
  });
});
