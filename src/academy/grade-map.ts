import type { Grade } from "./model";

export type GradeOffer = "play" | "intro" | "later";

/**
 * Core levels for one grade. Adaptive play may step one level outside this
 * list. `cap` stops that step when the next level leaves the grade's standards.
 * Challenge ahead opens every higher level.
 */
export interface GradeBand {
  levels: readonly string[];
  start: string;
  offer: GradeOffer;
  cap?: string;
  standards: readonly string[];
}

export interface LevelWindow {
  offer: GradeOffer;
  min: number;
  max: number;
  start: string;
  ids: readonly string[];
}

/** 3.NF denominators. Fifths, tenths, and smaller parts wait. */
export const FRACTION_DENOMINATORS = [2, 3, 4, 6, 8] as const;

function band(row: GradeBand): GradeBand {
  return row;
}

/**
 * Pre-K through grade 4. Level ids match each game module.
 * Standards are Common Core cluster codes. Sight words follow Dolch, with
 * Fry words folded into the grade 2 and grade 3 lists. Grade 4 vocabulary
 * is its own list.
 */
export const GRADE_BANDS: Record<string, Record<Grade, GradeBand>> = {
  times: {
    PK: band({
      levels: ["count"],
      start: "count",
      offer: "later",
      standards: ["K.CC.A.1"],
    }),
    K: band({
      levels: ["count"],
      start: "count",
      offer: "later",
      standards: ["K.CC.A.1"],
    }),
    "1": band({
      levels: ["count"],
      start: "count",
      offer: "intro",
      standards: ["1.OA.C.5", "2.OA.C.4"],
    }),
    "2": band({
      levels: ["count", "twos"],
      start: "twos",
      offer: "play",
      standards: ["2.OA.C.4", "2.NBT.A.2"],
    }),
    "3": band({
      levels: ["mix", "toTen"],
      start: "toTen",
      offer: "play",
      cap: "toTen",
      standards: ["3.OA.A.1", "3.OA.C.7"],
    }),
    "4": band({
      levels: ["factors", "multi", "divide"],
      start: "factors",
      offer: "play",
      standards: ["4.OA.B.4", "4.NBT.B.5", "4.NBT.B.6"],
    }),
  },
  add: {
    PK: band({
      levels: ["within5"],
      start: "within5",
      offer: "later",
      standards: ["K.OA.A.2"],
    }),
    K: band({
      levels: ["within5", "within10"],
      start: "within5",
      offer: "play",
      standards: ["K.OA.A.2", "K.OA.A.5"],
    }),
    "1": band({
      levels: ["within10", "within20"],
      start: "within10",
      offer: "play",
      standards: ["1.OA.C.6", "1.NBT.C.4"],
    }),
    "2": band({
      levels: ["within20", "tens", "within100"],
      start: "within20",
      offer: "play",
      standards: ["2.OA.B.2", "2.NBT.B.5"],
    }),
    "3": band({
      levels: ["tens", "within100"],
      start: "within100",
      offer: "play",
      standards: ["3.NBT.A.2"],
    }),
    "4": band({
      levels: ["within1000", "thousands"],
      start: "within1000",
      offer: "play",
      standards: ["4.NBT.B.4"],
    }),
  },
  time: {
    PK: band({
      levels: ["hour"],
      start: "hour",
      offer: "later",
      standards: ["1.MD.B.3"],
    }),
    K: band({
      levels: ["hour"],
      start: "hour",
      offer: "intro",
      standards: ["1.MD.B.3"],
    }),
    "1": band({
      levels: ["hour", "half"],
      start: "half",
      offer: "play",
      standards: ["1.MD.B.3"],
    }),
    "2": band({
      levels: ["quarter", "fives"],
      start: "quarter",
      offer: "play",
      standards: ["2.MD.C.7"],
    }),
    "3": band({
      levels: ["quarter", "fives"],
      start: "fives",
      offer: "play",
      cap: "fives",
      standards: ["2.MD.C.7", "3.MD.A.1"],
    }),
    "4": band({
      levels: ["elapsed"],
      start: "elapsed",
      offer: "play",
      standards: ["4.MD.A.2"],
    }),
  },
  money: {
    PK: band({
      levels: ["name"],
      start: "name",
      offer: "intro",
      standards: ["2.MD.C.8"],
    }),
    K: band({
      levels: ["name"],
      start: "name",
      offer: "intro",
      standards: ["2.MD.C.8"],
    }),
    "1": band({
      levels: ["name", "count"],
      start: "count",
      offer: "play",
      standards: ["2.MD.C.8"],
    }),
    "2": band({
      levels: ["make", "change", "dollars"],
      start: "make",
      offer: "play",
      cap: "dollars",
      standards: ["2.MD.C.8"],
    }),
    "3": band({
      levels: ["change", "dollars"],
      start: "dollars",
      offer: "play",
      cap: "dollars",
      standards: ["2.MD.C.8"],
    }),
    "4": band({
      levels: ["spend"],
      start: "spend",
      offer: "play",
      standards: ["4.MD.A.2"],
    }),
  },
  sight: {
    PK: band({
      levels: ["preprimer"],
      start: "preprimer",
      offer: "later",
      standards: ["RF.K.3.C"],
    }),
    K: band({
      levels: ["preprimer", "primer"],
      start: "preprimer",
      offer: "play",
      cap: "primer",
      standards: ["RF.K.3.C"],
    }),
    "1": band({
      levels: ["primer", "first"],
      start: "primer",
      offer: "play",
      cap: "first",
      standards: ["RF.1.3.G"],
    }),
    "2": band({
      levels: ["first", "second"],
      start: "second",
      offer: "play",
      standards: ["RF.2.3.F"],
    }),
    "3": band({
      levels: ["second", "third"],
      start: "third",
      offer: "play",
      cap: "third",
      standards: ["RF.3.3.D"],
    }),
    "4": band({
      levels: ["fourth"],
      start: "fourth",
      offer: "play",
      standards: ["RF.4.3.A", "L.4.4", "L.4.6"],
    }),
  },
  spelling: {
    PK: band({
      levels: ["cvc"],
      start: "cvc",
      offer: "later",
      standards: ["RF.K.3.A"],
    }),
    K: band({
      levels: ["cvc"],
      start: "cvc",
      offer: "play",
      standards: ["RF.K.3.A"],
    }),
    "1": band({
      levels: ["cvc", "digraphs", "blends", "long"],
      start: "digraphs",
      offer: "play",
      cap: "long",
      standards: ["RF.1.3.A", "RF.1.3.B", "RF.1.3.C"],
    }),
    "2": band({
      levels: ["blends", "long", "patterns"],
      start: "long",
      offer: "play",
      standards: ["RF.2.3.A", "RF.2.3.B", "RF.2.3.F"],
    }),
    "3": band({
      levels: ["long", "patterns"],
      start: "patterns",
      offer: "play",
      cap: "patterns",
      standards: ["RF.3.3.A", "RF.3.3.C"],
    }),
    "4": band({
      levels: ["grade4"],
      start: "grade4",
      offer: "play",
      standards: ["RF.4.3.A", "L.4.2"],
    }),
  },
  count: {
    PK: band({
      levels: ["objects"],
      start: "objects",
      offer: "play",
      cap: "objects",
      standards: ["K.CC.A.1", "K.CC.B.4", "K.CC.B.5"],
    }),
    K: band({
      levels: ["objects", "to20", "compare"],
      start: "objects",
      offer: "play",
      standards: ["K.CC.A.2", "K.CC.B.4", "K.CC.B.5", "K.CC.C.6"],
    }),
    "1": band({
      levels: ["to20", "compare", "neighbor"],
      start: "to20",
      offer: "play",
      standards: ["1.NBT.A.1", "1.NBT.B.3"],
    }),
    "2": band({
      levels: ["tenframe", "build"],
      start: "tenframe",
      offer: "play",
      standards: ["2.NBT.A.1"],
    }),
    "3": band({
      levels: ["neighbor"],
      start: "neighbor",
      offer: "play",
      standards: ["1.NBT.A.1"],
    }),
    "4": band({
      levels: ["neighbor"],
      start: "neighbor",
      offer: "play",
      standards: ["4.NBT.A.2"],
    }),
  },
  place: {
    PK: band({
      levels: ["blocks"],
      start: "blocks",
      offer: "later",
      standards: ["1.NBT.B.2"],
    }),
    K: band({
      levels: ["blocks"],
      start: "blocks",
      offer: "later",
      standards: ["1.NBT.B.2"],
    }),
    "1": band({
      levels: ["blocks"],
      start: "blocks",
      offer: "play",
      cap: "blocks",
      standards: ["1.NBT.B.2"],
    }),
    "2": band({
      levels: ["expanded", "compare"],
      start: "expanded",
      offer: "play",
      cap: "compare",
      standards: ["2.NBT.A.1", "2.NBT.A.3", "2.NBT.A.4"],
    }),
    "3": band({
      levels: ["round10", "round100"],
      start: "round10",
      offer: "play",
      standards: ["3.NBT.A.1"],
    }),
    "4": band({
      levels: ["big", "roundBig"],
      start: "big",
      offer: "play",
      standards: ["4.NBT.A.1", "4.NBT.A.2", "4.NBT.A.3"],
    }),
  },
  shapes: {
    PK: band({
      levels: ["color", "match", "pattern", "flat"],
      start: "color",
      offer: "play",
      cap: "flat",
      standards: ["K.G.A.1", "K.G.A.2", "K.MD.A.2"],
    }),
    K: band({
      levels: ["flat", "solid", "position", "sort"],
      start: "flat",
      offer: "play",
      cap: "sort",
      standards: ["K.G.A.1", "K.G.A.2", "K.G.B.4"],
    }),
    "1": band({
      levels: ["traits", "compose", "sides"],
      start: "traits",
      offer: "play",
      cap: "sides",
      standards: ["1.G.A.1", "1.G.A.2"],
    }),
    "2": band({
      levels: ["faces", "rows", "symmetry"],
      start: "faces",
      offer: "play",
      cap: "symmetry",
      standards: ["2.G.A.1", "2.G.A.2"],
    }),
    "3": band({
      levels: ["quads", "share", "parts", "cover"],
      start: "quads",
      offer: "play",
      cap: "cover",
      standards: ["3.G.A.1", "3.G.A.2", "3.MD.C.5", "3.MD.C.7"],
    }),
    "4": band({
      levels: ["fold", "angles"],
      start: "angles",
      offer: "play",
      standards: ["4.G.A.1", "4.G.A.3", "4.MD.C.5"],
    }),
  },
  fractions: {
    PK: band({
      levels: ["parts"],
      start: "parts",
      offer: "later",
      standards: ["1.G.A.3"],
    }),
    K: band({
      levels: ["parts"],
      start: "parts",
      offer: "later",
      standards: ["1.G.A.3"],
    }),
    "1": band({
      levels: ["parts"],
      start: "parts",
      offer: "intro",
      standards: ["1.G.A.3"],
    }),
    "2": band({
      levels: ["unit", "line", "compare"],
      start: "line",
      offer: "play",
      cap: "compare",
      standards: ["2.G.A.3"],
    }),
    "3": band({
      levels: ["equivalent", "shade"],
      start: "equivalent",
      offer: "play",
      cap: "shade",
      standards: ["3.NF.A.1", "3.NF.A.2", "3.NF.A.3"],
    }),
    "4": band({
      levels: ["addLike", "decimals"],
      start: "addLike",
      offer: "play",
      standards: ["4.NF.A.1", "4.NF.B.3", "4.NF.C.6", "4.NF.C.7"],
    }),
  },
  measure: {
    PK: band({
      levels: ["size"],
      start: "size",
      offer: "play",
      cap: "size",
      standards: ["K.MD.A.1", "K.MD.A.2"],
    }),
    K: band({
      levels: ["compare"],
      start: "compare",
      offer: "play",
      cap: "compare",
      standards: ["K.MD.A.1", "K.MD.A.2"],
    }),
    "1": band({
      levels: ["picture", "bar"],
      start: "picture",
      offer: "play",
      cap: "bar",
      standards: ["1.MD.C.4"],
    }),
    "2": band({
      levels: ["ruler"],
      start: "ruler",
      offer: "play",
      standards: ["2.MD.A.1"],
    }),
    "3": band({
      levels: ["bar", "more"],
      start: "bar",
      offer: "play",
      cap: "more",
      standards: ["3.MD.B.3"],
    }),
    "4": band({
      levels: ["area", "perimeter"],
      start: "area",
      offer: "play",
      standards: ["4.MD.A.3"],
    }),
  },
  graphs: {
    PK: band({
      levels: ["sort"],
      start: "sort",
      offer: "play",
      cap: "sort",
      standards: ["K.MD.B.3"],
    }),
    K: band({
      levels: ["sort"],
      start: "sort",
      offer: "play",
      cap: "sort",
      standards: ["K.MD.B.3"],
    }),
    "1": band({
      levels: ["tally"],
      start: "tally",
      offer: "play",
      cap: "tally",
      standards: ["1.MD.C.4"],
    }),
    "2": band({
      levels: ["picture", "bar"],
      start: "picture",
      offer: "play",
      cap: "bar",
      standards: ["2.MD.D.10"],
    }),
    "3": band({
      levels: ["scale"],
      start: "scale",
      offer: "play",
      cap: "scale",
      standards: ["3.MD.B.3"],
    }),
    "4": band({
      levels: ["line"],
      start: "line",
      offer: "play",
      standards: ["4.MD.B.4"],
    }),
  },
  phonics: {
    PK: band({
      levels: ["letters", "sounds"],
      start: "letters",
      offer: "play",
      cap: "sounds",
      standards: ["RF.K.1.D", "RF.K.2.D"],
    }),
    K: band({
      levels: ["sounds", "begin"],
      start: "sounds",
      offer: "play",
      cap: "begin",
      standards: ["RF.K.2.A", "RF.K.3.A"],
    }),
    "1": band({
      levels: ["begin"],
      start: "begin",
      offer: "play",
      cap: "begin",
      standards: ["RF.1.2.B", "RF.1.2.C"],
    }),
    "2": band({
      levels: ["rhyme", "cvc"],
      start: "cvc",
      offer: "play",
      cap: "cvc",
      standards: ["RF.2.3.A", "RF.2.3.B"],
    }),
    "3": band({
      levels: ["cvc", "end"],
      start: "cvc",
      offer: "play",
      standards: ["RF.3.3.A", "RF.3.3.C"],
    }),
    "4": band({
      levels: ["cvc", "end"],
      start: "end",
      offer: "play",
      standards: ["RF.4.3.A"],
    }),
  },
  problems: {
    PK: band({
      levels: ["add"],
      start: "add",
      offer: "later",
      standards: ["K.OA.A.2"],
    }),
    K: band({
      levels: ["add"],
      start: "add",
      offer: "play",
      cap: "add",
      standards: ["K.OA.A.2"],
    }),
    "1": band({
      levels: ["add", "sub"],
      start: "add",
      offer: "play",
      cap: "sub",
      standards: ["1.OA.A.1"],
    }),
    "2": band({
      levels: ["sub", "mult"],
      start: "sub",
      offer: "play",
      cap: "mult",
      standards: ["2.OA.A.1"],
    }),
    "3": band({
      levels: ["div", "picture"],
      start: "picture",
      offer: "play",
      cap: "picture",
      standards: ["3.OA.A.3"],
    }),
    "4": band({
      levels: ["steps"],
      start: "steps",
      offer: "play",
      standards: ["4.OA.A.3"],
    }),
  },
  variables: {
    PK: band({
      levels: ["addend"],
      start: "addend",
      offer: "later",
      standards: ["K.OA.A.4"],
    }),
    K: band({
      levels: ["addend"],
      start: "addend",
      offer: "play",
      cap: "addend",
      standards: ["K.OA.A.4"],
    }),
    "1": band({
      levels: ["addend"],
      start: "addend",
      offer: "play",
      cap: "addend",
      standards: ["1.OA.D.8"],
    }),
    "2": band({
      levels: ["either", "factor"],
      start: "either",
      offer: "play",
      cap: "factor",
      standards: ["1.OA.D.8", "2.OA.C.4"],
    }),
    "3": band({
      levels: ["factor", "times"],
      start: "times",
      offer: "play",
      cap: "times",
      standards: ["3.OA.A.4"],
    }),
    "4": band({
      levels: ["steps"],
      start: "steps",
      offer: "play",
      standards: ["4.OA.A.2", "4.OA.A.3"],
    }),
  },
};

export function bandFor(gameId: string, grade: Grade): GradeBand | undefined {
  return GRADE_BANDS[gameId]?.[grade];
}

function indexOf(levelIds: readonly string[], id: string, fallback: number): number {
  const index = levelIds.indexOf(id);
  return index < 0 ? fallback : index;
}

/** Levels a child in this grade may be served. Later games serve nothing. */
export function playWindow(
  levelIds: readonly string[],
  gameId: string,
  grade: Grade,
  challengeAhead: boolean,
): LevelWindow {
  const bandRow = bandFor(gameId, grade);
  const start = bandRow?.start ?? levelIds[0] ?? "";
  if (!bandRow || levelIds.length === 0) {
    return { offer: "play", min: 0, max: Math.max(0, levelIds.length - 1), start, ids: levelIds };
  }
  if (bandRow.offer === "later" && !challengeAhead) {
    return { offer: "later", min: 0, max: -1, start, ids: [] };
  }
  const core = bandRow.levels.map((id) => levelIds.indexOf(id)).filter((index) => index >= 0);
  const lo = core.length > 0 ? Math.min(...core) : indexOf(levelIds, start, 0);
  const hi = core.length > 0 ? Math.max(...core) : lo;
  let min = lo;
  let max = hi;
  if (bandRow.offer === "play") {
    min = Math.max(0, lo - 1);
    max = Math.min(levelIds.length - 1, hi + 1);
    if (bandRow.cap) max = Math.min(max, indexOf(levelIds, bandRow.cap, max));
  }
  if (bandRow.offer === "later" && challengeAhead) {
    min = indexOf(levelIds, start, 0);
    max = levelIds.length - 1;
  }
  if (challengeAhead) max = levelIds.length - 1;
  if (max < min) max = min;
  return {
    offer: bandRow.offer === "later" ? "play" : bandRow.offer,
    min,
    max,
    start,
    ids: levelIds.slice(min, max + 1),
  };
}

export function levelAllowed(
  levelIds: readonly string[],
  gameId: string,
  grade: Grade,
  level: string,
  challengeAhead: boolean,
): boolean {
  return playWindow(levelIds, gameId, grade, challengeAhead).ids.includes(level);
}
