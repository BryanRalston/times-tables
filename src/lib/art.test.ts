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
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/tenframe-mound.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/coins.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/coin-stack.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/coin-spin.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/palm.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/dock.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/fraction-tree.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/meadow-flowers.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/daisies.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/candy-cane.png"))).toBe(false);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/lollipop.png"))).toBe(false);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/peppermint.png"))).toBe(false);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/shell.png"))).toBe(false);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/pie-tart.png"))).toBe(false);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/numbered-sweet.png"))).toBe(false);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/sailboat.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/cove-water-mask.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/candy-zones/overlays/cove-boulder.png"))).toBe(true);
    expect(existsSync(join(HERE, "../../public/art/home-peek.png"))).toBe(false);
  });
});
