import { beforeEach, describe, expect, it } from "vitest";
import { applyPointer, gestureStart, holdAmount, replayPointer, squishHitPolicy, type Sample } from "./gesture";
import { idleFrame, restBody, squishSettled, stepSquish, touchNorm, type SquishBody, type SquishFrame } from "./physics";
import { bumpSquishCount, getSquishCount, resetSquishCount, squishBuzz, squishFlourish, squishPitch } from "./rewards";

const DT = 1 / 60;

function press(body: SquishBody, frame: SquishFrame, frames: number): SquishBody {
  let next = body;
  for (let i = 0; i < frames; i += 1) next = stepSquish(next, frame, DT).body;
  return next;
}

function release(body: SquishBody, impulse: SquishFrame["impulse"], reduced = false): { body: SquishBody; sy: number[] } {
  const sy: number[] = [];
  let frame = stepSquish(body, { ...idleFrame(reduced), impulse, nx: -0.2 }, DT);
  sy.push(frame.body.sy);
  let next = frame.body;
  for (let i = 0; i < 110; i += 1) {
    frame = stepSquish(next, idleFrame(reduced), DT);
    next = frame.body;
    sy.push(next.sy);
  }
  return { body: next, sy };
}

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

  it("reads the dent from the touch point inside the toy", () => {
    expect(touchNorm(0, 10, 40, 40)).toEqual({ nx: -1, ny: -0.5 });
    expect(touchNorm(40, 40, 40, 40)).toEqual({ nx: 1, ny: 1 });
  });
});

describe("squish physics", () => {
  it("taps with a squash then a soft overshoot", () => {
    const tapped = release(restBody(), "tap");
    expect(Math.min(...tapped.sy)).toBeLessThan(0.85);
    expect(Math.max(...tapped.sy)).toBeGreaterThan(1.03);
    expect(squishSettled(tapped.body, false)).toBe(true);
  });

  it("squashes wider and shorter under a hold, dents toward the finger, then wobbles back", () => {
    const frame: SquishFrame = { ...idleFrame(), pressing: true, hold01: 1, nx: -0.6, ny: 0.25 };
    let visual = stepSquish(restBody(), frame, DT).visual;
    let body = restBody();
    for (let i = 0; i < 36; i += 1) {
      const stepped = stepSquish(body, frame, DT);
      body = stepped.body;
      visual = stepped.visual;
    }
    expect(body.sx).toBeGreaterThan(1.28);
    expect(body.sy).toBeLessThan(0.82);
    expect(body.sx * body.sy).toBeGreaterThan(0.9);
    expect(body.y).toBeGreaterThan(4);
    expect(visual.dentX).toBeCloseTo(-0.6);
    expect(visual.face).toBe("giggle");

    const letGo = release(body, "release");
    expect(Math.max(...letGo.sy)).toBeGreaterThan(1.03);
    expect(squishSettled(letGo.body, false)).toBe(true);
  });

  it("stretches toward a drag and bounces on a flick", () => {
    const frame: SquishFrame = { ...idleFrame(), pressing: true, hold01: 0.2, dx: 48, dy: 6, nx: 0.8, ny: 0 };
    const dragged = press(restBody(), frame, 24);
    expect(dragged.x).toBeGreaterThan(10);
    expect(dragged.sx).toBeGreaterThan(1.05);

    const ys: number[] = [];
    let body = dragged;
    body = stepSquish(body, { ...idleFrame(), impulse: "flick" }, DT).body;
    ys.push(body.y);
    for (let i = 0; i < 50; i += 1) {
      body = stepSquish(body, idleFrame(), DT).body;
      ys.push(body.y);
    }
    expect(Math.min(...ys)).toBeLessThan(-8);
    expect(squishSettled(press(body, idleFrame(), 80), false)).toBe(true);
  });

  it("uses only a tiny uniform scale when motion is reduced", () => {
    const held: SquishFrame = { ...idleFrame(true), pressing: true, hold01: 1, nx: 1, ny: -1, dx: 30, dy: 20 };
    let body = restBody();
    const scales: number[] = [];
    for (let i = 0; i < 20; i += 1) {
      const stepped = stepSquish(body, held, DT);
      body = stepped.body;
      scales.push(body.sx);
      expect(body.sx).toBeCloseTo(body.sy);
      expect(body.x).toBe(0);
      expect(body.y).toBe(0);
      expect(body.rot).toBe(0);
      expect(stepped.visual.dentX).toBe(0);
      expect(body.sx).toBeGreaterThan(0.95);
      expect(body.sx).toBeLessThanOrEqual(1);
    }
    expect(scales.at(-1)!).toBeLessThan(0.97);

    const back = release(body, "tap", true);
    for (const sy of back.sy) {
      expect(sy).toBeGreaterThan(0.955);
      expect(sy).toBeLessThanOrEqual(1);
    }
    expect(back.body.x).toBe(0);
    expect(back.body.rot).toBe(0);
  });
});

describe("squish fun", () => {
  beforeEach(() => {
    resetSquishCount();
  });

  it("gives each squishee a stable cute pitch", () => {
    expect(squishPitch("peach")).toBe(squishPitch("peach"));
    expect(squishPitch("peach")).not.toBe(squishPitch("frog"));
    for (const id of ["peach", "frog", "panda", "galaxy-narwhal", "star-mochi"]) {
      expect(squishPitch(id)).toBeGreaterThanOrEqual(320);
      expect(squishPitch(id)).toBeLessThanOrEqual(470);
    }
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

  it("skips the haptic when motion is reduced", () => {
    const pulses: number[] = [];
    squishBuzz(true, (ms) => pulses.push(ms));
    squishBuzz(false, (ms) => pulses.push(ms));
    expect(pulses).toEqual([12]);
  });
});
