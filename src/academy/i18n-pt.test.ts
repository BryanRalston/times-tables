import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { gradeText, howManyPhrase, installPortuguese, longShortOf, portugueseFraction, portugueseNumberWords, portugueseShaded, setLocale, thingName } from "./i18n";
import { ES } from "./i18n-es";
import { PT, PERSONA_PT, BOSS_PT, TRAIT_PT, PERSONA_FALLBACK_PT } from "./i18n-pt";

installPortuguese({ PT, PERSONA_PT, PERSONA_FALLBACK_PT, BOSS_PT, TRAIT_PT });

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.includes(".test.") && name !== "i18n-pt.ts" && name !== "i18n-es.ts") out.push(path);
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

describe("Portuguese copy", () => {
  afterEach(() => setLocale("en"));

  it("has every Spanish key and every static English string", () => {
    const missing: string[] = [];
    for (const key of Object.keys(ES)) {
      if (!PT[key]?.trim()) missing.push(key);
    }
    for (const key of staticKeys()) {
      if (!PT[key]?.trim()) missing.push(`static:${key}`);
    }
    expect(missing.slice(0, 20)).toEqual([]);
    expect(missing).toHaveLength(0);
    const blob = JSON.stringify(PT) + JSON.stringify(PERSONA_PT) + JSON.stringify(BOSS_PT);
    expect(blob).not.toMatch(/[¡¿]/);
    expect(PERSONA_FALLBACK_PT.line.length).toBeGreaterThan(2);
    expect(Object.keys(TRAIT_PT).length).toBeGreaterThanOrEqual(Object.keys({ sweet: 1, hoppy: 1 }).length);
  });

  it("agrees quantos and quantas, and paints fractions in the masculine", () => {
    setLocale("pt");
    expect(howManyPhrase("carrots", 2, "carrots")).toBe("Quantas cenouras");
    expect(howManyPhrase("snakes", 3, "snakes")).toBe("Quantas cobras");
    expect(howManyPhrase("fish", 2, "fish")).toBe("Quantos peixes");
    expect(howManyPhrase("cookies", 4, "cookies")).toBe("Quantos biscoitos");
    expect(thingName("apples", 1, "apple")).toBe("maçã");
    expect(longShortOf("snake", true)).toBe("mais comprida");
    expect(longShortOf("snake", false)).toBe("mais curta");
    expect(longShortOf("fish", true)).toBe("mais comprido");
    expect(portugueseShaded("1/2")).toBe("Um meio está pintado");
    expect(portugueseShaded("2/4")).toBe("Dois quartos estão pintados");
    expect(portugueseShaded("1/3")).toBe("Um terço está pintado");
    expect(portugueseFraction(1, 2)).toBe("um meio");
    expect(portugueseNumberWords(21)).toBe("vinte e um");
    expect(portugueseNumberWords(100)).toBe("cem");
    expect(portugueseNumberWords(101)).toBe("cento e um");
    expect(portugueseNumberWords(200)).toBe("duzentos");
    expect(gradeText("PK")).toBe("Pré-escola");
    expect(gradeText("K")).toBe("Jardim");
    expect(gradeText("1")).toBe("1.º ano");
  });
});
