import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { pokeMotion, pokePlayback } from "@/components/poke-play";
import { squisheeMediaUrl } from "../paths";
import { Squishy } from "../ui/squishy";
import { applyPointer, gestureStart, holdAmount, replayPointer, squishHitPolicy, type Sample } from "./gesture";
import { bumpSquishCount, getSquishCount, resetSquishCount, squishFlourish } from "./rewards";

const buddyPoke: Sample[] = [
  { kind: "down", x: 40, y: 20, t: 0 },
  { kind: "move", x: 44, y: 28, t: 40 },
  { kind: "up", x: 46, y: 30, t: 90 },
];

describe("squish pointer", () => {
  it("does not answer, skip, or take the choice when the buddy is squished", () => {
    let answered: string | null = null;
    let skipped = false;
    const plans = replayPointer(buddyPoke, "buddy");
    for (const plan of plans) {
      expect(plan.answers).toBe(false);
      expect(plan.stopPropagation).toBe(true);
      if (plan.answers) answered = "4";
      if (plan.mode === "tap" || plan.mode === "release" || plan.mode === "flick") skipped = false;
    }
    expect(answered).toBeNull();
    expect(skipped).toBe(false);
    expect(plans.some((plan) => plan.countSquish)).toBe(true);
    expect(plans.at(-1)?.gesture.phase).toBe("idle");
  });

  it("keeps answer controls and the map hop free of squish", () => {
    expect(squishHitPolicy("answer")).toEqual({ interactive: false, stopPropagation: false, answers: false });
    expect(squishHitPolicy("map")).toEqual({ interactive: false, stopPropagation: false, answers: false });
    expect(squishHitPolicy("buddy").interactive).toBe(true);
    expect(squishHitPolicy("toy").stopPropagation).toBe(false);
  });

  it("treats a short press as a tap and a still hold as squash", () => {
    const tap = applyPointer(gestureStart(), { kind: "down", x: 0, y: 0, t: 0 }, "toy");
    const up = applyPointer(tap.gesture, { kind: "up", x: 3, y: 2, t: 120 }, "toy");
    expect(up.mode).toBe("tap");
    expect(up.impulse).toBe("tap");
    expect(up.stopPropagation).toBe(false);
    expect(up.answers).toBe(false);

    const held = applyPointer(tap.gesture, { kind: "move", x: 2, y: 1, t: 400 }, "buddy");
    expect(held.mode).toBe("hold");
    expect(held.hold01).toBeGreaterThan(0.5);
    expect(held.stopPropagation).toBe(true);
    expect(holdAmount(90)).toBe(0);
    expect(holdAmount(90 + 420)).toBe(1);
  });

  it("stretches on a sideways drag, flicks when the finger is fast, and yields a vertical scroll", () => {
    const down = applyPointer(gestureStart(), { kind: "down", x: 10, y: 10, t: 0 }, "toy");
    const drag = applyPointer(down.gesture, { kind: "move", x: 40, y: 16, t: 80 }, "toy");
    expect(drag.mode).toBe("drag");
    expect(drag.dx).toBe(30);
    expect(drag.capture).toBe(true);
    expect(drag.answers).toBe(false);

    const flicked = applyPointer(drag.gesture, { kind: "up", x: 78, y: 18, t: 100 }, "toy");
    expect(flicked.mode).toBe("flick");
    expect(flicked.countSquish).toBe(true);

    const scrollStart = applyPointer(gestureStart(), { kind: "down", x: 0, y: 0, t: 0 }, "toy");
    const scroll = applyPointer(scrollStart.gesture, { kind: "move", x: 2, y: 36, t: 40 }, "toy");
    expect(scroll.yieldScroll).toBe(true);
    expect(scroll.countSquish).toBe(false);
    expect(scroll.answers).toBe(false);

    const buddyDown = applyPointer(gestureStart(), { kind: "down", x: 0, y: 0, t: 0 }, "buddy");
    const buddyDrag = applyPointer(buddyDown.gesture, { kind: "move", x: 4, y: 40, t: 50 }, "buddy");
    expect(buddyDrag.yieldScroll).toBe(false);
    expect(buddyDrag.mode).toBe("drag");
    expect(buddyDrag.stopPropagation).toBe(true);
  });

  it("cancels without counting a squish", () => {
    const down = applyPointer(gestureStart(), { kind: "down", x: 5, y: 5, t: 0 }, "buddy");
    const cancel = applyPointer(down.gesture, { kind: "cancel", x: 5, y: 5, t: 30 }, "buddy");
    expect(cancel.mode).toBe("cancel");
    expect(cancel.countSquish).toBe(false);
    expect(cancel.answers).toBe(false);
    expect(cancel.gesture.phase).toBe("idle");
  });

});

describe("math poke art", () => {
  it("uses the chroma-key clip for frog, cat, and bunny, and the strip when video is skipped", () => {
    expect(pokePlayback("frog", false).clip).toMatch(/frog-poke\.mp4$/);
    expect(pokePlayback("frog", false).strip).toBeNull();
    expect(pokePlayback("cat", false).clip).toMatch(/cat-poke\.mp4$/);
    expect(pokePlayback("bunny", false).clip).toMatch(/bunny-poke\.mp4$/);
    const frogStrip = pokePlayback("frog", true);
    expect(frogStrip.clip).toBeNull();
    expect(frogStrip.strip).toMatchObject({ frames: 16, fps: 12 });
    expect(frogStrip.strip?.src).toMatch(/frog-poke-strip\.png$/);
    expect(pokePlayback("bunny", true).strip?.src).toMatch(/bunny-poke-strip\.png$/);
    expect(pokePlayback("cat", true).strip?.src).toMatch(/cat-poke-strip\.png$/);
    expect(squisheeMediaUrl("/times-tables/academy/squishees/frog-poke.mp4")).toBe("/times-tables/squishees/frog-poke.mp4");
    expect(squisheeMediaUrl(pokePlayback("frog", true).strip?.src ?? "")).toBe("/times-tables/squishees/frog-poke-strip.png");
  });

  it("keeps every other squishee on the still, squashed with the same CSS", () => {
    expect(pokePlayback("peach", false)).toEqual({ clip: null, strip: null });
    expect(pokePlayback("panda", true)).toEqual({ clip: null, strip: null });
    expect(pokePlayback("avocado", false)).toEqual({ clip: null, strip: null });
    expect(pokeMotion(false, pokePlayback("peach", false)).squash).toBe(true);
  });

  it("drops the clip and the squash when motion is reduced", () => {
    expect(pokeMotion(true, pokePlayback("frog", false))).toEqual({ squash: false, clip: null, strip: null });
    expect(pokeMotion(true, pokePlayback("frog", true))).toEqual({ squash: false, clip: null, strip: null });
  });

  it("rests on the still picture and does not mount a mesh", () => {
    const frog = renderToStaticMarkup(
      createElement(Squishy, { id: "frog" }, createElement("img", { src: "/times-tables/squishees/frog.png", alt: "" })),
    );
    expect(frog).toContain("frog.png");
    expect(frog).toContain('data-squash="0"');
    expect(frog).toContain("ac-squish-stage");
    expect(frog).not.toContain("<canvas");
    expect(frog).not.toContain("<video");
    expect(frog).not.toContain("frog-poke");

    const peach = renderToStaticMarkup(
      createElement(Squishy, { id: "peach" }, createElement("img", { src: "/times-tables/squishees/peach.png", alt: "" })),
    );
    expect(peach).toContain('data-squash="0"');
    expect(peach).not.toContain("peach-poke");
    expect(peach).not.toContain("<canvas");
  });

  it("reuses the Math squash classes, tap tone, and leaves the clock pal alone", () => {
    const ui = readFileSync(new URL("../ui/squishy.tsx", import.meta.url), "utf8");
    const tap = readFileSync(new URL("../../lib/sound.ts", import.meta.url), "utf8");
    const clock = readFileSync(new URL("../ui/bits.tsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../../components/poke-squish.css", import.meta.url), "utf8");
    expect(ui).toContain("SquashOnPoke");
    expect(ui).toContain("MagentaVideo");
    expect(ui).toContain("PokeStrip");
    expect(ui).toContain("if (soundRef.current) playTap()");
    expect(ui).not.toContain("squishTone");
    expect(ui).not.toContain("drawSoftBody");
    expect(tap).toMatch(/function playTap\(\)[\s\S]*tone\(880,\s*c\.currentTime,\s*0\.04,\s*"sine",\s*0\.025\)/);
    expect(css).toContain("animation: squash 640ms cubic-bezier(0.22, 1, 0.36, 1)");
    expect(css).toContain("animation: poke-bounce 520ms cubic-bezier(0.22, 1, 0.36, 1)");
    expect(css).toContain("transform-origin: 50% 90%");
    expect(clock).toContain('<img className="ac-clock-pal"');
    expect(clock).not.toContain("ac-clock-pal\" src={squisheeUrl(rider.file)} alt=\"\" draggable={false} /></Squishy>");
    const academyCss = readFileSync(new URL("../academy.css", import.meta.url), "utf8");
    expect(academyCss).toContain(".ac-map-you { width: 46px; height: 46px; object-fit: contain; animation: ac-hop 0.7s ease; }");
    expect(academyCss).toContain(".ac-choice .ac-squish,\n.ac-cell .ac-squish { pointer-events: none; cursor: inherit; }");
    expect(ui).not.toContain("squishBuzz");
    expect(ui).not.toContain("vibrate");
  });
});

describe("squish fun", () => {
  beforeEach(() => {
    resetSquishCount();
  });

  it("says a line sometimes and bursts hearts for the buddy", () => {
    expect(squishFlourish(1, "buddy")).toEqual({ line: false, hearts: false });
    expect(squishFlourish(3, "buddy").hearts).toBe(true);
    expect(squishFlourish(3, "toy").hearts).toBe(false);
    expect(squishFlourish(4, "toy").line).toBe(true);
    expect(squishFlourish(8, "buddy")).toEqual({ line: true, hearts: false });
  });

  it("counts squishes without turning them into a score", () => {
    expect(getSquishCount()).toBe(0);
    expect(bumpSquishCount()).toBe(1);
    expect(bumpSquishCount()).toBe(2);
    expect(getSquishCount()).toBe(2);
  });

});
