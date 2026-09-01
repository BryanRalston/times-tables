import { describe, expect, it } from "vitest";
import { COMMON_PRICE, RARE_PRICE, squisheePrice } from "@/lib/coins";

describe("shop prices", () => {
  it("commons cost 10 and rares cost 50", () => {
    expect(squisheePrice("frog")).toBe(COMMON_PRICE);
    expect(squisheePrice("panda")).toBe(COMMON_PRICE);
    expect(squisheePrice("aurora-jelly")).toBe(RARE_PRICE);
    expect(squisheePrice("crystal-axolotl")).toBe(RARE_PRICE);
  });
});
