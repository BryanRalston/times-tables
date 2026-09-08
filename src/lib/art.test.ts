import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { asset } from "./art";
import { squisheeSrc } from "./squishees";

const HERE = dirname(fileURLToPath(import.meta.url));

describe("asset URLs", () => {
  it("prefixes BASE_URL so public squishees resolve under /times-tables/", () => {
    expect(asset("squishees/cat.png")).toBe("/times-tables/squishees/cat.png");
    expect(asset("/squishees/cat.png")).toBe("/times-tables/squishees/cat.png");
    expect(squisheeSrc("cat")).toBe("/times-tables/squishees/cat.png");
    expect(squisheeSrc("shark")).toMatch(/\/times-tables\/squishees\/shark\.png$/);
    expect(squisheeSrc("peach")).toBe("/times-tables/squishees/peach.png");
    expect(existsSync(join(HERE, "../../public/squishees/peach.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/meadow.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/cove.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/forest.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/art/home-peek.png"))).toBe(false);
  });
});
