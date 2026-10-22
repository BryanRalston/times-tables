import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { frenchFraction, frenchNumberWords, frenchShaded, gradeText, howManyPhrase, installFrench, longShortOf, setLocale, thingName } from "./i18n";
import { ES } from "./i18n-es";
import { BOSS_FR, FR, PERSONA_FALLBACK_FR, PERSONA_FR, TRAIT_FR } from "./i18n-fr";

installFrench({ FR, PERSONA_FR, PERSONA_FALLBACK_FR, BOSS_FR, TRAIT_FR });

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.includes(".test.") && name !== "i18n-pt.ts" && name !== "i18n-es.ts" && name !== "i18n-fr.ts") out.push(path);
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

describe("French copy", () => {
  afterEach(() => setLocale("en"));

  it("has every Spanish key and every static English string", () => {
    const missing: string[] = [];
    for (const key of Object.keys(ES)) {
      if (!FR[key]?.trim()) missing.push(key);
    }
    for (const key of staticKeys()) {
      if (!FR[key]?.trim()) missing.push(`static:${key}`);
    }
    expect(missing.slice(0, 20)).toEqual([]);
    expect(missing).toHaveLength(0);
    const blob = JSON.stringify(FR) + JSON.stringify(PERSONA_FR) + JSON.stringify(BOSS_FR);
    expect(blob).not.toMatch(/[¡¿]/);
    expect(PERSONA_FALLBACK_FR.line.length).toBeGreaterThan(2);
    expect(Object.keys(TRAIT_FR).length).toBeGreaterThanOrEqual(Object.keys({ sweet: 1, hoppy: 1 }).length);
  });

  it("uses combien de, masculine fractions, and French school numbers", () => {
    setLocale("fr");
    expect(howManyPhrase("carrots", 2, "carrots")).toBe("Combien de carottes");
    expect(howManyPhrase("snakes", 3, "snakes")).toBe("Combien de serpents");
    expect(howManyPhrase("fish", 2, "fish")).toBe("Combien de poissons");
    expect(howManyPhrase("bones", 2, "bones")).toBe("Combien d'os");
    expect(howManyPhrase("bugs", 2, "bugs")).toBe("Combien d'insectes");
    expect(howManyPhrase("stars", 2, "stars")).toBe("Combien d'étoiles");
    expect(thingName("apples", 1, "apple")).toBe("pomme");
    expect(longShortOf("snake", true)).toBe("le plus long");
    expect(longShortOf("snake", false)).toBe("le plus court");
    expect(longShortOf("ball", true)).toBe("la plus longue");
    expect(longShortOf("ball", false)).toBe("la plus courte");
    expect(frenchShaded("1/2")).toBe("Un demi est colorié");
    expect(frenchShaded("2/4")).toBe("Deux quarts sont coloriés");
    expect(frenchShaded("1/3")).toBe("Un tiers est colorié");
    expect(frenchFraction(1, 2)).toBe("un demi");
    expect(frenchNumberWords(21)).toBe("vingt et un");
    expect(frenchNumberWords(70)).toBe("soixante-dix");
    expect(frenchNumberWords(71)).toBe("soixante et onze");
    expect(frenchNumberWords(80)).toBe("quatre-vingts");
    expect(frenchNumberWords(81)).toBe("quatre-vingt-un");
    expect(frenchNumberWords(100)).toBe("cent");
    expect(frenchNumberWords(101)).toBe("cent un");
    expect(frenchNumberWords(200)).toBe("deux cents");
    expect(frenchNumberWords(201)).toBe("deux cent un");
    expect(gradeText("PK")).toBe("Maternelle");
    expect(gradeText("K")).toBe("Grande section");
    expect(gradeText("1")).toBe("CP");
    expect(gradeText("4")).toBe("CM1");
  });
});
