import { SCHOOL_DAYS, lastSchoolDayOnOrBefore, schoolDayIndex, todayIso } from "./calendar";
import type { ActivityDef, QuarterId, UnitDef } from "./types";

export const QUARTERS: {
  id: QuarterId;
  name: string;
  span: string;
  months: number[];
}[] = [
  { id: 1, name: "Quarter 1", span: "Aug – Oct", months: [8, 9, 10] },
  { id: 2, name: "Quarter 2", span: "Nov – Jan", months: [11, 12, 1] },
  { id: 3, name: "Quarter 3", span: "Feb – Mar", months: [2, 3] },
  { id: 4, name: "Quarter 4", span: "Apr – Jun", months: [4, 5, 6] },
];

function A(
  id: string,
  title: string,
  blurb: string,
  sol: string[],
  kind: ActivityDef["kind"],
  params?: Record<string, unknown>,
  rounds = 10,
): ActivityDef {
  return { id, title, blurb, sol, kind, rounds, params };
}

export const GRADE3_SOLS = [
  "3.NS.1",
  "3.NS.2",
  "3.NS.3",
  "3.NS.4",
  "3.CE.1",
  "3.CE.2",
  "3.MG.1",
  "3.MG.2",
  "3.MG.3",
  "3.MG.4",
  "3.PS.1",
  "3.PFA.1",
] as const;

export const UNITS: UnitDef[] = [
  {
    id: "u1",
    number: 1,
    quarter: 1,
    title: "Building a Mathematical Community Through the Data Cycle",
    short: "Data cycle",
    sol: ["3.NS.1", "3.NS.4", "3.CE.1", "3.PS.1"],
    blurb: "Count what you can see. Collect and organize data. Name the leftover.",
    activities: [
      A("u1-leftover", "What's hiding", "Ten-frames. Take the dots you can see, then name n.", ["3.NS.1"], "tenframe", { maxTotal: 10 }),
      A("u1-friends", "Number friends", "Add and subtract on a frame, within 20.", ["3.CE.1"], "tenframe", { minTotal: 10, maxTotal: 20 }),
      A("u1-coins", "Count the coins", "Pennies, nickels, dimes, quarters — up to a dollar.", ["3.NS.4.a"], "money", { mode: "count", max: 100 }),
      A("u1-tally", "Tally and graph", "Sort the pictures. Watch the pictograph grow. Then read it.", ["3.PS.1.a", "3.PS.1.b"], "graph", { kind: "picto", collect: true }),
      A("u1-graph", "Pictograph key of 1", "Read a pictograph. Each picture is 1.", ["3.PS.1.b"], "graph", { kind: "picto", key: 1 }),
    ],
  },
  {
    id: "u2",
    number: 2,
    quarter: 1,
    title: "Place Value/Addition and Subtraction Part 1",
    short: "Place value",
    sol: ["3.NS.1", "3.NS.2"],
    blurb: "Read, write, build, compare, and order numbers through thousands — place up to six digits.",
    activities: [
      A("u2-place", "Place and value", "Name the place and value of a digit, through hundred thousands.", ["3.NS.1.a", "3.NS.1.b"], "placevalue", { six: true }),
      A("u2-word", "Word form", "Six-digit numbers: words ↔ digits, with a place chart.", ["3.NS.1.a"], "placevalue", { mode: "word" }),
      A("u2-build", "Compose and decompose", "Build a number to 9,999 in more than one way.", ["3.NS.1.c"], "build"),
      A("u2-expanded", "Tens you can see", "60 + n = 64. Leftover ones on a tens-and-ones board.", ["3.NS.1.c", "3.CE.1"], "placevalue", { mode: "expanded" }),
      A("u2-compare", "Compare", "Greater than, less than, equal to — up to 9,999.", ["3.NS.2.a"], "compare"),
      A("u2-order", "Put in order", "Least to greatest, or the other way.", ["3.NS.2.b"], "order"),
    ],
  },
  {
    id: "u3",
    number: 3,
    quarter: 1,
    title: "Multiplication and Division Part 1 - Making Meaning with Models",
    short: "Meaning with models",
    sol: ["3.CE.2"],
    blurb: "Equal groups, arrays, and related facts. Meaning first. 3.CE.2 a,b.",
    activities: [
      A("u3-groups", "Equal groups", "How many groups? How many in each? How many in all?", ["3.CE.2.a"], "groups", { factors: [2, 3, 4, 5] }),
      A("u3-jumps", "Jumps on a line", "Equal jumps on a number line. How far? How many hops?", ["3.CE.2.a"], "jumps", { factors: [2, 3, 4, 5] }),
      A("u3-array", "Arrays", "Rows and columns make a product.", ["3.CE.2.a"], "array"),
      A("u3-factor", "Missing factor", "2 × n = 8. Isolate one group, then name n.", ["3.CE.2.a"], "groups", { hide: "groups", factors: [2, 3, 4, 5] }),
      A("u3-share", "Share equally", "n groups share the total. How many in each?", ["3.CE.2.a"], "groups", { hide: "size", factors: [2, 3, 4, 5] }),
      A("u3-family", "Related facts", "One model, four facts.", ["3.CE.2.b"], "choice", { mode: "family" }),
    ],
  },
  {
    id: "u4",
    number: 4,
    quarter: 2,
    title: "Geometry",
    short: "Geometry",
    sol: ["3.MG.4"],
    blurb: "Identify, describe, classify, compare. Combine and subdivide triangles and quadrilaterals.",
    activities: [
      A("u4-name", "Name the shape", "Look at the polygon. Name it.", ["3.MG.4.a"], "choice", { mode: "name" }),
      A("u4-sides", "Count the sides", "How many sides? How many vertices?", ["3.MG.4.a"], "choice", { mode: "sides" }),
      A("u4-vs", "Polygon or not", "Closed, straight sides — or not.", ["3.MG.4.a"], "choice", { mode: "isPolygon" }),
      A("u4-attr", "Attributes", "Sides, vertices, and names together.", ["3.MG.4.b"], "choice", { mode: "attr" }),
      A("u4-combine", "Combine polygons", "Two triangles make a new polygon.", ["3.MG.4.c"], "choice", { mode: "combine" }),
      A("u4-subdivide", "Subdivide", "Split a quadrilateral. How many triangles?", ["3.MG.4.c"], "choice", { mode: "subdivide" }),
    ],
  },
  {
    id: "u5",
    number: 5,
    quarter: 2,
    title: "Developing Fraction Understanding Part 1",
    short: "Fractions part 1",
    sol: ["3.NS.3"],
    blurb: "Proper, improper, mixed. Region and length models. 3.NS.3 a,b,c,d.",
    activities: [
      A("u5-name", "Name the fraction", "Shaded pieces of a region/area bar.", ["3.NS.3.a"], "fraction", { mode: "name" }),
      A("u5-line", "On a number line", "A length model. Name the point.", ["3.NS.3.a"], "fraction", { mode: "line" }),
      A("u5-unit", "Unit fractions", "One piece of n equal parts.", ["3.NS.3.b"], "fraction", { mode: "unit" }),
      A("u5-leftover", "Leftover pieces", "Some pieces showing. n pieces hide.", ["3.NS.3.b"], "fraction", { mode: "leftover" }),
      A("u5-mixed", "Wholes and leftover", "Mixed numbers on stacked bars.", ["3.NS.3.c"], "fraction", { mode: "mixed" }),
      A("u5-set", "Of a set", "Shaded of a group of same-size pieces.", ["3.NS.3.d"], "fraction", { mode: "name", set: true }),
    ],
  },
  {
    id: "u6",
    number: 6,
    quarter: 2,
    title: "Multiplication and Division Part 2 - Strategies for Foundational Facts",
    short: "Foundational facts",
    sol: ["3.CE.2", "3.PS.1"],
    blurb: "0s, 1s, 2s, 5s, 10s. Pictographs with a key. 3.CE.2 d · 3.PS.1 c,e.",
    activities: [
      A("u6-facts", "Facts on groups", "0, 1, 2, 5, and 10 as equal groups.", ["3.CE.2.d"], "groups", { factors: [0, 1, 2, 5, 10] }),
      A("u6-array", "Easy arrays", "Rows of 2, 5, or 10.", ["3.CE.2.d"], "array", { factors: [2, 5, 10] }),
      A("u6-factor", "Missing factor", "5 × n = 30. Isolate one group.", ["3.CE.2.d"], "groups", { hide: "groups", factors: [2, 5, 10] }),
      A("u6-skip", "Skip count", "The pattern is hiding a number.", ["3.CE.2.d"], "pattern", { steps: [2, 5, 10], dir: "up" }),
      A("u6-picto", "Tally with a key", "Sort pictures. Each picture can stand for 1. Then read.", ["3.PS.1.c", "3.PS.1.e"], "graph", { kind: "picto", collect: true, key: 2 }),
    ],
  },
  {
    id: "u7",
    number: 7,
    quarter: 3,
    title: "Addition and Subtraction Part 2 - Analyzing My World and Solving Problems",
    short: "Solving problems",
    sol: ["3.CE.1", "3.PS.1", "3.PFA.1"],
    blurb: "Stories, graphs, and patterns. Estimate and solve add/sub to 1,000. Begins Q2, continues Q3.",
    activities: [
      A("u7-add", "Join and leftover", "A join story on a frame.", ["3.CE.1"], "word", { mode: "add" }),
      A("u7-take", "Take-from leftover", "How many are hiding after some leave.", ["3.CE.1"], "word", { mode: "take" }),
      A("u7-compare", "How many more", "Compare two amounts in a story.", ["3.CE.1"], "word", { mode: "compare" }),
      A("u7-estimate", "About how many", "Add or subtract to 1,000. Estimate first on hundreds.", ["3.CE.1"], "compute", { mode: "estimate" }),
      A("u7-exact", "Add and subtract to 1,000", "Hundreds, tens, and ones you can see.", ["3.CE.1"], "compute", { mode: "exact" }),
      A("u7-pattern", "Growing and shrinking", "Identify, describe, and extend +/− patterns.", ["3.PFA.1"], "pattern", { steps: [2, 3, 4, 5, 10] }),
      A("u7-bar", "Tally a bar graph", "Sort the pictures. The bars grow. Then answer.", ["3.PS.1"], "graph", { kind: "bar", collect: true }),
    ],
  },
  {
    id: "u8",
    number: 8,
    quarter: 3,
    title: "Measurement, Perimeter, and Area",
    short: "Measurement",
    sol: ["3.MG.1", "3.MG.2"],
    blurb: "Length, weight/mass, liquid volume — U.S. Customary and metric. Then cover and go around.",
    activities: [
      A("u8-length", "Read a ruler", "Nearest half or whole inch or centimeter.", ["3.MG.1.b"], "measure", { attribute: "length" }),
      A("u8-mass", "Weight and mass", "A scale. Ounces, pounds, grams, kilograms.", ["3.MG.1.b"], "measure", { attribute: "mass" }),
      A("u8-volume", "Liquid volume", "A beaker. Cups, quarts, milliliters, liters.", ["3.MG.1.b"], "measure", { attribute: "volume" }),
      A("u8-unit", "Pick the unit", "Estimate or exact? Inch or yard? Cup or liter?", ["3.MG.1.a"], "measure", { mode: "unit" }),
      A("u8-area", "Cover the grid", "How many unit squares?", ["3.MG.2.a"], "area"),
      A("u8-peri", "Around the shape", "Perimeter of a polygon with up to 6 sides.", ["3.MG.2.b"], "perimeter"),
      A("u8-missing", "Missing side", "Perimeter you know. One side is n.", ["3.MG.2.b"], "perimeter", { hide: true }),
    ],
  },
  {
    id: "u9",
    number: 9,
    quarter: 3,
    title: "Multiplication and Division Part 3 - Building on Foundational Facts",
    short: "3s 4s 8s 9s",
    sol: ["3.CE.2"],
    blurb: "3s, 4s, 8s, 9s on groups and arrays. Then the fact. 3.CE.2 c,d.",
    activities: [
      A("u9-groups", "Groups of 3, 4, 8, 9", "Equal groups on those tables.", ["3.CE.2.c", "3.CE.2.d"], "groups", { factors: [3, 4, 8, 9] }),
      A("u9-array", "Arrays", "Rows of 3, 4, 8, or 9.", ["3.CE.2.c"], "array", { factors: [3, 4, 8, 9] }),
      A("u9-factor", "Missing factor", "4 × n = 32. Isolate one group.", ["3.CE.2.d"], "groups", { hide: "groups", factors: [3, 4, 8, 9] }),
      A("u9-family", "Related facts", "One array, four facts.", ["3.CE.2.b"], "choice", { mode: "family", factors: [3, 4, 8, 9] }),
      A("u9-mix", "Mixed facts", "× and ÷ on 3s 4s 8s 9s.", ["3.CE.2.d"], "fluency", { factors: [3, 4, 8, 9] }),
    ],
  },
  {
    id: "u10",
    number: 10,
    quarter: 4,
    title: "Reasoning with Fractions Part 2",
    short: "Fractions part 2",
    sol: ["3.NS.3"],
    blurb: "Equivalent, compare, benchmarks, order. 3.NS.3 e,f,g,h.",
    activities: [
      A("u10-equiv", "Same amount", "Different pieces, same bar.", ["3.NS.3.e"], "fraction", { mode: "equiv" }),
      A("u10-compare", "Which is more?", "Two bars, same whole.", ["3.NS.3.f"], "fraction", { mode: "compare" }),
      A("u10-bench", "Near 0, ½, 1", "Benchmark the fraction on a bar.", ["3.NS.3.g"], "fraction", { mode: "benchmark" }),
      A("u10-order", "Put fractions in order", "Least to greatest on bars.", ["3.NS.3.h"], "order", { fractions: true }),
      A("u10-line", "Compare on a line", "Two points on a number line.", ["3.NS.3.f"], "fraction", { mode: "line", compare: true }),
    ],
  },
  {
    id: "u11",
    number: 11,
    quarter: 4,
    title: "Time and Money",
    short: "Time and money",
    sol: ["3.MG.3", "3.NS.4"],
    blurb: "Time to the nearest minute. Elapsed time in one-hour increments. Money to $5.00.",
    activities: [
      A("u11-clock", "Time to the minute", "Hour and minute hands, nearest minute.", ["3.MG.3.a"], "clock", { mode: "read", nearest: "minute" }),
      A("u11-match", "Match the clocks", "A written time and the analog clock.", ["3.MG.3.b"], "clock", { mode: "read", nearest: "minute" }),
      A("u11-elapsed", "One hour later", "Elapsed time in one-hour increments.", ["3.MG.3.c"], "clock", { mode: "elapsed", hours: true }),
      A("u11-count", "Count to $5", "Bills and coins up to five dollars.", ["3.NS.4.a"], "money", { mode: "count", max: 500 }),
      A("u11-compare", "Compare money", "Which set is more?", ["3.NS.4.b"], "money", { mode: "compare", max: 500 }),
      A("u11-make", "Make this amount", "Tap bills and coins until you match the total, up to $5.", ["3.NS.4.b"], "money", { mode: "make", max: 500 }),
      A("u11-change", "Make change", "Pay with bills. n is leftover.", ["3.NS.4.c"], "money", { mode: "change", max: 500 }),
    ],
  },
  {
    id: "u12",
    number: 12,
    quarter: 4,
    title: "Multiplication and Division Part 4 - Using Strategies to Develop Fluency",
    short: "Fluency",
    sol: ["3.CE.2"],
    blurb: "Automaticity through 10 × 10, including the remaining 6s and 7s.",
    activities: [
      A("u12-six", "6s and 7s", "The leftover tables, still on groups.", ["3.CE.2"], "groups", { factors: [6, 7] }),
      A("u12-mix", "Mixed facts", "0–10 tables, × and ÷, including 6s and 7s.", ["3.CE.2"], "fluency", { factors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
      A("u12-factor", "Missing factor mix", "Isolate a group, name n.", ["3.CE.2"], "groups", { hide: "groups", factors: [2, 3, 4, 5, 6, 7, 8, 9, 10] }),
      A("u12-family", "Related mix", "One model, four facts.", ["3.CE.2.b"], "choice", { mode: "family", factors: [6, 7, 8, 9] }),
      A("u12-array", "Array mix", "Rows and columns from the year.", ["3.CE.2"], "array", { factors: [6, 7, 8, 9, 10] }),
    ],
  },
  {
    id: "u13",
    number: 13,
    quarter: 4,
    title: "Moving Forward and Digging Deeper",
    short: "Dig deeper",
    sol: ["3.CE.1", "3.CE.2", "3.PS.1", "3.MG.1", "3.MG.2", "3.PFA.1"],
    blurb: "Mixed year review in the SOL-resources style. Still a walk, not a test.",
    activities: [
      A("u13-two", "Two-step stories", "Then do this — with a model.", ["3.CE.1", "3.CE.2"], "word", { mode: "two" }),
      A("u13-compute", "Add and subtract mix", "To 1,000, with hundreds you can see.", ["3.CE.1"], "compute", { mode: "exact" }),
      A("u13-pattern", "Number patterns", "Increasing and decreasing +/− patterns.", ["3.PFA.1"], "pattern", { steps: [2, 3, 4, 5, 6, 8, 10] }),
      A("u13-measure", "Measure again", "A ruler, a scale, or a beaker from the year.", ["3.MG.1"], "measure", { attribute: "length" }),
      A("u13-area", "Area stories", "Covering a space in a story.", ["3.MG.2"], "area"),
    ],
  },
];

export const WELCOME_ACTIVITY: ActivityDef = {
  id: "welcome",
  title: "What's hiding",
  blurb: "Take the dots you can see. Then name n.",
  sol: ["3.NS.1"],
  kind: "tenframe",
  rounds: 4,
  params: { welcome: true, maxTotal: 10 },
};

/** School-day spans per unit, matching LCPS quarter lengths. */
export const UNIT_SPANS: { id: string; start: number; end: number }[] = [
  { id: "u1", start: 0, end: 15 },
  { id: "u2", start: 16, end: 32 },
  { id: "u3", start: 33, end: 48 },
  { id: "u4", start: 49, end: 62 },
  { id: "u5", start: 63, end: 76 },
  { id: "u6", start: 77, end: 85 },
  { id: "u7", start: 86, end: 106 },
  { id: "u8", start: 107, end: 121 },
  { id: "u9", start: 122, end: 136 },
  { id: "u10", start: 137, end: 147 },
  { id: "u11", start: 148, end: 158 },
  { id: "u12", start: 159, end: 169 },
  { id: "u13", start: 170, end: 179 },
];

export function unitById(id: string): UnitDef | undefined {
  return UNITS.find((u) => u.id === id);
}

export function activityById(id: string): { unit: UnitDef; activity: ActivityDef } | undefined {
  if (id === WELCOME_ACTIVITY.id) {
    return { unit: UNITS[0]!, activity: WELCOME_ACTIVITY };
  }
  for (const unit of UNITS) {
    const activity = unit.activities.find((a) => a.id === id);
    if (activity) return { unit, activity };
  }
  return undefined;
}

export function suggestedUnitId(iso?: string, classUnitId?: string): string {
  if (classUnitId && unitById(classUnitId)) return classUnitId;
  const raw = iso ?? todayIso();
  if (!SCHOOL_DAYS.length) return "u1";
  if (raw < SCHOOL_DAYS[0]!) return "u1";
  const day = schoolDayIndex(raw) >= 0 ? raw : lastSchoolDayOnOrBefore(raw) ?? raw;
  const idx = schoolDayIndex(day);
  if (idx < 0) return "u13";
  const span = UNIT_SPANS.find((s) => idx >= s.start && idx <= s.end);
  return span?.id ?? "u1";
}

export function unitSpanDays(unitId: string): number {
  const s = UNIT_SPANS.find((x) => x.id === unitId);
  return s ? s.end - s.start + 1 : 0;
}

export function fluencyFactorsForUnit(unitId: string): number[] {
  const n = unitById(unitId)?.number ?? 1;
  if (n >= 12) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  if (n >= 9) return [0, 1, 2, 3, 4, 5, 8, 9, 10];
  if (n >= 6) return [0, 1, 2, 5, 10];
  return [1, 2, 5];
}

export function coversSol(code: string): boolean {
  return UNITS.some((u) => u.activities.some((a) => a.sol.some((s) => s === code || s.startsWith(`${code}.`))));
}

export function earlierUnits(unitId: string): UnitDef[] {
  const u = unitById(unitId);
  if (!u) return [];
  return UNITS.filter((x) => x.number < u.number);
}

export function quarterForUnit(unitId: string): QuarterId {
  return unitById(unitId)?.quarter ?? 1;
}

export function unitWindowLabel(unitId: string): string {
  const s = UNIT_SPANS.find((x) => x.id === unitId);
  if (!s) return "";
  const a = SCHOOL_DAYS[s.start];
  const b = SCHOOL_DAYS[s.end];
  if (!a || !b) return `${s.end - s.start + 1} school days`;
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[Number(m) - 1]} ${Number(d)}`;
  };
  return `${fmt(a)} – ${fmt(b)} · ${s.end - s.start + 1} school days`;
}

export function remainingSchoolDaysInUnit(unitId: string, iso: string): number {
  const s = UNIT_SPANS.find((x) => x.id === unitId);
  if (!s) return 0;
  const idx = schoolDayIndex(iso);
  if (idx < 0) return s.end - s.start + 1;
  if (idx > s.end) return 0;
  if (idx < s.start) return s.end - s.start + 1;
  return s.end - idx;
}
