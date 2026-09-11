import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "@/app";
import { doorRoute } from "@/lib/nav";
import { resetProgressMemory, useProgress } from "@/lib/progress";
import { migratePathHopSpent } from "@/lib/radial-web";
import { SQUISHEE_IDS } from "@/lib/squishees";
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

function expectHomeShell(html: string) {
  expect(html).toContain("Squishee Math");
  expect(html).toMatch(/Today(?:'|&#x27;)s walk/);
  expect(html).toContain("Start");
  expect(html).toContain("All units");
  expect(html).toContain("Home, lessons, and shelf");
  expect(html).toContain("data-continue-card");
  expect(html).toContain("data-continue-peek");
  expect(html).toContain('data-peek-id="peach"');
  expect(html).toContain('data-peek-slot="center"');
  expect(html).toContain(`data-peek-roster="${SQUISHEE_IDS.length}"`);
  expect(html).toContain("data-walk-mark");
  expect(html).toContain("data-scene-land");
  expect(html).toContain("peach.png");
  expect(html).not.toContain("home-peek.png");
  expect(html).not.toMatch(/avocado\.png|mushroom\.png/);
  expect(html).not.toContain("data-grade-path");
  expect(html).not.toContain("Ten-Frame Meadow");
  expect(html).toContain("data-app-shell");
  expect(html).toContain("data-app-tabs");
  expect(html).toContain("data-mute-sounds");
  expect(html).not.toContain("data-welcome-leftover");
  expect(html).not.toContain("6 + n = 10");
  expect(html).not.toContain("Play leftover");
  expect(html).not.toContain("The year map.");
  expect(html).not.toContain(">Score<");
  expect(html).not.toMatch(/Score\s*\/\s*Streak/);
  expect(html).not.toContain("School-day streak");
  expect(html).not.toContain("1/20");
}

function expectLessonsPath(html: string) {
    expect(html).toContain("data-lessons-path");
    expect(html).toContain("data-lessons-fill");
    expect(html).toContain("data-grade-path");
    expect(html).toContain("data-radial-web");
    expect(html).toContain("data-radial-fill");
  expect(html).toContain("Grade 3 Path");
  expect(html).toContain("candy-zones/radial-web-locked.jpg");
  expect(html).toContain('data-path-hopper="peach"');
  expect(html).toContain('data-path-unit="u1"');
  expect(html).toContain('data-path-unit="u13"');
  expect(html).toContain("Start");
  expect(html).not.toContain("data-candy-fog");
  expect(html).not.toContain("Ten-Frame Meadow");
  expect(html).not.toContain("g4-");
  expect(html).not.toContain("data-lessons-continue");
}

describe("first-visit Home door", () => {
  beforeEach(() => {
    resetProgressMemory();
    stubHash("#/");
    stubViewport(390);
  });

  afterEach(() => {
    resetProgressMemory();
  });

  it("empty Guest at #/ on a phone lands on Home, not leftover-as-door", () => {
    expect(useProgress.getState().seenWelcome).toBe(false);
    expectHomeShell(renderToStaticMarkup(<App />));
  });

  it("empty Guest at a phone catalog hash opens that page, not leftover", () => {
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expectLessonsPath(html);
    expect(html).toContain("peach.png");
    expect(html).not.toContain("home-peek.png");
    expect(html).toContain("Home, lessons, and shelf");
    expect(html).not.toContain("Every unit, every activity");
    expect(html).not.toMatch(/3\.NS\.\d/);
    expect(html).not.toContain("data-welcome-leftover");
    expect(html).not.toContain("6 + n = 10");
    expect(html).toContain('data-path-travel="0"');
  });

  it("Guest who finished one small lesson stays put and may roll the die", () => {
    useProgress.setState({
      activities: { "u1-leftover": { plays: 1, best: 4, last: 4, stars: 3, misses: [] } },
      pathHopperAt: 0,
      pathNowSeen: 0,
      pathHopSpent: 0,
      pathStepsLeft: 0,
    });
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('data-path-hop-from="1"');
    expect(html).toContain('data-path-travel="0"');
    expect(html).toContain('data-hop-credits="1"');
    expect(html).toContain('data-hop-credits-ui="1"');
    expect(html).toContain('data-dice-invite="1"');
    expect(html).toContain('data-dice-steps="0"');
    expect(html).toContain('data-hop-pick="0"');
    expect(html).toContain("Roll the die");
    expect(html).toContain("Roll");
    expect(html).toContain('data-dock-roll="1"');
    expect(html).not.toContain('data-pad-choice="1"');
    expect(html).not.toContain("Pick a space");
    expect(html).toMatch(/data-path-unit="u2"[^>]*data-path-status="now"/);
    expect(html).toMatch(/data-path-unit="u1"[^>]*data-path-status="open"/);
  });

  it("Guest with completed lessons and a burned hop ledger can still roll", () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    const activities = { "u1-leftover": leftover, "u1-friends": leftover, "u3-share": leftover };
    useProgress.setState({
      activities,
      pathHopperAt: 0,
      pathNowSeen: 0,
      pathHopSpent: migratePathHopSpent({
        activities,
        pathHopSpent: 3,
        pathHopperAt: 0,
        saveVersion: 10,
      }),
      pathStepsLeft: 0,
    });
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('data-hop-credits="3"');
    expect(html).toContain('data-hop-credits-ui="3"');
    expect(html).toContain("Roll the die");
    expect(html).toContain('data-dice-invite="1"');
    expect(html).not.toContain('data-pad-choice="1"');
    expect(html).toContain('data-path-travel="0"');
  });

  it("Guest who finished today's walk can roll the die", () => {
    useProgress.setState({
      activities: { "daily:u1": { plays: 1, best: 8, last: 8, stars: 3, misses: [] } },
      sessions: {
        "2026-09-10": {
          date: "2026-09-10",
          unitId: "u1",
          schoolDay: 1,
          correct: 8,
          total: 8,
          fresh: 8,
          review: 0,
          completed: true,
        },
      },
      pathHopperAt: 0,
      pathNowSeen: 0,
      pathHopSpent: 0,
      pathStepsLeft: 0,
      coins: 39,
    });
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('data-hop-credits="1"');
    expect(html).toContain('data-dice-invite="1"');
    expect(html).toContain('data-hop-pick="0"');
    expect(html).toContain("Roll the die");
    expect(html).not.toContain('data-pad-choice="1"');
  });

  it("fresh daily earn with leftover steps still invites Roll the die", () => {
    useProgress.setState({
      activities: { "daily:2026-09-11": { plays: 1, best: 8, last: 8, stars: 3, misses: [] } },
      sessions: {
        "2026-09-11": {
          date: "2026-09-11",
          unitId: "u13",
          schoolDay: 170,
          correct: 8,
          total: 8,
          fresh: 8,
          review: 0,
          completed: true,
        },
      },
      pathHopperAt: 0,
      pathNowSeen: 0,
      pathHopSpent: 0,
      pathStepsLeft: 2,
      coins: 39,
    });
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('data-hop-credits="1"');
    expect(html).toContain('data-dice-invite="1"');
    expect(html).toContain('data-hop-pick="0"');
    expect(html).toContain('data-dice-steps="0"');
    expect(html).toContain("Roll the die");
    expect(html).toContain('data-dock-roll="1"');
    expect(html).not.toContain("Pick a space");
    expect(html).not.toContain("2 left");
    expect(html).not.toContain('data-pad-choice="1"');
  });

  it("missing-side perimeter keeps the keypad usable before any tap", () => {
    stubHash("#/play/activity/u8-missing");
    const html = renderToStaticMarkup(<App />);
    expect(html).toMatch(/n is the missing side/i);
    expect(html).toContain("data-keypad");
    expect(html).toContain("Your answer");
    expect(html).toMatch(/aria-label="1"/);
    expect(html).not.toMatch(/aria-label="1"[^>]*disabled/);
    expect(html).not.toMatch(/aria-label="7"[^>]*disabled/);
  });

  it("Guest mid-turn picks each adjacent step until the roll is spent", () => {
    useProgress.setState({
      activities: { "u1-leftover": { plays: 1, best: 4, last: 4, stars: 3, misses: [] } },
      pathHopperAt: 1,
      pathNowSeen: 1,
      pathHopSpent: 1,
      pathStepsLeft: 2,
    });
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('data-hop-credits="0"');
    expect(html).toContain('data-dice-invite="0"');
    expect(html).toContain('data-dice-steps="2"');
    expect(html).toContain('data-dice-steps-ui="2"');
    expect(html).toContain('data-hop-pick="1"');
    expect(html).toContain("Pick a space");
    expect(html).toContain("2 left");
    expect(html).toContain('data-hop-dpad="1"');
    expect(html).toContain("Start");
    expect(html).not.toContain("Roll the die");
  });

  it("Test mode on Lessons offers free adjacent hops without a banked roll", () => {
    useProgress.setState({
      testMode: true,
      activities: {},
      pathHopperAt: 1,
      pathHopSpent: 0,
      pathStepsLeft: 0,
    });
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('data-test-free-move="1"');
    expect(html).toContain("Test mode · free move");
    expect(html).toContain('data-hop-pick="1"');
    expect(html).toContain('data-dice-invite="0"');
    expect(html).toContain('data-hop-dpad="1"');
    expect(html).toContain("Start");
    expect(html).not.toContain("Roll the die");
    expect(html).not.toContain("data-test-mode-toggle");
  });

  it("does not put Test mode on Home chrome, even when the flag is on", () => {
    useProgress.setState({ testMode: true });
    stubHash("#/");
    const html = renderToStaticMarkup(<App />);
    expectHomeShell(html);
    expect(html).not.toContain("Test mode");
    expect(html).not.toContain("data-test-mode-toggle");
    expect(html).not.toContain("data-test-free-move");
  });

  it("Guest with no hop credits sees Grade 3 Path and no hop targets", () => {
    useProgress.setState({
      activities: { "u1-leftover": { plays: 1, best: 4, last: 4, stars: 3, misses: [] } },
      pathHopperAt: 2,
      pathNowSeen: 1,
      pathHopSpent: 1,
      pathStepsLeft: 0,
    });
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('data-hop-credits="0"');
    expect(html).toContain('data-hop-pick="0"');
    expect(html).toContain('data-dice-invite="0"');
    expect(html).toContain("Grade 3 Path");
    expect(html).not.toContain("Pick a space");
    expect(html).not.toContain("Roll the die");
    expect(html).not.toContain('data-pad-choice="1"');
    expect(html).not.toContain('data-pad-quiet="1"');
    expect(html).toContain('data-pad-here="1"');
    expect(html).toContain("Start");
  });

  it("Guest returning from an earlier replay stays on that pad", () => {
    useProgress.setState({
      classUnitId: "u8",
      pathHopperAt: 3,
      pathNowSeen: 8,
      seenWelcome: true,
    });
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('data-path-hop-from="3"');
    expect(html).toContain('data-path-hop-to="3"');
    expect(html).toContain('data-path-travel="0"');
    expect(html).toMatch(/data-path-unit="u8"[^>]*data-path-status="now"/);
    expect(html).toContain("data-radial-web");
  });

  it("empty Guest at #/ on tablet/laptop gets the same Home shell", () => {
    stubViewport(1280);
    expectHomeShell(renderToStaticMarkup(<App />));
    stubViewport(768);
    stubHash("#/");
    expectHomeShell(renderToStaticMarkup(<App />));
  });

  it("empty Guest at #/lessons on a laptop opens Lessons, not leftover", () => {
    stubViewport(1280);
    stubHash("#/lessons");
    const html = renderToStaticMarkup(<App />);
    expectLessonsPath(html);
    expect(html).toContain("peach.png");
    expect(html).toContain("Home, lessons, and shelf");
    expect(html).not.toContain("Every unit, every activity");
    expect(html).not.toMatch(/3\.NS\.\d/);
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

  it("return visits keep Home as one Continue card, not leftover or Score/Streak", () => {
    expect(doorRoute(true, { id: "home" })).toEqual({ id: "home" });
    expectHomeShell(renderToStaticMarkup(<HomePage />));
  });

  it("Home is the door; leftover kiosk is gone; Play keeps tabs", () => {
    const src = readFileSync(join(HERE, "pages/home.tsx"), "utf8");
    expect(src).not.toContain("playLeftover");
    expect(src).not.toContain('kind: "welcome"');
    expect(src).toContain("ui.start");
    expect(src).toContain("allUnits");
    expect(src).not.toContain("CandyPath");
    expect(src).not.toContain("YearPath");
    expect(src).not.toContain("year-beads");
    expect(src).not.toContain("peach");
    expect(src).not.toContain("avocado");
    expect(src).not.toContain("mushroom");
    const app = readFileSync(join(HERE, "app.tsx"), "utf8");
    expect(app).not.toContain("doorRoute");
    expect(app).not.toContain("usePhoneDoor");
    const main = readFileSync(join(HERE, "main.tsx"), "utf8");
    expect(main).not.toContain("applyFirstVisitHash");
    const play = readFileSync(join(HERE, "pages/play.tsx"), "utf8");
    expect(play).toContain('navigate({ id: "path" }');
    expect(play).not.toContain("quietWelcome");
    expect(play).not.toContain("usePhoneDoor");
    expect(play).not.toContain("data-welcome-leftover");
    expect(play).toContain("data-play-page");
    expect(play).toContain("data-play-keys");
    expect(play).toContain("AppTabs");
    expect(play).toContain("REVEAL_AFTER_MISSES");
    expect(play).toContain("holdMsFor");
    expect(play).toMatch(/setValue\(""\);\s*holdRef[\s\S]*WRONG_RETRY_MS/);
    expect(play).toContain("needsInteract");
    expect(play).not.toMatch(/Score\s*\/\s*Streak/);
    expect(play).not.toContain(">Score<");
    const chrome = readFileSync(join(HERE, "components/chrome.tsx"), "utf8");
    expect(chrome).toContain("ui.home");
    expect(chrome).toContain("ui.lessons");
    expect(chrome).toContain("ui.shelf");
    expect(chrome).toContain("data-mute-sounds");
    expect(chrome).toContain("data-app-shell");
    expect(chrome).toContain("app-phone");
    expect(chrome).toContain("CoinChip");
    expect(chrome).toContain("data-scene-land");
    expect(chrome).toContain("walk-spark");
    expect(chrome).toContain("continue-peek");
    expect(chrome).toContain("ContinuePeek");
    expect(chrome).toContain("PEEK_SQUISHEE_IDS");
    expect(chrome).toContain("peekTurn");
    expect(chrome).toContain("squisheeSrc");
    expect(chrome).not.toContain("ART.homePeek");
    expect(chrome).not.toContain("home-peek");
    expect(chrome).not.toContain("lastOwned");
    expect(chrome).not.toContain("squisheeSrc(\"peach\")");
    expect(chrome).not.toContain("max-w-6xl");
    expect(chrome).not.toMatch(/Score\s*\/\s*Streak/);
    expect(chrome).not.toMatch(/\bstars\b/);
    expect(chrome).not.toMatch(/\bstreak\b/);
    const lessons = readFileSync(join(HERE, "pages/lessons.tsx"), "utf8");
    expect(lessons).toContain("data-lessons-path");
    expect(lessons).toContain("data-lessons-fill");
    expect(lessons).toContain("CandyPath");
    expect(lessons).toContain("ui.start");
    expect(lessons).not.toContain("lessonsIntro");
    expect(lessons).not.toContain(".sol");
    const shelf = readFileSync(join(HERE, "pages/shelf.tsx"), "utf8");
    expect(shelf).toContain("data-shelf-plank");
    expect(shelf).toContain("data-shelf-empty");
    expect(shelf).not.toContain("grid-cols-3");
    expect(shelf).not.toContain("Squishee shop");
    const css = readFileSync(join(HERE, "styles.css"), "utf8");
    expect(css).toContain(".app-scene");
    expect(css).toContain(".scene-hill");
    expect(css).toContain(".candy-map");
    expect(css).toContain(".candy-world");
    expect(css).toContain(".candy-world-stage");
    expect(css).toContain(".candy-world-art");
    expect(css).toContain(".candy-overlay");
    expect(css).toContain("aspect-ratio: 6 / 7");
    expect(css).toContain(".candy-scroll[data-lessons-path]");
    expect(css).toContain("100cqi * 7 / 6");
    expect(css).toContain("grid-template-rows: minmax(0, 1fr) auto");
    expect(css).toContain("container-name: radial-card");
    expect(css).toContain('.candy-overlay[data-hop-pick="1"]');
    expect(css).toContain(".candy-prop-land");
    expect(css).toContain(".candy-prop-water");
    expect(css).toContain(".candy-prop-shore");
    expect(css).toContain(".candy-prop.candy-prop-obstacle");
    expect(css).toContain("transform: translate(-50%, -52%)");
    expect(css).toContain(".candy-hopper-art");
    expect(css).toContain(".candy-hopper-shadow");
    expect(css).toContain(".candy-dpad");
    expect(css).toContain(".candy-dpad-btn");
    expect(css).toContain(".candy-dpad-chevron");
    expect(css).toContain("width: 2.5rem");
    expect(css).not.toContain("width: 3.65rem");
    expect(css).toContain("@keyframes candy-hop");
    expect(css).toContain("@keyframes candy-prop-sway");
    expect(css).toContain("@keyframes candy-trail-peek");
    expect(css).toContain("animation: candy-prop-bob 2.8s ease-in-out infinite");
    expect(css).toContain("animation: candy-prop-sway 4.1s ease-in-out infinite");
    expect(css).toContain("animation: candy-prop-fall 1.15s linear infinite");
    expect(css).toContain("animation: candy-prop-spin 7.4s linear infinite");
    expect(css).toContain("animation: candy-water-flow 16s linear infinite");
    expect(css).toContain(".candy-water");
    expect(css).toContain("skewX");
    expect(css).toContain("animation: candy-trail-peek 4.6s 1 forwards");
    expect(css).toContain("transform-origin: 50% 82%");
    expect(css).not.toContain("left 0.72s");
    expect(css).toContain(".candy-fog");
    expect(css).toContain(".candy-fog-mist");
    expect(css).toContain("box-shadow: 0 0 16px 7px rgb(60 210 255 / 0.38)");
    expect(css).toContain(".candy-node-quiet");
    expect(css).toContain(".candy-node-here");
    expect(css).toContain(".candy-hopper-here");
    expect(css).toContain("@keyframes candy-choice-pulse");
    expect(css).toContain("@keyframes candy-portal-swirl");
    expect(css).toContain("@keyframes candy-here-pulse");
    expect(css).toContain("@keyframes candy-warp-ring");
    expect(css).toContain("aspect-ratio: 16 / 9");
    expect(css).toContain("width: max(100%, 68rem)");
    expect(css).toContain("object-fit: cover");
    expect(css).toContain("mask-image");
    expect(css).not.toContain(".candy-plate");
    expect(css).not.toContain("--candy-plate-overlap");
    expect(css).not.toContain(".candy-fog-cloud");
    expect(css).toContain(".app-phone:has(.candy-scroll)");
    expect(css).toContain(".app-phone:has([data-play-page])");
    expect(css).toContain('[data-leftover-board][data-leftover-rows="4"] .leftover-dot');
    expect(css).not.toContain(".tf-bed");
    expect(css).not.toContain(".pie-tree");
    expect(css).not.toContain(".sailboat");
    expect(css).not.toContain(".candy-sprinkle");
    expect(css).toContain(".walk-spark");
    expect(css).toContain("@keyframes peek-bob");
    expect(css).toContain(".continue-peek-left");
    expect(css).toContain(".continue-peek-right");
    expect(css).toContain("animation: peek-bob 5.5s 1");
    expect(css).toContain("animation: none !important");
    expect(css).toContain(".keypad-dock");
    expect(css).toContain(".squishee-silhouette");
    expect(css).toContain("[data-leftover-board] .leftover-dot");
    expect(css).not.toContain("[data-welcome-leftover]");
    const models = readFileSync(join(HERE, "components/models.tsx"), "utf8");
    expect(models).not.toContain("md:min-h-72");
    expect(models).not.toContain("n = {question.answer}");
    const boot = readFileSync(join(HERE, "../index.html"), "utf8");
    expect(boot).not.toContain("#/play/welcome");
    expect(boot).not.toContain("history.replaceState");
  });
});
