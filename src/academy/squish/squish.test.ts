import { beforeEach, describe, expect, it } from "vitest";
import { applyPointer, gestureStart, holdAmount, replayPointer, squishHitPolicy, type Sample } from "./gesture";
import { idleFrame, meshArea, meshVertex, restBody, squishSettled, stepSquish, touchNorm, SOFT_COLS, SOFT_ROWS, type SquishBody, type SquishFrame } from "./physics";
import { squishVoice } from "../sound";
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

function nearest(body: SquishBody, nx: number, ny: number) {
  const x = (nx + 1) / 2;
  const y = (ny + 1) / 2;
  let best = meshVertex(body, 0, 0);
  let bestD = Infinity;
  for (let r = 0; r < SOFT_ROWS; r += 1) {
    for (let c = 0; c < SOFT_COLS; c += 1) {
      const v = meshVertex(body, c, r);
      const d = (v.rx - x) ** 2 + (v.ry - y) ** 2;
      if (d < bestD) {
        best = v;
        bestD = d;
      }
    }
  }
  return best;
}

describe("squish physics", () => {
  it("taps into a quick squash, a side bulge, and a secondary wobble", () => {
    let body = restBody();
    const widths: number[] = [];
    const shears: number[] = [];
    body = stepSquish(body, { ...idleFrame(), impulse: "tap", nx: 0, ny: -0.4 }, DT).body;
    for (let i = 0; i < 200; i += 1) {
      body = stepSquish(body, idleFrame(), DT).body;
      widths.push(body.sx);
      const mid = meshVertex(body, Math.round((SOFT_COLS - 1) / 2), Math.round((SOFT_ROWS - 1) * 0.35));
      shears.push(mid.x - mid.rx);
    }
    expect(Math.max(...widths)).toBeGreaterThan(1.04);
    expect(Math.min(...widths.slice(0, 8))).toBeLessThan(1.2);
    const turned = shears.some((value, i) => i > 4 && shears[i - 3]! * value < 0);
    expect(turned).toBe(true);
    expect(squishSettled(body, false)).toBe(true);
  });

  it("dents under the finger, bulges the sides, keeps volume, and plants the base", () => {
    const frame: SquishFrame = { ...idleFrame(), pressing: true, hold01: 1, nx: 0, ny: -0.45 };
    let body = restBody();
    let visual = stepSquish(body, frame, DT).visual;
    for (let i = 0; i < 40; i += 1) {
      const stepped = stepSquish(body, frame, DT);
      body = stepped.body;
      visual = stepped.visual;
    }
    const dent = nearest(body, 0, -0.45);
    const side = meshVertex(body, 0, Math.round((SOFT_ROWS - 1) / 2));
    const foot = meshVertex(body, 6, SOFT_ROWS - 1);
    const area = meshArea(body);
    expect(dent.y - dent.ry).toBeGreaterThan(0.1);
    expect(side.rx - side.x).toBeGreaterThan(0.03);
    expect(Math.abs(foot.y - foot.ry)).toBeLessThan(0.001);
    expect(area).toBeGreaterThan(0.9);
    expect(area).toBeLessThan(1.12);
    expect(body.sx).toBeGreaterThan(1.04);
    expect(visual.dentX).toBeCloseTo(0);
    expect(visual.face).toBe("giggle");
    expect(visual.squint).toBeGreaterThan(0.45);
    expect(visual.spread).toBeGreaterThan(1);

    const rise: number[] = [];
    body = stepSquish(body, { ...idleFrame(), impulse: "release", nx: 0, ny: -0.45 }, DT).body;
    rise.push(nearest(body, 0, -0.45).y);
    let stillMoving = false;
    for (let i = 0; i < 18; i += 1) {
      body = stepSquish(body, idleFrame(), DT).body;
      rise.push(nearest(body, 0, -0.45).y);
      if (!squishSettled(body, false)) stillMoving = true;
    }
    for (let i = 0; i < 220; i += 1) body = stepSquish(body, idleFrame(), DT).body;
    expect(rise[0]!).toBeGreaterThan(rise[rise.length - 1]! + 0.02);
    expect(stillMoving).toBe(true);
    expect(Math.min(...rise)).toBeGreaterThan(dent.ry - 0.04);
    expect(squishSettled(body, false)).toBe(true);
  });

  it("stretches from the grab point and keeps the base down", () => {
    const frame: SquishFrame = { ...idleFrame(), pressing: true, hold01: 0.2, dx: 48, dy: 8, nx: 0.7, ny: -0.2, width: 100, height: 100 };
    const dragged = press(restBody(), frame, 28);
    const grab = nearest(dragged, 0.7, -0.2);
    const far = meshVertex(dragged, 0, 2);
    const foot = meshVertex(dragged, 6, SOFT_ROWS - 1);
    expect(grab.x - grab.rx).toBeGreaterThan(0.12);
    expect(grab.x - grab.rx).toBeGreaterThan((far.x - far.rx) + 0.05);
    expect(Math.abs(foot.y - foot.ry)).toBeLessThan(0.001);

    let body = stepSquish(dragged, { ...idleFrame(), impulse: "flick", dx: 48, dy: 8, nx: 0.7, ny: -0.2 }, DT).body;
    for (let i = 0; i < 240; i += 1) body = stepSquish(body, idleFrame(), DT).body;
    expect(squishSettled(body, false)).toBe(true);
    expect(Math.abs(meshVertex(body, 6, SOFT_ROWS - 1).y - 1)).toBeLessThan(0.001);
  });

  it("steps a few seconds of soft-body inside a phone frame budget", () => {
    let body = restBody();
    const held: SquishFrame = { ...idleFrame(), pressing: true, hold01: 1, nx: -0.2, ny: -0.3 };
    const t0 = performance.now();
    for (let i = 0; i < 90; i += 1) body = stepSquish(body, held, DT).body;
    for (let i = 0; i < 150; i += 1) body = stepSquish(body, idleFrame(), DT).body;
    expect(performance.now() - t0).toBeLessThan(120);
    expect(Number.isFinite(body.sx)).toBe(true);
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

  it("uses a quiet noise squish instead of a beep", () => {
    const down = squishVoice("peach", "down", 0.2);
    const up = squishVoice("peach", "up", 0.8);
    expect(down.bodyHz).toBeLessThan(160);
    expect(up.bodyHz).toBeLessThan(180);
    expect(down.noiseGain).toBeGreaterThan(0.02);
    expect(down.bodyGain + down.noiseGain + down.squelchGain).toBeLessThan(0.12);
    expect(down.squelchHz).not.toBe(up.squelchHz);
    expect(down.noiseHz).not.toBe(squishVoice("peach", "down", 0.9).noiseHz);
  });

  it("skips the haptic when motion is reduced", () => {
    const pulses: number[] = [];
    squishBuzz(true, (ms) => pulses.push(ms));
    squishBuzz(false, (ms) => pulses.push(ms));
    expect(pulses).toEqual([8]);
  });
});
