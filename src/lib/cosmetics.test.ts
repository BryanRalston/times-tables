import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { UI } from "./i18n";
import {
  COSMETIC_FACES,
  COSMETICS,
  applyBuyCosmetic,
  canDressFace,
  cosmeticCompositeFile,
  cosmeticLabel,
  dressedSquisheeSrc,
  parseCosmeticIds,
  parseEquippedCosmetic,
} from "./cosmetics";

const HERE = dirname(fileURLToPath(import.meta.url));
const COSMETIC_DIR = join(HERE, "../../public/cosmetics");

describe("v1 dress-up", () => {
  it("is four cheap wearables fitted to Peach plus three commons", () => {
    expect(COSMETICS).toHaveLength(4);
    expect(COSMETIC_FACES).toEqual(["peach", "frog", "cat", "bunny"]);
    expect(COSMETICS.every((c) => c.price >= 4 && c.price <= 8)).toBe(true);
    expect(canDressFace("peach", "party-hat")).toBe(true);
    expect(canDressFace("otter", "party-hat")).toBe(false);
    expect(canDressFace("peach", "nope")).toBe(false);
  });

  it("ships a fitted composite per supported face, never a generic overlay sprite", () => {
    for (const face of COSMETIC_FACES) {
      for (const item of COSMETICS) {
        const file = cosmeticCompositeFile(face, item.id);
        expect(file).toBe(`${face}-${item.id}.png`);
        expect(existsSync(join(COSMETIC_DIR, file))).toBe(true);
      }
    }
    expect(dressedSquisheeSrc("peach", "scarf")).toMatch(/cosmetics\/peach-scarf\.png$/);
    expect(dressedSquisheeSrc("otter", "scarf")).toMatch(/squishees\/otter\.png$/);
  });

  it("buys once, equips only owned ids, and labels in the kid tongue", () => {
    const buy = applyBuyCosmetic(6, [], "party-hat");
    expect(buy).toEqual({ ok: true, reason: "ok", coins: 0, cosmetics: ["party-hat"] });
    expect(applyBuyCosmetic(20, ["party-hat"], "party-hat").reason).toBe("owned");
    expect(applyBuyCosmetic(3, [], "scarf").reason).toBe("poor");
    expect(parseCosmeticIds(["scarf", "scarf", "nope", "bow"])).toEqual(["scarf", "bow"]);
    expect(parseEquippedCosmetic("bow", ["bow"])).toBe("bow");
    expect(parseEquippedCosmetic("bow", [])).toBe("");
    expect(cosmeticLabel("party-hat", UI.en)).toBe("Party hat");
    expect(cosmeticLabel("scarf", UI.es)).toBe("Bufanda");
  });
});
