import { describe, expect, it } from "vitest";
import { asset } from "./art";
import { squisheeSrc } from "./squishees";

describe("asset URLs", () => {
  it("prefixes BASE_URL so public squishees resolve under /times-tables/", () => {
    expect(asset("squishees/cat.png")).toBe("/times-tables/squishees/cat.png");
    expect(asset("/squishees/cat.png")).toBe("/times-tables/squishees/cat.png");
    expect(squisheeSrc("cat")).toBe("/times-tables/squishees/cat.png");
    expect(squisheeSrc("shark")).toMatch(/\/times-tables\/squishees\/shark\.png$/);
  });
});
