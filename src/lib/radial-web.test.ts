import { describe, expect, it } from "vitest";
import { UNITS } from "./curriculum";
import {
  HOP_DIR_SNAP_DEG,
  HOPPER_ART_ZOOM_PCT,
  HOPPER_BOARD_WIDTH_PCT,
  HOPPER_SIT_TRANSLATE,
  HOP_GLOW_BOARD_WIDTH_PCT,
  HOP_SNAP_MIN_PX,
  HOP_SNAP_PX,
  hopSnapPx,
  hopGlowBoardPx,
  hopperBoardPx,
  minAdjacentGapPx,
  DESK_MAP_BOARD,
  DESK_MAP_VIEW,
  PHONE_MAP_BOARD,
  PHONE_MAP_VIEW,
  PORTAL_PAIRS,
  RADIAL_EDGES,
  RADIAL_MAP_FILE,
  RADIAL_PAD_COUNT,
  RADIAL_PADS,
  RADIAL_PLAZA,
  START_PAD,
  hopDirs,
  nearestHopDir,
  adjacentPadIds,
  areAdjacent,
  activePathStepsLeft,
  canStartDiceTurn,
  clampDieFace,
  clampPathStepsLeft,
  dailyWalkActivityId,
  hopCreditsOf,
  hopLessonsCompleted,
  migrateDiceTurnState,
  migratePathHopSpent,
  migratePathStepsLeft,
  nearestHopTarget,
  padClientPos,
  portalPartner,
  radialHopStops,
  rollDieFace,
  smallLessonsCompleted,
} from "./radial-web";

describe("radial web", () => {
  it("is a connected ring-and-spoke graph on the locked map", () => {
    expect(RADIAL_MAP_FILE).toBe("candy-zones/radial-web-locked.jpg");
    expect(RADIAL_PADS).toHaveLength(RADIAL_PAD_COUNT);
    expect(RADIAL_PADS[0]!.id).toBe(START_PAD);
    expect(RADIAL_PADS.every((p) => p.id >= 1 && p.map.x > 8 && p.map.x < 92)).toBe(true);
    expect(RADIAL_PADS.filter((p) => p.ring === 0)).toHaveLength(1);
    expect(RADIAL_PAD_COUNT).toBe(95);
    expect(RADIAL_PADS.filter((p) => p.ring === 1).length).toBeGreaterThanOrEqual(8);
    expect(RADIAL_PADS.filter((p) => p.ring === 4).length).toBeGreaterThan(40);
    expect(RADIAL_EDGES.length).toBeGreaterThan(RADIAL_PAD_COUNT);
    for (const pad of RADIAL_PADS) {
      expect(adjacentPadIds(pad.id).length).toBeGreaterThan(0);
    }
    expect(adjacentPadIds(START_PAD)).toHaveLength(8);
    expect(RADIAL_PLAZA).toEqual({ x: 49.682, y: 46.272 });
    expect(RADIAL_PADS[0]!.map).toEqual(RADIAL_PLAZA);
    expect(UNITS.every((u) => !u.id.startsWith("g4-"))).toBe(true);
  });

  it("keeps every hop off the #70 grass gaps and on a painted tile center", () => {
    const grassNE = { x: 54.58, y: 36.8 };
    const betweenOuterTiles = { x: 59.033, y: 16.408 };
    const northGrass = { x: 48.923, y: 18.515 };
    const artDist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(((a.x - b.x) / 100) * 1280, ((a.y - b.y) / 100) * 720);
    for (const pad of RADIAL_PADS) {
      expect(artDist(pad.map, grassNE)).toBeGreaterThan(10);
      expect(artDist(pad.map, betweenOuterTiles)).toBeGreaterThan(8);
      expect(artDist(pad.map, northGrass)).toBeGreaterThan(8);
    }
    const ne = RADIAL_PADS.find((p) => p.id === 3)!;
    expect(ne.map.x).toBeGreaterThan(54.9);
    expect(ne.map.y).toBeGreaterThan(37.5);
    expect(ne.map.y).toBeLessThan(39.5);
    const outerN = RADIAL_PADS.find((p) => p.portal && p.ring === 4 && p.map.y < 10)!;
    expect(outerN?.id).toBe(54);
    const outerSW = RADIAL_PADS.find((p) => p.portal && p.map.x < 28 && p.map.y > 68)!;
    expect(outerSW?.id).toBe(57);
    expect(adjacentPadIds(54)).toContain(95);
    expect(adjacentPadIds(57)).toEqual(expect.arrayContaining([80, 81]));
    expect(areAdjacent(56, 58)).toBe(true);
    expect(areAdjacent(56, 57)).toBe(false);
  });

  it("hops exactly one adjacent space and never skips pads", () => {
    const next = adjacentPadIds(START_PAD)[0]!;
    expect(areAdjacent(START_PAD, next)).toBe(true);
    expect(radialHopStops(START_PAD, next)).toEqual([START_PAD, next]);
    expect(radialHopStops(START_PAD, START_PAD)).toEqual([START_PAD]);
    const far = RADIAL_PADS.find((p) => p.ring === 4 && !areAdjacent(START_PAD, p.id))!;
    expect(radialHopStops(START_PAD, far.id)).toEqual([START_PAD]);
    expect(radialHopStops(START_PAD, far.id)).toHaveLength(1);
    expect(radialHopStops(1, 13).length).toBeLessThanOrEqual(2);
  });

  it("pairs portals as a hidden involution without self-warps", () => {
    expect(PORTAL_PAIRS).toHaveLength(6);
    const seen = new Set<number>();
    for (const [a, b] of PORTAL_PAIRS) {
      expect(a).not.toBe(b);
      expect(portalPartner(a)).toBe(b);
      expect(portalPartner(b)).toBe(a);
      expect(seen.has(a)).toBe(false);
      expect(seen.has(b)).toBe(false);
      seen.add(a);
      seen.add(b);
    }
    expect(portalPartner(START_PAD)).toBeUndefined();
    expect(RADIAL_PADS.filter((p) => p.portal)).toHaveLength(12);
  });

  it("grants one hop credit per first small lesson, not a whole unit or replay", () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    expect(smallLessonsCompleted({})).toBe(0);
    expect(smallLessonsCompleted({ "u1-leftover": leftover })).toBe(1);
    expect(smallLessonsCompleted({ "u1-leftover": leftover, "u1-friends": leftover })).toBe(2);
    expect(smallLessonsCompleted({ welcome: leftover, "daily:u1": leftover, "g4-u1-place": leftover })).toBe(0);
    expect(hopLessonsCompleted({ welcome: leftover, "g4-u1-place": leftover })).toBe(0);
    expect(hopLessonsCompleted({ "daily:u1": leftover })).toBe(1);
    expect(hopLessonsCompleted({ "u1-leftover": leftover, "daily:u1": leftover })).toBe(2);
    expect(
      hopLessonsCompleted(
        { welcome: leftover },
        { "2026-09-10": { date: "2026-09-10", unitId: "u2", schoolDay: 1, correct: 8, total: 8, fresh: 8, review: 0, completed: true } },
      ),
    ).toBe(1);
    expect(hopCreditsOf({ "u1-leftover": leftover }, 0)).toBe(1);
    expect(hopCreditsOf({ "daily:u1": leftover }, 0)).toBe(1);
    expect(hopCreditsOf({ "u1-leftover": leftover }, 1)).toBe(0);
    expect(hopCreditsOf({ "u1-leftover": leftover, "u1-friends": leftover }, 1)).toBe(1);
    const replayed = { ...leftover, plays: 4 };
    const walk = {
      date: "2026-09-10",
      unitId: "u1",
      schoolDay: 1,
      correct: 8,
      total: 8,
      fresh: 8,
      review: 0,
      completed: true,
    };
    expect(hopLessonsCompleted({ "u1-leftover": replayed })).toBe(1);
    expect(hopCreditsOf({ "u1-leftover": replayed }, 0)).toBe(1);
    expect(hopLessonsCompleted({ "daily:u1": leftover }, { "2026-09-10": walk })).toBe(1);
    expect(
      hopCreditsOf({ "daily:u1": leftover }, 0, {
        "2026-09-10": walk,
        "2026-09-10-again": { ...walk, date: "2026-09-10" },
      }),
    ).toBe(1);
    const dated = dailyWalkActivityId("2026-09-10");
    expect(dated).toBe("daily:2026-09-10");
    expect(hopLessonsCompleted({ [dated]: leftover }, { "2026-09-10": walk })).toBe(1);
    expect(hopLessonsCompleted({ [dated]: replayed }, { "2026-09-10": walk })).toBe(1);
    expect(
      hopLessonsCompleted(
        { "daily:u12": leftover, "daily:u13": leftover },
        { "2026-09-10": { ...walk, unitId: "u13" } },
      ),
    ).toBe(1);
    expect(
      hopLessonsCompleted(
        { [dated]: leftover, "daily:u13": leftover, "u1-leftover": leftover },
        { "2026-09-10": { ...walk, unitId: "u13" } },
      ),
    ).toBe(2);
  });

  it("does not invent spent hops, and refunds a burned pre-v12 Guest ledger", () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    const done = { "u1-leftover": leftover, "u1-friends": leftover };
    expect(migratePathHopSpent({ activities: done, pathHopSpent: undefined, pathHopperAt: 0, saveVersion: 9 })).toBe(0);
    expect(hopCreditsOf(done, 0)).toBe(2);
    expect(
      migratePathHopSpent({ activities: done, pathHopSpent: 2, pathHopperAt: 0, saveVersion: 10 }),
    ).toBe(0);
    expect(
      migratePathHopSpent({ activities: done, pathHopSpent: 2, pathHopperAt: 1, saveVersion: 10 }),
    ).toBe(0);
    expect(
      migratePathHopSpent({ activities: done, pathHopSpent: 2, pathHopperAt: 8, saveVersion: 10 }),
    ).toBe(1);
    expect(
      migratePathHopSpent({ activities: done, pathHopSpent: 1, pathHopperAt: 4, saveVersion: 10 }),
    ).toBe(1);
    expect(
      migratePathHopSpent({ activities: done, pathHopSpent: 2, pathHopperAt: 1, saveVersion: 11 }),
    ).toBe(0);
    expect(
      migratePathHopSpent({ activities: done, pathHopSpent: 1, pathHopperAt: 4, saveVersion: 11 }),
    ).toBe(1);
    expect(
      migratePathHopSpent({ activities: done, pathHopSpent: 2, pathHopperAt: 1, saveVersion: 12 }),
    ).toBe(2);
    expect(
      migratePathHopSpent({ activities: done, pathHopSpent: 2, pathHopperAt: 1, saveVersion: 13 }),
    ).toBe(2);
  });

  it("rolls a 1–3 die and only starts a turn from banked rolls", () => {
    expect(clampDieFace(0)).toBe(1);
    expect(clampDieFace(2)).toBe(2);
    expect(clampDieFace(9)).toBe(3);
    expect(rollDieFace(() => 0)).toBe(1);
    expect(rollDieFace(() => 0.34)).toBe(2);
    expect(rollDieFace(() => 0.99)).toBe(3);
    expect(canStartDiceTurn(1, 0)).toBe(true);
    expect(canStartDiceTurn(2, 3)).toBe(false);
    expect(canStartDiceTurn(0, 0)).toBe(false);
    expect(activePathStepsLeft(0, 2)).toBe(0);
    expect(activePathStepsLeft(1, 2)).toBe(2);
    expect(canStartDiceTurn(1, activePathStepsLeft(0, 2))).toBe(true);
    expect(clampPathStepsLeft(2)).toBe(2);
    expect(clampPathStepsLeft(8)).toBe(3);
    expect(clampPathStepsLeft(-1)).toBe(0);
    expect(migratePathStepsLeft({ pathStepsLeft: 2, saveVersion: 12 })).toBe(0);
    expect(migratePathStepsLeft({ pathStepsLeft: 2, saveVersion: 13 })).toBe(2);
    expect(migratePathStepsLeft({ pathStepsLeft: undefined, saveVersion: 13 })).toBe(0);
  });

  it("refunds a farmed extra daily roll and clears leftover steps", () => {
    const leftover = { plays: 1, best: 8, last: 8, stars: 3, misses: [] };
    const farmed = { "daily:u12": leftover, "daily:u13": leftover };
    expect(
      migrateDiceTurnState({
        activities: farmed,
        pathHopSpent: 1,
        pathStepsLeft: 2,
        saveVersion: 13,
      }),
    ).toEqual({ pathHopSpent: 0, pathStepsLeft: 0 });
    expect(
      migrateDiceTurnState({
        activities: { "daily:2026-09-11": leftover },
        pathHopSpent: 0,
        pathStepsLeft: 2,
        saveVersion: 13,
      }),
    ).toEqual({ pathHopSpent: 0, pathStepsLeft: 0 });
    expect(
      migrateDiceTurnState({
        activities: { "u1-leftover": leftover },
        pathHopSpent: 1,
        pathStepsLeft: 2,
        saveVersion: 13,
      }),
    ).toEqual({ pathHopSpent: 1, pathStepsLeft: 2 });
    expect(
      migrateDiceTurnState({
        activities: farmed,
        pathHopSpent: 0,
        pathStepsLeft: 0,
        saveVersion: 14,
      }),
    ).toEqual({ pathHopSpent: 0, pathStepsLeft: 0 });
  });
});

describe("radial hop hit testing", () => {
  const board = DESK_MAP_BOARD;
  const plaza = adjacentPadIds(START_PAD);
  const a = plaza[0]!;
  const b = plaza[1]!;

  function tapPad(id: number) {
    const p = padClientPos(id, board);
    return nearestHopTarget(p.x, p.y, board, plaza, START_PAD);
  }

  function toward(fromId: number, toId: number, t: number) {
    const from = padClientPos(fromId, board);
    const to = padClientPos(toId, board);
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  }

  it("cover-fills the 390 phone column and keeps the desk island whole", () => {
    const pa = padClientPos(a, board);
    const pb = padClientPos(b, board);
    const gap = Math.hypot(pb.x - pa.x, pb.y - pa.y);
    expect(PHONE_MAP_VIEW.width).toBe(368);
    expect(PHONE_MAP_VIEW.height).toBe(510);
    expect(PHONE_MAP_BOARD.height).toBe(510);
    expect(PHONE_MAP_BOARD.width).toBeGreaterThan(PHONE_MAP_VIEW.width);
    expect(DESK_MAP_VIEW.height).toBeCloseTo((368 * 5) / 8);
    expect(DESK_MAP_BOARD.height).toBeGreaterThan(207);
    expect(DESK_MAP_BOARD.height).toBeLessThan(280);
    const crop = (DESK_MAP_BOARD.width - DESK_MAP_VIEW.width) / 2;
    const visibleMin = (crop / DESK_MAP_BOARD.width) * 100;
    const visibleMax = ((crop + DESK_MAP_VIEW.width) / DESK_MAP_BOARD.width) * 100;
    const outer = RADIAL_PADS.filter((p) => p.portal && p.ring === 4);
    expect(outer.length).toBeGreaterThan(0);
    for (const p of outer) {
      expect(p.map.x).toBeGreaterThan(visibleMin + 2);
      expect(p.map.x).toBeLessThan(visibleMax - 2);
    }
    expect(HOP_SNAP_MIN_PX).toBe(16);
    expect(HOP_SNAP_PX).toBe(22);
    expect(hopSnapPx(board)).toBe(22);
    expect(hopSnapPx(PHONE_MAP_BOARD)).toBeGreaterThan(HOP_SNAP_PX);
    expect(gap).toBeGreaterThan(14);
    expect(gap).toBeLessThan(48);
    expect(gap).toBeLessThan(HOP_SNAP_PX * 2);
  });

  it("keeps the hopper and each hop glow inside one plaza tile", () => {
    const gap = minAdjacentGapPx(START_PAD, board);
    const hopper = hopperBoardPx(board);
    const glow = hopGlowBoardPx(board);
    expect(HOPPER_SIT_TRANSLATE).toBe("translate(-50%, -50%)");
    expect(HOPPER_ART_ZOOM_PCT).toBeGreaterThan(100);
    expect(hopper).toBeGreaterThan(12);
    expect(hopper).toBeLessThan(gap);
    expect(glow).toBeGreaterThan(8);
    expect(glow).toBeLessThan(hopper);
    expect(glow + 5).toBeLessThan(gap);
    expect(HOPPER_BOARD_WIDTH_PCT).toBe(3.2);
    expect(HOP_GLOW_BOARD_WIDTH_PCT).toBe(2.2);
    expect(adjacentPadIds(START_PAD)).toHaveLength(8);
    const phoneGap = minAdjacentGapPx(START_PAD, PHONE_MAP_BOARD);
    expect(hopperBoardPx(PHONE_MAP_BOARD)).toBeLessThan(phoneGap);
    expect(hopGlowBoardPx(PHONE_MAP_BOARD) + 5).toBeLessThan(phoneGap);
  });

  it("still snaps hops on the taller cover-fill phone board", () => {
    const phone = PHONE_MAP_BOARD;
    const snap = hopSnapPx(phone);
    const glow = padClientPos(a, phone);
    expect(nearestHopTarget(glow.x, glow.y, phone, plaza, START_PAD, snap)).toBe(a);
    expect(nearestHopTarget(glow.x, glow.y, phone, plaza, START_PAD, snap)).not.toBe(START_PAD);
    expect(hopperBoardPx(phone)).toBeLessThan(minAdjacentGapPx(START_PAD, phone));
  });

  it("snaps a comfort tap beside a glow, and ignores far dim pads", () => {
    expect(hopSnapPx(board)).toBe(HOP_SNAP_PX);
    expect(hopSnapPx({ ...board, width: board.width / 2, height: board.height / 2 })).toBe(HOP_SNAP_MIN_PX);
    const here = padClientPos(START_PAD, board);
    const glow = padClientPos(a, board);
    const dx = glow.x - here.x;
    const dy = glow.y - here.y;
    const len = Math.hypot(dx, dy);
    expect(len).toBeGreaterThan(0);
    const along = (px: number) => ({ x: glow.x + (dx / len) * px, y: glow.y + (dy / len) * px });
    expect(nearestHopTarget(along(14).x, along(14).y, board, plaza, START_PAD)).toBe(a);
    expect(nearestHopTarget(along(22).x, along(22).y, board, plaza, START_PAD)).toBe(a);
    expect(nearestHopTarget(along(36).x, along(36).y, board, plaza, START_PAD)).toBeUndefined();
    const far = RADIAL_PADS.find((p) => p.ring === 4 && !plaza.includes(p.id))!;
    const q = padClientPos(far.id, board);
    expect(nearestHopTarget(q.x, q.y, board, plaza, START_PAD)).toBeUndefined();
  });

  it("lands a tap on the closest glowing pad, not the overlapping neighbor", () => {
    expect(tapPad(a)).toBe(a);
    const nearA = toward(a, b, 0.2);
    expect(nearestHopTarget(nearA.x, nearA.y, board, plaza, START_PAD)).toBe(a);
    const nearB = toward(a, b, 0.8);
    expect(nearestHopTarget(nearB.x, nearB.y, board, plaza, START_PAD)).toBe(b);
    const mid = toward(a, b, 0.5);
    const hit = nearestHopTarget(mid.x, mid.y, board, plaza, START_PAD);
    expect(hit === a || hit === b).toBe(true);
    expect([a, b].filter((id) => id === hit)).toHaveLength(1);
  });

  it("does not hop when the tap is on the current pad or far from every glow", () => {
    expect(tapPad(START_PAD)).toBeUndefined();
    expect(nearestHopTarget(0, 0, board, plaza, START_PAD)).toBeUndefined();
    const far = RADIAL_PADS.find((p) => p.ring === 4 && !plaza.includes(p.id))!;
    expect(tapPad(far.id)).toBeUndefined();
  });

  it("never selects a quiet pad, and still warps from an adjacent portal", () => {
    const portal = RADIAL_PADS.find((p) => p.portal)!;
    const neighbor = adjacentPadIds(portal.id)[0]!;
    const choices = adjacentPadIds(neighbor);
    expect(choices).toContain(portal.id);
    const p = padClientPos(portal.id, board);
    expect(nearestHopTarget(p.x, p.y, board, choices, neighbor)).toBe(portal.id);
    const here = padClientPos(neighbor, board);
    const quiet = RADIAL_PADS.filter((pad) => !choices.includes(pad.id) && pad.id !== neighbor).sort((left, right) => {
      const ql = padClientPos(left.id, board);
      const qr = padClientPos(right.id, board);
      return Math.hypot(qr.x - here.x, qr.y - here.y) - Math.hypot(ql.x - here.x, ql.y - here.y);
    })[0]!;
    const q = padClientPos(quiet.id, board);
    expect(nearestHopTarget(q.x, q.y, board, choices, neighbor)).toBeUndefined();
    expect(nearestHopTarget(p.x, p.y, board, choices, neighbor)).not.toBe(quiet.id);
  });
});

describe("radial hop direction pad", () => {
  it("aims plaza hops along painted spokes, with cardinals when that path exists", () => {
    const dirs = hopDirs(START_PAD);
    expect(dirs).toHaveLength(8);
    expect(new Set(dirs.map((d) => d.id)).size).toBe(8);
    const cardinals = dirs.filter((d) => d.cardinal).map((d) => d.cardinal);
    expect(cardinals).toContain("up");
    expect(cardinals).toContain("down");
    const up = dirs.find((d) => d.cardinal === "up")!;
    expect(Math.abs(up.bearing) < 20 || Math.abs(up.bearing - 360) < 20).toBe(true);
  });

  it("places angled buttons on the actual neighbor bearing, not a 45° grid", () => {
    const north = hopDirs(START_PAD).find((d) => d.cardinal === "up")!;
    const dirs = hopDirs(north.id);
    expect(dirs.length).toBeGreaterThanOrEqual(2);
    const inward = dirs.find((d) => d.id === START_PAD);
    expect(inward?.cardinal).toBe("down");
    expect(inward && Math.abs(inward.bearing - 180)).toBeLessThan(20);
    const along = dirs.filter((d) => d.id !== START_PAD && d.cardinal == null);
    for (const d of along) {
      const snapped = [0, 45, 90, 135, 180, 225, 270, 315].some((a) => Math.abs(d.bearing - a) < 2 || Math.abs(d.bearing - a - 360) < 2);
      expect(snapped).toBe(false);
    }
  });

  it("picks the nearest visible direction and ignores the squishee face", () => {
    const dirs = hopDirs(START_PAD);
    const up = dirs.find((d) => d.cardinal === "up")!;
    expect(nearestHopDir(100, 100, 100, 100 - 40, dirs)).toBe(up.id);
    expect(nearestHopDir(100, 100, 100, 100, dirs)).toBeUndefined();
    expect(nearestHopDir(100, 100, 400, 100, dirs)).toBeUndefined();
    const right = dirs.find((d) => d.cardinal === "right")!;
    expect(nearestHopDir(100, 100, 100 + 40, 100, dirs)).toBe(right.id);
    expect(HOP_DIR_SNAP_DEG).toBe(32);
  });
});
