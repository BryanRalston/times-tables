import { describe, expect, it } from "vitest";
import {
  freshComputeTap,
  placeAvail,
  placePartsOf,
  smallerComputeSide,
  tapComputePiece,
} from "./compute-model";

describe("compute why-move", () => {
  it("reads hundreds, tens, and ones", () => {
    expect(placePartsOf(523)).toEqual({ h: 5, t: 2, o: 3 });
    expect(placePartsOf(40)).toEqual({ h: 0, t: 4, o: 0 });
  });

  it("treats the smaller number as the tappable side", () => {
    expect(smallerComputeSide(523, 241)).toBe("right");
    expect(smallerComputeSide(120, 400)).toBe("left");
    expect(smallerComputeSide(200, 200)).toBe("right");
  });

  it("subtract cancel dims a matching piece on both sides", () => {
    let state = freshComputeTap(523, 241);
    const next = tapComputePiece("−", state, "right", "h", 523, 241);
    expect(next).toBeTruthy();
    state = next!;
    expect(state.leftGone.h).toBe(1);
    expect(state.rightGone.h).toBe(1);
    expect(placeAvail(state.left, state.leftGone, "h")).toBe(4);
    expect(placeAvail(state.right, state.rightGone, "h")).toBe(1);
  });

  it("subtract regroups a hundred when tens on the larger side run out", () => {
    let state = freshComputeTap(523, 241);
    state = tapComputePiece("−", state, "right", "t", 523, 241)!;
    state = tapComputePiece("−", state, "right", "t", 523, 241)!;
    expect(state.left.t).toBe(2);
    const third = tapComputePiece("−", state, "right", "t", 523, 241);
    expect(third).toBeTruthy();
    expect(third!.left.h).toBe(4);
    expect(third!.left.t).toBe(12);
    expect(third!.leftGone.t).toBe(3);
    expect(third!.rightGone.t).toBe(3);
  });

  it("add moves a smaller-side piece onto the larger side", () => {
    const start = freshComputeTap(120, 43);
    const next = tapComputePiece("+", start, "right", "t", 120, 43);
    expect(next).toBeTruthy();
    expect(next!.left.t).toBe(3);
    expect(next!.rightGone.t).toBe(1);
    expect(placeAvail(next!.right, next!.rightGone, "t")).toBe(3);
  });

  it("ignores taps on the larger side and spent pieces", () => {
    const start = freshComputeTap(80, 25);
    expect(tapComputePiece("−", start, "left", "t", 80, 25)).toBeNull();
    let state = start;
    for (let i = 0; i < 2; i++) state = tapComputePiece("−", state, "right", "t", 80, 25)!;
    expect(tapComputePiece("−", state, "right", "t", 80, 25)).toBeNull();
  });
});
