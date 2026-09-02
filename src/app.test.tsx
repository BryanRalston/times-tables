import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/app";
import { doorRoute } from "@/lib/nav";
import { PHONE_MAX_PX } from "@/lib/viewport";
import { resetProgressMemory, useProgress } from "@/lib/progress";
import { HomePage } from "@/pages/home";

const HERE = dirname(fileURLToPath(import.meta.url));

function stubHash(hash: string) {
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { hash, pathname: "/times-tables/", search: "" },
  });
}

function stubViewport(width: number) {
  Object.defineProperty(globalThis, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => {
      const max = /max-width:\s*(\d+)/i.exec(query);
      const min = /min-width:\s*(\d+)/i.exec(query);
      let matches = false;
      if (max) matches = width <= Number(max[1]);
      else if (min) matches = width >= Number(min[1]);
      return {
        matches,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false;
        },
        onchange: null,
      };
    },
  });
}

describe("first-visit leftover door", () => {
  beforeEach(() => {
    resetProgressMemory();
    stubHash("#/");
    stubViewport(390);
  });

  afterEach(() => {
    resetProgressMemory();
  });

  it("empty Guest at #/ on a phone is already on 6 + n = 10, not Home with leftover + walk + year map", () => {
    expect(useProgress.getState().seenWelcome).toBe(false);
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("6 + n = 10");
    expect(html).toContain('aria-label="dot"');
    expect(html).toContain("data-welcome-leftover");
    expect(html).toContain("known group");
    expect((html.match(/aria-label="dot"/g) ?? []).length).toBe(6);
    expect(html).not.toContain("Play leftover");
    expect(html).not.toMatch(/Start today(?:'|&#x27;)s walk/);
    expect(html).not.toContain("The year map.");
    expect(html).not.toContain("Quarter 1");
    expect(html).not.toContain("Home, lessons, and shelf");
    expect(html).not.toContain("Check");
    expect(html).not.toContain("Skip");
    expect(html).not.toContain("Your answer");
    expect(html).not.toContain("1/4");
    expect(html).not.toContain("Take the dots you can see");
    expect(html).not.toContain("← Home");
    expect(html).not.toContain("Nice walk");
    expect(html).toContain("place-content-center");
    expect(html).toContain("data-leftover-board");
    expect(html).not.toContain("md:grid-rows-[auto_minmax(0,1fr)_auto]");
    expect(html).not.toContain("lg:max-w-3xl");
  });

  it("empty Guest at a phone catalog hash still opens leftover, not Lessons or Shelf", () => {
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("6 + n = 10");
    expect(html).toContain("data-welcome-leftover");
    expect(html).not.toContain("Every unit, every activity");
    expect(html).not.toContain("Squishee shop");
    expect(html).not.toMatch(/Start today(?:'|&#x27;)s walk/);
  });

  it("empty Guest at #/ on tablet/laptop gets the full shell, not a leftover kiosk", () => {
    stubViewport(1280);
    expect(useProgress.getState().seenWelcome).toBe(false);
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Home, lessons, and shelf");
    expect(html).toMatch(/Start today(?:'|&#x27;)s walk/);
    expect(html).toContain("The year map.");
    expect(html).not.toContain("data-welcome-leftover");
    expect(html).not.toContain("6 + n = 10");
    expect(html).not.toContain("Play leftover");
    const tablet = stubViewport(768);
    void tablet;
    stubHash("#/");
    const tab = renderToStaticMarkup(<App />);
    expect(tab).toContain("Home, lessons, and shelf");
    expect(tab).not.toContain("data-welcome-leftover");
  });

  it("empty Guest at #/lessons on a laptop opens Lessons, not leftover", () => {
    stubViewport(1280);
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Every unit, every activity");
    expect(html).toContain("Home, lessons, and shelf");
    expect(html).not.toContain("data-welcome-leftover");
    expect(html).not.toContain("6 + n = 10");
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

  it("Home is not a leftover CTA stacked on today's walk; leftover kiosk is phone-only", () => {
    const src = readFileSync(join(HERE, "pages/home.tsx"), "utf8");
    expect(src).not.toContain("playLeftover");
    expect(src).not.toContain('kind: "welcome"');
    expect(src).toContain("startWalk");
    expect(src).toContain("YearPath");
    const app = readFileSync(join(HERE, "app.tsx"), "utf8");
    expect(app).toContain("doorRoute");
    expect(app).toContain("usePhoneDoor");
    expect(app).toContain("seenWelcome");
    expect(app).not.toContain('!seenWelcome && route.id !== "grownup"');
    const main = readFileSync(join(HERE, "main.tsx"), "utf8");
    expect(main.indexOf("applyFirstVisitHash")).toBeGreaterThan(-1);
    expect(main.indexOf("applyFirstVisitHash")).toBeLessThan(main.indexOf("hydrateProgress"));
    const play = readFileSync(join(HERE, "pages/play.tsx"), "utf8");
    expect(play).toContain('navigate({ id: "path" }');
    expect(play).toContain("quietWelcome");
    expect(play).toContain("usePhoneDoor");
    expect(play).toContain('kind === "welcome" && phone');
    expect(play).toContain("place-content-center");
    expect(play).toContain("max-w-xl");
    expect(play).not.toContain("md:grid-rows-[auto_minmax(0,1fr)_auto]");
    expect(play).not.toContain("lg:max-w-3xl");
    const css = readFileSync(join(HERE, "styles.css"), "utf8");
    expect(css).toContain("[data-welcome-leftover] [data-leftover-board] .leftover-dot");
    expect(css).not.toMatch(/@media \(min-width: 768px\)\s*\{\s*\[data-welcome-leftover\]/);
    expect(css).not.toMatch(/@media \(min-width: 1024px\)\s*\{\s*\[data-welcome-leftover\]/);
    const models = readFileSync(join(HERE, "components/models.tsx"), "utf8");
    expect(models).not.toContain("md:min-h-72");
    expect(models).not.toContain("lg:min-h-72");
    const boot = readFileSync(join(HERE, "../index.html"), "utf8");
    expect(boot).toContain(`max-width: ${PHONE_MAX_PX}px`);
    expect(boot).toContain("#/play/welcome");
  });
});
