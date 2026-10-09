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
 * Kindergarten through grade 3. Level ids match each game module.
 * Standards are Common Core cluster codes. Sight words follow Dolch, with
 * Fry words folded into the grade 2 and grade 3 lists.
 */
export const GRADE_BANDS: Record<string, Record<Grade, GradeBand>> = {
  times: {
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
      standards: ["3.OA.A.1", "3.OA.C.7"],
    }),
  },
  add: {
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
  },
  time: {
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
      standards: ["2.MD.C.7", "3.MD.A.1"],
    }),
  },
  money: {
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
      standards: ["2.MD.C.8"],
    }),
    "3": band({
      levels: ["change", "dollars"],
      start: "dollars",
      offer: "play",
      standards: ["2.MD.C.8"],
    }),
  },
  sight: {
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
      standards: ["RF.3.3.D"],
    }),
  },
  spelling: {
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
      standards: ["RF.3.3.A", "RF.3.3.C"],
    }),
  },
  count: {
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
      standards: ["3.NBT.A.1"],
    }),
  },
  place: {
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
      levels: ["expanded", "compare", "round10"],
      start: "expanded",
      offer: "play",
      cap: "round10",
      standards: ["2.NBT.A.1", "2.NBT.A.3", "2.NBT.A.4"],
    }),
    "3": band({
      levels: ["round100", "build"],
      start: "round100",
      offer: "play",
      standards: ["3.NBT.A.1"],
    }),
  },
  shapes: {
    K: band({
      levels: ["flat", "solid"],
      start: "flat",
      offer: "play",
      standards: ["K.G.A.2", "K.G.B.4"],
    }),
    "1": band({
      levels: ["solid", "sides"],
      start: "solid",
      offer: "play",
      standards: ["1.G.A.1"],
    }),
    "2": band({
      levels: ["sides", "symmetry"],
      start: "sides",
      offer: "play",
      standards: ["2.G.A.1"],
    }),
    "3": band({
      levels: ["parts"],
      start: "parts",
      offer: "play",
      standards: ["3.G.A.2"],
    }),
  },
  fractions: {
    K: band({
      levels: ["parts"],
      start: "parts",
      offer: "later",
      standards: ["1.G.A.3"],
    }),
    "1": band({
      levels: ["parts", "unit"],
      start: "parts",
      offer: "play",
      cap: "unit",
      standards: ["1.G.A.3"],
    }),
    "2": band({
      levels: ["line", "compare"],
      start: "line",
      offer: "play",
      standards: ["2.G.A.3"],
    }),
    "3": band({
      levels: ["equivalent", "shade"],
      start: "equivalent",
      offer: "play",
      standards: ["3.NF.A.1", "3.NF.A.2", "3.NF.A.3"],
    }),
  },
  measure: {
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
      standards: ["3.MD.B.3"],
    }),
  },
  phonics: {
    K: band({
      levels: ["sounds", "begin"],
      start: "sounds",
      offer: "play",
      standards: ["RF.K.2.A", "RF.K.3.A"],
    }),
    "1": band({
      levels: ["begin", "rhyme"],
      start: "begin",
      offer: "play",
      standards: ["RF.1.2.B", "RF.1.2.C"],
    }),
    "2": band({
      levels: ["cvc"],
      start: "cvc",
      offer: "play",
      cap: "cvc",
      standards: ["RF.2.3.A"],
    }),
    "3": band({
      levels: ["rhyme", "cvc"],
      start: "rhyme",
      offer: "play",
      standards: ["RF.3.3.C"],
    }),
  },
  problems: {
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
      standards: ["3.OA.A.3"],
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
