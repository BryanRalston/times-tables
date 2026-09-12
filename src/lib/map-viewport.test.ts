import { describe, expect, it } from "vitest";
import {
  clampMapCamera,
  clampMapScale,
  containMapBoard,
  coverMapBoard,
  MAP_ART_ASPECT,
  MAP_PINCH_MAX,
  MAP_PINCH_MIN,
  pointerDistance,
  REST_MAP_CAMERA,
  zoomMapCamera,
} from "./map-viewport";
import {
  DESK_MAP_BOARD,
  DESK_MAP_VIEW,
  DESKTOP_MAP_BOARD,
  DESKTOP_MAP_VIEW,
  PHONE_MAP_BOARD,
  PHONE_MAP_VIEW,
  TABLET_MAP_BOARD,
  TABLET_MAP_VIEW,
} from "./radial-web";

describe("map viewport", () => {
  it("cover-fills the phone column and overflows east/west", () => {
    expect(MAP_ART_ASPECT).toBeCloseTo(16 / 9);
    expect(PHONE_MAP_VIEW.width).toBe(368);
    expect(PHONE_MAP_VIEW.height).toBe(510);
    expect(PHONE_MAP_VIEW.height).toBeGreaterThan(DESK_MAP_VIEW.height);
    expect(PHONE_MAP_BOARD.height).toBe(PHONE_MAP_VIEW.height);
    expect(PHONE_MAP_BOARD.width).toBeCloseTo(PHONE_MAP_VIEW.height * MAP_ART_ASPECT);
    expect(PHONE_MAP_BOARD.width).toBeGreaterThan(PHONE_MAP_VIEW.width);
    expect(PHONE_MAP_BOARD.left).toBeLessThan(0);
    expect(PHONE_MAP_BOARD.top).toBe(0);
    const board = coverMapBoard(PHONE_MAP_VIEW);
    expect(board.width).toBeCloseTo(PHONE_MAP_BOARD.width);
    expect(board.height).toBe(PHONE_MAP_BOARD.height);
  });

  it("keeps the 8/5 board as the phone snap reference", () => {
    expect(DESK_MAP_VIEW.width).toBe(368);
    expect(DESK_MAP_VIEW.height).toBeCloseTo((368 * 5) / 8);
    expect(DESK_MAP_BOARD.height).toBeCloseTo(DESK_MAP_VIEW.height);
    expect(DESK_MAP_BOARD.width).toBeCloseTo(DESK_MAP_VIEW.height * MAP_ART_ASPECT);
    expect(DESK_MAP_BOARD.width).toBeGreaterThan(DESK_MAP_VIEW.width);
    expect(DESK_MAP_BOARD.height).toBeLessThan(280);
    expect(DESK_MAP_BOARD.height).toBeGreaterThan(207);
  });

  it("contain-fits the grown tablet leftover and height-fills desktop", () => {
    expect(TABLET_MAP_VIEW.width).toBe(736);
    expect(TABLET_MAP_VIEW.height).toBe(620);
    expect(TABLET_MAP_BOARD.width).toBe(TABLET_MAP_VIEW.width);
    expect(TABLET_MAP_BOARD.height).toBeCloseTo(TABLET_MAP_VIEW.width / MAP_ART_ASPECT);
    expect(TABLET_MAP_BOARD.height).toBeLessThan(TABLET_MAP_VIEW.height);
    expect(TABLET_MAP_BOARD.left).toBe(0);
    expect(TABLET_MAP_BOARD.top).toBeGreaterThan(0);
    expect(TABLET_MAP_BOARD.top + TABLET_MAP_BOARD.height).toBeLessThanOrEqual(TABLET_MAP_VIEW.height);
    const tablet = containMapBoard(TABLET_MAP_VIEW);
    expect(tablet.width).toBeCloseTo(TABLET_MAP_BOARD.width);
    expect(tablet.height).toBeCloseTo(TABLET_MAP_BOARD.height);

    expect(DESKTOP_MAP_VIEW.width).toBe(1056);
    expect(DESKTOP_MAP_VIEW.height).toBe(520);
    expect(DESKTOP_MAP_BOARD.height).toBe(DESKTOP_MAP_VIEW.height);
    expect(DESKTOP_MAP_BOARD.width).toBeCloseTo(DESKTOP_MAP_VIEW.height * MAP_ART_ASPECT);
    expect(DESKTOP_MAP_BOARD.width).toBeLessThan(DESKTOP_MAP_VIEW.width);
    expect(DESKTOP_MAP_BOARD.top).toBe(0);
    expect(DESKTOP_MAP_BOARD.left).toBeGreaterThan(0);
    expect(DESKTOP_MAP_BOARD.left + DESKTOP_MAP_BOARD.width).toBeLessThanOrEqual(DESKTOP_MAP_VIEW.width);
  });

  it("clamps pinch-in and keeps the board covering the view", () => {
    expect(clampMapScale(0)).toBe(MAP_PINCH_MIN);
    expect(clampMapScale(9)).toBe(MAP_PINCH_MAX);
    const view = PHONE_MAP_VIEW;
    const board = PHONE_MAP_BOARD;
    const rest = clampMapCamera(REST_MAP_CAMERA, view, board);
    expect(rest.scale).toBe(1);
    expect(rest.y).toBe(0);
    const maxX = (board.width - view.width) / 2;
    expect(rest.x).toBe(0);
    const shoved = clampMapCamera({ scale: 1, x: 4000, y: 4000 }, view, board);
    expect(shoved.x).toBeCloseTo(maxX);
    expect(shoved.y).toBe(0);
    const zoomed = clampMapCamera({ scale: 2, x: 0, y: 0 }, view, board);
    expect(zoomed.scale).toBe(2);
    expect(zoomed.y).toBe(0);
  });

  it("zooms about the pinch focus and reports finger distance", () => {
    const zoomed = zoomMapCamera({ scale: 1, x: 0, y: 0 }, { x: 40, y: -10 }, 2);
    expect(zoomed.scale).toBe(2);
    expect(zoomed.x).toBe(-40);
    expect(zoomed.y).toBe(10);
    expect(pointerDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});
