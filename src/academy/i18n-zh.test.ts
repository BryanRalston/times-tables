import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { gameOffered } from "./games/offer";
import {
  chineseFraction,
  chineseMinuteWords,
  chineseNumberWords,
  countedNoun,
  gradeText,
  howManyPhrase,
  installChinese,
  setLocale,
  thingName,
} from "./i18n";
import { ES } from "./i18n-es";
import { BOSS_ZH, PERSONA_FALLBACK_ZH, PERSONA_ZH, TRAIT_ZH, ZH } from "./i18n-zh";

installChinese({ ZH, PERSONA_ZH, PERSONA_FALLBACK_ZH, BOSS_ZH, TRAIT_ZH });

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

describe("Chinese copy", () => {
  afterEach(() => setLocale("en"));

  it("has every Spanish key and every static English string", () => {
    const missing: string[] = [];
    for (const key of Object.keys(ES)) {
      if (!ZH[key]?.trim()) missing.push(key);
    }
    for (const key of staticKeys()) {
      if (!ZH[key]?.trim()) missing.push(`static:${key}`);
    }
    expect(missing.slice(0, 20)).toEqual([]);
    expect(missing).toHaveLength(0);
    const blob = JSON.stringify(ZH) + JSON.stringify(PERSONA_ZH) + JSON.stringify(BOSS_ZH);
    expect(blob).not.toMatch(/[¡¿]/);
    expect(PERSONA_FALLBACK_ZH.line.length).toBeGreaterThan(2);
    expect(Object.keys(PERSONA_ZH)).toHaveLength(42);
    expect(Object.keys(BOSS_ZH)).toHaveLength(15);
    expect(Object.keys(TRAIT_ZH).length).toBeGreaterThanOrEqual(10);
  });

  it("uses measure words, school grades, and mainland number words", () => {
    setLocale("zh");
    expect(howManyPhrase("apples", 2, "apples")).toBe("有几个苹果");
    expect(howManyPhrase("fish", 2, "fish")).toBe("有几条鱼");
    expect(howManyPhrase("stars", 2, "stars")).toBe("有几颗星星");
    expect(howManyPhrase("bones", 2, "bones")).toBe("有几根骨头");
    expect(howManyPhrase("bugs", 2, "bugs")).toBe("有几只虫子");
    expect(howManyPhrase("cookies", 2, "cookies")).toBe("有几块饼干");
    expect(thingName("apples", 1, "apple")).toBe("苹果");
    expect(countedNoun("snakes", 3)).toBe("3条蛇");
    expect(chineseNumberWords(2)).toBe("二");
    expect(chineseNumberWords(10)).toBe("十");
    expect(chineseNumberWords(15)).toBe("十五");
    expect(chineseNumberWords(20)).toBe("二十");
    expect(chineseNumberWords(101)).toBe("一百零一");
    expect(chineseNumberWords(200)).toBe("二百");
    expect(chineseNumberWords(2000)).toBe("两千");
    expect(chineseMinuteWords(0)).toBe("点整");
    expect(chineseMinuteWords(15)).toBe("点一刻");
    expect(chineseMinuteWords(30)).toBe("点半");
    expect(chineseMinuteWords(45)).toBe("差一刻");
    expect(chineseFraction(1, 2)).toBe("二分之一");
    expect(chineseFraction(3, 4)).toBe("四分之三");
    expect(gradeText("PK")).toBe("学前班");
    expect(gradeText("K")).toBe("幼儿园");
    expect(gradeText("1")).toBe("一年级");
    expect(gradeText("4")).toBe("四年级");
    expect(gameOffered("phonics")).toBe(false);
    expect(gameOffered("sight")).toBe(false);
    expect(gameOffered("spelling")).toBe(false);
    expect(gameOffered("count")).toBe(true);
    expect(gameOffered("times")).toBe(true);
  });
});
