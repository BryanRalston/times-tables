export type PlaceKind = "h" | "t" | "o";

export type PlaceParts = {
  h: number;
  t: number;
  o: number;
};

export type ComputeTapState = {
  left: PlaceParts;
  right: PlaceParts;
  leftGone: PlaceParts;
  rightGone: PlaceParts;
};

export function placePartsOf(n: number): PlaceParts {
  const x = Math.max(0, Math.floor(Math.abs(n)));
  return {
    h: Math.floor(x / 100),
    t: Math.floor((x % 100) / 10),
    o: x % 10,
  };
}

export function zeroParts(): PlaceParts {
  return { h: 0, t: 0, o: 0 };
}

export function freshComputeTap(a: number, b: number): ComputeTapState {
  return {
    left: placePartsOf(a),
    right: placePartsOf(b),
    leftGone: zeroParts(),
    rightGone: zeroParts(),
  };
}

export function placeAvail(parts: PlaceParts, gone: PlaceParts, place: PlaceKind): number {
  return Math.max(0, parts[place] - gone[place]);
}

/** The smaller addend/subtrahend is the only tappable side. */
export function smallerComputeSide(a: number, b: number): "left" | "right" {
  return a >= b ? "right" : "left";
}

function regroupLarger(parts: PlaceParts, gone: PlaceParts, place: PlaceKind): PlaceParts | null {
  if (placeAvail(parts, gone, place) > 0) return parts;
  const next = { ...parts };
  switch (place) {
    case "h":
      return null;
    case "t":
      if (placeAvail(next, gone, "h") <= 0) return null;
      next.h -= 1;
      next.t += 10;
      return next;
    case "o":
      if (placeAvail(next, gone, "t") <= 0) {
        if (placeAvail(next, gone, "h") <= 0) return null;
        next.h -= 1;
        next.t += 10;
      }
      if (placeAvail(next, gone, "t") <= 0) return null;
      next.t -= 1;
      next.o += 10;
      return next;
    default: {
      const _never: never = place;
      return _never;
    }
  }
}

/**
 * Subtraction: tap a smaller-side piece to dim a matching piece on both sides
 * (regroup the larger side when a place is short).
 * Addition: tap a smaller-side piece to move it onto the larger side.
 */
export function tapComputePiece(
  op: "+" | "−",
  state: ComputeTapState,
  tapSide: "left" | "right",
  place: PlaceKind,
  a: number,
  b: number,
): ComputeTapState | null {
  const small = smallerComputeSide(a, b);
  if (tapSide !== small) return null;
  const smallParts = tapSide === "left" ? state.left : state.right;
  const smallGone = tapSide === "left" ? state.leftGone : state.rightGone;
  if (placeAvail(smallParts, smallGone, place) <= 0) return null;

  const next: ComputeTapState = {
    left: { ...state.left },
    right: { ...state.right },
    leftGone: { ...state.leftGone },
    rightGone: { ...state.rightGone },
  };
  const bumpGone = (side: "left" | "right", kind: PlaceKind) => {
    if (side === "left") next.leftGone = { ...next.leftGone, [kind]: next.leftGone[kind] + 1 };
    else next.rightGone = { ...next.rightGone, [kind]: next.rightGone[kind] + 1 };
  };

  switch (op) {
    case "+": {
      const largeSide = small === "left" ? "right" : "left";
      bumpGone(tapSide, place);
      if (largeSide === "left") next.left = { ...next.left, [place]: next.left[place] + 1 };
      else next.right = { ...next.right, [place]: next.right[place] + 1 };
      return next;
    }
    case "−": {
      const largeSide = small === "left" ? "right" : "left";
      if (largeSide === "left") {
        const regrouped = regroupLarger(next.left, next.leftGone, place);
        if (!regrouped) return null;
        next.left = regrouped;
      } else {
        const regrouped = regroupLarger(next.right, next.rightGone, place);
        if (!regrouped) return null;
        next.right = regrouped;
      }
      bumpGone(largeSide, place);
      bumpGone(tapSide, place);
      return next;
    }
    default: {
      const _never: never = op;
      return _never;
    }
  }
}
