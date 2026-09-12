import { describe, expect, it } from "vitest";
import { PRESENT_COIN_AMOUNT } from "./presents";
import {
  applyBuyCosmetic,
  applyEquipCosmetic,
  COSMETICS,
  cosmeticById,
  parseEquippedCosmetics,
  parseOwnedCosmetics,
} from "./cosmetics";

describe("cosmetics", () => {
  it("prices cheap extras at 3–5 coins so a 10-coin present buys two or three", () => {
    expect(COSMETICS.length).toBeGreaterThanOrEqual(4);
    for (const c of COSMETICS) {
      expect(c.price).toBeGreaterThanOrEqual(3);
      expect(c.price).toBeLessThanOrEqual(5);
      expect(cosmeticById(c.id)?.file).toMatch(/\.png$/);
    }
    const cheapest = Math.min(...COSMETICS.map((c) => c.price));
    expect(PRESENT_COIN_AMOUNT).toBeGreaterThanOrEqual(cheapest * 2);
    expect(applyBuyCosmetic(10, [], "bow")).toEqual({ ok: true, reason: "ok", coins: 7, owned: ["bow"] });
    expect(applyBuyCosmetic(10, [], "hat-party").ok).toBe(true);
  });

  it("refuses unowned equip and missing ids", () => {
    expect(applyBuyCosmetic(2, [], "bow").reason).toBe("poor");
    expect(applyEquipCosmetic([], {}, "bow")).toEqual({ ok: false, reason: "unowned", equipped: {} });
    expect(applyEquipCosmetic(["bow"], {}, "nope").reason).toBe("missing");
    const on = applyEquipCosmetic(["bow"], {}, "bow");
    expect(on).toEqual({ ok: true, reason: "ok", equipped: { hat: "bow" } });
    const off = applyEquipCosmetic(["bow"], on.equipped, "bow");
    expect(off.equipped.hat).toBeUndefined();
    expect(parseOwnedCosmetics(undefined)).toEqual([]);
    expect(parseEquippedCosmetics({ hat: "bow", neck: "nope" }, ["bow"])).toEqual({ hat: "bow" });
  });
});
