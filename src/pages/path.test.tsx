import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MISSING_ADDEND_PRICE } from "@/lib/coins";
import { PathPage } from "./path";

describe("leftover path after welcome", () => {
  it("is Number sense Replay quiet and Missing addend 12 loud, not Nice walk or today's walk", () => {
    const html = renderToStaticMarkup(<PathPage />);
    expect(html).toContain("data-leftover-path");
    expect(html).toContain("Number sense");
    expect(html).toContain("Replay");
    expect(html).toContain("Missing addend");
    expect(html).toContain(String(MISSING_ADDEND_PRICE));
    expect(html).not.toContain("Nice walk");
    expect(html).not.toMatch(/Start today(?:'|&#x27;)s walk/);
    expect(html).not.toContain("Remember these toys");
    expect(html).not.toContain("You earned");
    expect(html).not.toContain("The year map.");
    expect(html).not.toContain("Play leftover");
  });
});
