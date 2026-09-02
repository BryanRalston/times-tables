import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/app";
import { doorRoute } from "@/lib/nav";
import { resetProgressMemory, useProgress } from "@/lib/progress";
import { HomePage } from "@/pages/home";

const HERE = dirname(fileURLToPath(import.meta.url));

function stubHash(hash: string) {
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { hash, pathname: "/times-tables/", search: "" },
  });
}

describe("first-visit leftover door", () => {
  beforeEach(() => {
    resetProgressMemory();
    stubHash("#/");
  });

  afterEach(() => {
    resetProgressMemory();
  });

  it("empty Guest at #/ is already on 6 + n = 10, not Home with leftover + walk + year map", () => {
    expect(useProgress.getState().seenWelcome).toBe(false);
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("6 + n = 10");
    expect(html).toContain('aria-label="dot"');
    expect((html.match(/aria-label="dot"/g) ?? []).length).toBe(6);
    expect(html).toContain("Take the dots you can see");
    expect(html).not.toContain("Play leftover");
    expect(html).not.toMatch(/Start today(?:'|&#x27;)s walk/);
    expect(html).not.toContain("The year map.");
    expect(html).not.toContain("Quarter 1");
    expect(html).not.toContain("Home, lessons, and shelf");
    expect(html).not.toContain("Check");
    expect(html).not.toContain("Skip");
    expect(html).not.toContain("Your answer");
    expect(html).not.toContain("← Home");
  });

  it("empty Guest at a catalog hash still opens leftover, not Lessons or Shelf", () => {
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("6 + n = 10");
    expect(html).not.toContain("Every unit, every activity");
    expect(html).not.toContain("Squishee shop");
    expect(html).not.toMatch(/Start today(?:'|&#x27;)s walk/);
  });

  it("Grown-ups still open on a first visit", () => {
    stubHash("#/grownup");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("data-grownup-lock");
    expect(html).toMatch(/Ask a grown-up/i);
    expect(html).not.toContain("6 + n = 10");
  });

  it("return visits with seenWelcome keep Home as walk + year map, not leftover", () => {
    expect(doorRoute(true, { id: "home" })).toEqual({ id: "home" });
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toMatch(/Start today(?:'|&#x27;)s walk/);
    expect(html).toContain("The year map.");
    expect(html).toContain("Home, lessons, and shelf");
    expect(html).not.toContain("Play leftover");
    expect(html).not.toContain("6 + n = 10");
  });

  it("Home is not a leftover CTA stacked on today's walk", () => {
    const src = readFileSync(join(HERE, "pages/home.tsx"), "utf8");
    expect(src).not.toContain("playLeftover");
    expect(src).not.toContain('kind: "welcome"');
    expect(src).toContain("startWalk");
    expect(src).toContain("YearPath");
    const app = readFileSync(join(HERE, "app.tsx"), "utf8");
    expect(app).toContain("doorRoute");
    expect(app).toContain("seenWelcome");
  });
});
