import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { UI } from "./i18n";
import {
  COSMETICS,
  applyBuyCosmetic,
  applyEquipCosmetic,
  applyUnequipCosmetic,
  canDressFace,
  cosmeticCompositeFile,
  cosmeticLabel,
  dressedSquisheeSrc,
  parseCosmeticIds,
  parseEquippedCosmetic,
  parseEquippedCosmetics,
  portraitCosmetic,
  wearList,
} from "./cosmetics";
import { SQUISHEE_IDS } from "./squishees";

const HERE = dirname(fileURLToPath(import.meta.url));
const COSMETIC_DIR = join(HERE, "../../public/cosmetics");
const MASTER_DIR = join(HERE, "../../assets/squishee-cosmetics");

describe("Imagine dress-up", () => {
  it("is four cheap wearables a 10-coin present can buy, fitted to every face", () => {
    expect(COSMETICS).toHaveLength(4);
    expect(COSMETICS.every((c) => c.price >= 3 && c.price <= 6)).toBe(true);
    expect(canDressFace("peach", "party-hat")).toBe(true);
    expect(canDressFace("capybara", "party-hat")).toBe(true);
    expect(canDressFace("galaxy-narwhal", "scarf")).toBe(true);
    expect(canDressFace("otter", "party-hat")).toBe(true);
    expect(canDressFace("peach", "nope")).toBe(false);
  });

  it("ships an Imagine composite for every squishee and wearable", () => {
    expect(SQUISHEE_IDS.length).toBeGreaterThan(40);
    for (const face of SQUISHEE_IDS) {
      for (const item of COSMETICS) {
        const file = cosmeticCompositeFile(face, item.id);
        expect(file).toBe(`${face}-${item.id}.png`);
        expect(existsSync(join(COSMETIC_DIR, file))).toBe(true);
        expect(existsSync(join(MASTER_DIR, file))).toBe(true);
      }
    }
    expect(dressedSquisheeSrc("peach", "scarf")).toMatch(/cosmetics\/peach-scarf\.png$/);
    expect(dressedSquisheeSrc("capybara", "party-hat")).toMatch(/cosmetics\/capybara-party-hat\.png$/);
    expect(dressedSquisheeSrc("galaxy-narwhal", "scarf")).toMatch(/cosmetics\/galaxy-narwhal-scarf\.png$/);
    expect(dressedSquisheeSrc("otter", "scarf")).toMatch(/cosmetics\/otter-scarf\.png$/);
  });

  it("buys once, equips one Imagine portrait, and labels in the kid tongue", () => {
    const buy = applyBuyCosmetic(6, [], "party-hat");
    expect(buy).toEqual({ ok: true, reason: "ok", coins: 0, cosmetics: ["party-hat"] });
    expect(applyBuyCosmetic(20, ["party-hat"], "party-hat").reason).toBe("owned");
    expect(applyBuyCosmetic(2, [], "scarf").reason).toBe("poor");
    expect(parseCosmeticIds(["scarf", "scarf", "nope", "bow"])).toEqual(["scarf", "bow"]);
    expect(parseEquippedCosmetic("bow", ["bow"])).toBe("bow");
    expect(parseEquippedCosmetic("bow", [])).toBe("");
    expect(parseEquippedCosmetics(["party-hat", "scarf", "bow"], ["party-hat", "scarf", "bow"])).toEqual(["bow"]);
    expect(applyEquipCosmetic(["party-hat", "scarf"], ["scarf"], "party-hat")).toEqual(["party-hat"]);
    expect(applyUnequipCosmetic(["party-hat"], "party-hat")).toEqual([]);
    expect(portraitCosmetic(["scarf", "party-hat"])).toBe("party-hat");
    expect(wearList({ equippedCosmetic: "party-hat" })).toEqual(["party-hat"]);
    expect(cosmeticLabel("party-hat", UI.en)).toBe("Party hat");
    expect(cosmeticLabel("scarf", UI.es)).toBe("Bufanda");
  });
});
