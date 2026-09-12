import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { UI } from "./i18n";
import {
  COSMETIC_FACES,
  COSMETICS,
  applyBuyCosmetic,
  applyEquipCosmetic,
  applyUnequipCosmetic,
  canDressFace,
  cosmeticCompositeFile,
  cosmeticLabel,
  cosmeticOverlaySrc,
  dressedSquisheeSrc,
  parseCosmeticIds,
  parseEquippedCosmetic,
  parseEquippedCosmetics,
  wearList,
  wornCosmetics,
} from "./cosmetics";

const HERE = dirname(fileURLToPath(import.meta.url));
const COSMETIC_DIR = join(HERE, "../../public/cosmetics");
const OVERLAY_DIR = join(HERE, "../../public/art/cosmetics");

describe("v1 dress-up", () => {
  it("is four cheap wearables a 10-coin present can buy", () => {
    expect(COSMETICS).toHaveLength(4);
    expect(COSMETIC_FACES).toEqual(["peach", "frog", "cat", "bunny"]);
    expect(COSMETICS.every((c) => c.price >= 3 && c.price <= 6)).toBe(true);
    expect(canDressFace("peach", "party-hat")).toBe(true);
    expect(canDressFace("otter", "party-hat")).toBe(false);
    expect(canDressFace("peach", "nope")).toBe(false);
  });

  it("ships fitted composites plus generic overlays for every other face", () => {
    for (const face of COSMETIC_FACES) {
      for (const item of COSMETICS) {
        const file = cosmeticCompositeFile(face, item.id);
        expect(file).toBe(`${face}-${item.id}.png`);
        expect(existsSync(join(COSMETIC_DIR, file))).toBe(true);
        expect(existsSync(join(OVERLAY_DIR, item.overlay))).toBe(true);
      }
    }
    expect(dressedSquisheeSrc("peach", "scarf")).toMatch(/cosmetics\/peach-scarf\.png$/);
    expect(dressedSquisheeSrc("otter", "scarf")).toMatch(/squishees\/otter\.png$/);
    expect(cosmeticOverlaySrc("party-hat")).toMatch(/art\/cosmetics\/hat-party\.png$/);
    expect(cosmeticOverlaySrc("shades")).toMatch(/art\/cosmetics\/glasses\.png$/);
  });

  it("buys once, stacks one item per slot, and labels in the kid tongue", () => {
    const buy = applyBuyCosmetic(6, [], "party-hat");
    expect(buy).toEqual({ ok: true, reason: "ok", coins: 0, cosmetics: ["party-hat"] });
    expect(applyBuyCosmetic(20, ["party-hat"], "party-hat").reason).toBe("owned");
    expect(applyBuyCosmetic(2, [], "scarf").reason).toBe("poor");
    expect(parseCosmeticIds(["scarf", "scarf", "nope", "bow"])).toEqual(["scarf", "bow"]);
    expect(parseEquippedCosmetic("bow", ["bow"])).toBe("bow");
    expect(parseEquippedCosmetic("bow", [])).toBe("");
    expect(parseEquippedCosmetics(["party-hat", "scarf", "bow"], ["party-hat", "scarf", "bow"])).toEqual([
      "scarf",
      "bow",
    ]);
    expect(applyEquipCosmetic(["party-hat", "scarf"], ["scarf"], "party-hat")).toEqual(["scarf", "party-hat"]);
    expect(applyUnequipCosmetic(["scarf", "party-hat"], "party-hat")).toEqual(["scarf"]);
    expect(wornCosmetics(["party-hat", "scarf"])).toEqual(["scarf", "party-hat"]);
    expect(wearList({ equippedCosmetic: "party-hat" })).toEqual(["party-hat"]);
    expect(cosmeticLabel("party-hat", UI.en)).toBe("Party hat");
    expect(cosmeticLabel("scarf", UI.es)).toBe("Bufanda");
  });
});
