import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RARE_SQUISHEES } from "@/lib/squishees";
import { LockedRareMark } from "./shelf";

describe("locked rares", () => {
  it("uses one mystery mark, not the real PNG", () => {
    const html = renderToStaticMarkup(<LockedRareMark />);
    expect(html).toContain("?");
    expect(html).not.toContain("<img");
    for (const s of RARE_SQUISHEES) {
      expect(html).not.toContain(s.file);
      expect(html).not.toContain(s.id);
    }
  });
});
