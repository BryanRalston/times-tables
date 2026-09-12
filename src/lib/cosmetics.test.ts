import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { UI } from "./i18n";
import { COMMON_SQUISHEES, RARE_SQUISHEES, SQUISHEE_IDS } from "./squishees";
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

describe("catalog dress-up", () => {
  it("fits the four cheap wearables to every catalog squishee", () => {
    expect(COSMETICS).toHaveLength(4);
    expect(COSMETIC_FACES).toEqual(SQUISHEE_IDS);
    expect(COSMETIC_FACES).toEqual([...COMMON_SQUISHEES, ...RARE_SQUISHEES].map((s) => s.id));
    expect(COSMETICS.every((c) => c.price >= 4 && c.price <= 8)).toBe(true);
    expect(canDressFace("peach", "party-hat")).toBe(true);
    expect(canDressFace("otter", "party-hat")).toBe(true);
    expect(canDressFace("capybara", "scarf")).toBe(true);
    expect(canDressFace("avocado", "bow")).toBe(true);
    expect(canDressFace("crystal-axolotl", "shades")).toBe(true);
    expect(canDressFace("galaxy-narwhal", "party-hat")).toBe(true);
    expect(canDressFace("peach", "nope")).toBe(false);
    expect(canDressFace("not-a-toy", "party-hat")).toBe(false);
  });

  it("ships a fitted composite per catalog face, never a generic overlay sprite", () => {
    const missing: string[] = [];
    for (const face of COSMETIC_FACES) {
      for (const item of COSMETICS) {
        const file = cosmeticCompositeFile(face, item.id);
        expect(file).toBe(`${face}-${item.id}.png`);
        if (!existsSync(join(COSMETIC_DIR, file))) missing.push(file);
      }
    }
    expect(missing).toEqual([]);
    expect(dressedSquisheeSrc("peach", "scarf")).toMatch(/cosmetics\/peach-scarf\.png$/);
    expect(dressedSquisheeSrc("otter", "scarf")).toMatch(/cosmetics\/otter-scarf\.png$/);
    expect(dressedSquisheeSrc("avocado", "party-hat")).toMatch(/cosmetics\/avocado-party-hat\.png$/);
    expect(dressedSquisheeSrc("not-a-toy", "scarf")).toMatch(/squishees\/peach\.png$/);
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
