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
    expect(existsSync(join(HERE, "../../public/candy-zones/tall-map.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/waterfall.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/tenframe.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/coins.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/palm.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/fraction-pie.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/art/home-peek.png"))).toBe(false);
  });
});
