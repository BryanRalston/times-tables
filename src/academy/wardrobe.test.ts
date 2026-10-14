import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { COSMETICS } from "@/lib/cosmetics";
import { GAMES } from "./games/registry";
import { setLocale } from "./i18n";
import { ES } from "./i18n-es";
import { learningLooks } from "./buddy/bond";
import { parseChild } from "./storage";
import { AcademyPal } from "./ui/bits";
import {
  STUDY_REWARDS,
  WARDROBE,
  giftOutfitIds,
  looksCrossingStars,
  outfitHint,
  outfitLabel,
  shopItems,
} from "./wardrobe";

const HERE = dirname(fileURLToPath(import.meta.url));

describe("academy wardrobe", () => {
  it("adds twelve earnable looks without changing the math catalog", () => {
    expect(COSMETICS).toHaveLength(4);
    expect(WARDROBE).toHaveLength(12);
    expect(shopItems()).toHaveLength(16);
    expect(giftOutfitIds()).toHaveLength(16);
    const prices = WARDROBE.map((item) => item.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(Math.min(...prices)).toBeGreaterThan(Math.max(...COSMETICS.map((item) => item.price)));
    for (const item of COSMETICS) {
      const shop = shopItems().find((row) => row.id === item.id);
      expect(shop).toMatchObject({ price: item.price, slot: item.slot });
    }
    expect(Math.max(...STUDY_REWARDS.map((row) => row.study))).toBeLessThanOrEqual(GAMES.length);
    for (const item of WARDROBE) {
      const file = join(HERE, "../../public/wardrobe", `${item.id}.svg`);
      expect(existsSync(file)).toBe(true);
    }
  });

  it("names every look in English and Spanish", () => {
    try {
      for (const item of shopItems()) {
        setLocale("en");
        const en = outfitLabel(item.id);
        expect(en.length).toBeGreaterThan(2);
        expect(ES[en]?.length).toBeGreaterThan(2);
        setLocale("es");
        expect(outfitLabel(item.id)).toBe(ES[en]);
        expect(outfitHint(item.id).length).toBeGreaterThan(4);
      }
      const clip = WARDROBE.find((item) => item.id === "flower-clip");
      setLocale("en");
      expect(outfitHint("flower-clip")).toContain(String(clip?.stars));
      setLocale("es");
      expect(outfitLabel("flower-crown")).toBe("Corona de flores");
      expect(outfitHint("star-glasses")).toContain("cada juego");
    } finally {
      setLocale("en");
    }
  });

  it("keeps the squishee picture and sticks the look on as its own layer", () => {
    const plain = renderToStaticMarkup(createElement(AcademyPal, { id: "peach", cosmetic: "flower-crown" }));
    expect(plain).toContain("squishees/peach.png");
    expect(plain).toContain("wardrobe/flower-crown.svg");
    expect(plain).toContain('data-wear="flower-crown"');
    expect(plain).toContain("ac-squish-stage");
    expect(plain).not.toContain("peach-flower-crown");
    expect(plain).not.toContain("<canvas");
    expect(plain).not.toContain("<video");
    const fitted = renderToStaticMarkup(createElement(AcademyPal, { id: "peach", cosmetic: "party-hat" }));
    expect(fitted).toContain("cosmetics/peach-party-hat.png");
    expect(fitted).not.toContain("data-wear");
  });

  it("remembers an owned academy look and grants it from stars or practice", () => {
    const row = parseChild({
      id: "maya",
      cosmetics: ["flower-crown", "bow", "nope", "flower-crown"],
      equipped: "flower-crown",
    });
    expect(row?.cosmetics).toEqual(["flower-crown", "bow"]);
    expect(row?.equipped).toBe("flower-crown");
    expect(parseChild({ id: "maya", cosmetics: ["bow"], equipped: "star-cap" })?.equipped).toBe("");
    expect(looksCrossingStars(11, 14)).toEqual(["flower-clip"]);
    expect(looksCrossingStars(14, 16)).toEqual([]);
    expect(learningLooks(8, 9, 0, 0)).toContain("bow-tie");
    expect(learningLooks(11, 12, 5, 6)).toEqual(expect.arrayContaining(["flower-crown", "round-glasses"]));
    expect(learningLooks(2, 3, 0, 1)).toEqual(["bow", "scarf"]);
  });
});
