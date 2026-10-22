import { bandFor } from "../grade-map";
import { gamePill, show, t } from "../i18n";
import type { Grade } from "../model";
import type { GameCard, LevelDef, SkillRow } from "./types";

/**
 * Titles, levels, and blurbs for every game. The home screen imports this file
 * only. Question generators stay in each game module and load with play.
 */

function labelFor(rows: readonly SkillRow[], key: string): string | null {
  return rows.find((row) => row.key === key)?.label ?? null;
}

function isId(ids: readonly string[], value: unknown): boolean {
  return typeof value === "string" && ids.includes(value);
}

function bandStart(game: string, grade: Grade, ids: readonly string[], fallback: string): string {
  const start = bandFor(game, grade)?.start;
  if (start != null && isId(ids, start)) return start;
  return fallback;
}

function sceneCard(
  short: string,
  rows: SkillRow[],
  fields: Omit<GameCard, "sheetCount" | "layout" | "pill" | "bars" | "chips" | "skillLabel" | "chipLabel">,
): GameCard {
  return {
    ...fields,
    bars: rows,
    chips: rows,
    sheetCount: 10,
    layout: "card",
    pill: (level: LevelDef) => gamePill(short, level.num),
    skillLabel: (key) => labelFor(rows, key),
    chipLabel: (key) => labelFor(rows, key),
  };
}

const TIMES_IDS = ["count", "twos", "mix", "toTen", "factors", "multi", "divide"] as const;
const TIMES_BARS = ["2", "5", "10", "3", "4", "6", "7", "8", "9"].map((n) => ({ key: `table:${n}`, label: `×${n}` }));
const TIMES_CHIPS = ["2", "3", "4", "5", "6", "7", "8", "9", "10"].map((n) => ({ key: `table:${n}`, label: `×${n}` }));

export const timesCard: GameCard = {
  id: "times",
  title: "Times Tables",
  audience: "Grade 2–4",
  tint: "pink",
  mascot: "peach",
  sheetSlug: "times-tables",
  sheetScreen: "sheet-times",
  blurb:
    "Free printable multiplication practice for grades 2–4. Facts, multi-digit problems, and an answer key. No signup.",
  sheetCount: 16,
  layout: "card",
  levels: [
    { id: "count", label: "2s, 5s, 10s · small", num: 1 },
    { id: "twos", label: "2s, 5s, 10s", num: 2 },
    { id: "mix", label: "Mix through 5s", num: 3 },
    { id: "toTen", label: "Up to 10s", num: 4 },
    { id: "factors", label: "Factors and multiples", num: 5 },
    { id: "multi", label: "Multi-digit multiply", num: 6 },
    { id: "divide", label: "Division with remainders", num: 7 },
  ],
  defaultLevel(grade) {
    const fallback = ((): string => {
      switch (grade) {
        case "PK":
        case "K":
        case "1":
          return "count";
        case "2":
          return "twos";
        case "3":
          return "toTen";
        case "4":
          return "factors";
        default: {
          const neverGrade: never = grade;
          return neverGrade;
        }
      }
    })();
    return bandStart("times", grade, TIMES_IDS, fallback);
  },
  sheetDefaultLevel: "toTen",
  isLevel: (value) => isId(TIMES_IDS, value),
  pill: (level) => gamePill("Times Tables", level.num),
  focus: {
    param: "factor",
    label: "Table",
    blank: "Mix",
    options: Array.from({ length: 9 }, (_, i) => {
      const n = i + 2;
      return { value: String(n), label: `×${n}` };
    }),
    read: (raw) => {
      const n = Number(raw);
      return Number.isInteger(n) && n >= 2 && n <= 12 ? n : undefined;
    },
  },
  bars: TIMES_BARS,
  chips: TIMES_CHIPS,
  skillLabel: (key) => labelFor(TIMES_BARS, key) ?? labelFor(TIMES_CHIPS, key),
  chipLabel: () => null,
};

const ADD_IDS = ["within5", "within10", "within20", "tens", "within100", "within1000", "thousands"] as const;
const ADD_BARS: SkillRow[] = [
  { key: "add:within5", label: "Add within 5" },
  { key: "add:within10", label: "Add within 10" },
  { key: "add:within20", label: "Add within 20" },
  { key: "add:tens", label: "Tens and ones" },
  { key: "add:within100", label: "Add within 100" },
  { key: "add:within1000", label: "Add within 1000" },
  { key: "add:thousands", label: "Add thousands" },
];
const ADD_CHIPS: SkillRow[] = [
  { key: "doubles", label: "Doubles" },
  { key: "make10", label: "Make 10" },
  { key: "add:within5", label: "Within 5" },
  { key: "add:within10", label: "Within 10" },
  { key: "add:within20", label: "Within 20" },
  { key: "add:tens", label: "Tens and ones" },
  { key: "add:within100", label: "Within 100" },
];

export const addCard: GameCard = {
  id: "add",
  title: "Add & Subtract",
  audience: "K–4",
  tint: "mint",
  mascot: "frog",
  sheetSlug: "add-subtract",
  sheetScreen: "sheet-add",
  blurb:
    "Free printable addition and subtraction for kindergarten through grade 4. Facts within 5, 10, 20, 100, or the thousands, plus an answer key.",
  sheetCount: 16,
  layout: "card",
  levels: [
    { id: "within5", label: "Within 5", num: 1 },
    { id: "within10", label: "Within 10", num: 2 },
    { id: "within20", label: "Within 20", num: 3 },
    { id: "tens", label: "Tens and ones", num: 4 },
    { id: "within100", label: "Within 100", num: 5 },
    { id: "within1000", label: "Within 1000", num: 6 },
    { id: "thousands", label: "Thousands", num: 7 },
  ],
  defaultLevel(grade) {
    const fallback = ((): string => {
      switch (grade) {
        case "PK":
        case "K":
          return "within5";
        case "1":
          return "within10";
        case "2":
          return "within20";
        case "3":
          return "within100";
        case "4":
          return "within1000";
        default: {
          const neverGrade: never = grade;
          return neverGrade;
        }
      }
    })();
    return bandStart("add", grade, ADD_IDS, fallback);
  },
  sheetDefaultLevel: "within20",
  isLevel: (value) => isId(ADD_IDS, value),
  pill: (level) => gamePill("Add & Subtract", level.num),
  bars: ADD_BARS,
  chips: ADD_CHIPS,
  skillLabel: (key) => labelFor(ADD_BARS, key) ?? labelFor(ADD_CHIPS, key),
  chipLabel: (key) => labelFor(ADD_CHIPS, key),
};

const TIME_IDS = ["hour", "half", "quarter", "fives", "elapsed"] as const;
const TIME_BARS: SkillRow[] = [
  { key: "time:hour", label: "Time: hours" },
  { key: "time:half", label: "Time: half hour" },
  { key: "time:quarter", label: "Time: quarter hour" },
  { key: "time:fives", label: "Time: 5 minutes" },
  { key: "time:elapsed", label: "Elapsed time" },
];
const TIME_CHIPS: SkillRow[] = [
  { key: "oclock", label: "O'clock" },
  { key: "halfpast", label: "Half past" },
  { key: "quarterpast", label: "Quarter past" },
  { key: "quarterto", label: "Quarter to" },
  { key: "time:hour", label: "Hours" },
  { key: "time:half", label: "Half hours" },
  { key: "time:quarter", label: "Quarter hours" },
  { key: "time:fives", label: "5 minutes" },
];

export const timeCard: GameCard = {
  id: "time",
  title: "Telling Time",
  audience: "Grade 1–4",
  tint: "sun",
  mascot: "melon",
  sheetSlug: "telling-time",
  sheetScreen: "sheet-time",
  blurb:
    "Free printable telling-time practice for grades 1–4. Analog clocks to the hour, half hour, quarter hour, and 5 minutes, plus elapsed time, with an answer key.",
  sheetCount: 6,
  layout: "wide",
  levels: [
    { id: "hour", label: "Hours", num: 1 },
    { id: "half", label: "Half hours", num: 2 },
    { id: "quarter", label: "Quarter hours", num: 3 },
    { id: "fives", label: "5 minutes", num: 4 },
    { id: "elapsed", label: "Elapsed time", num: 5 },
  ],
  defaultLevel(grade) {
    const fallback = ((): string => {
      switch (grade) {
        case "PK":
        case "K":
          return "hour";
        case "1":
          return "half";
        case "2":
          return "quarter";
        case "3":
          return "fives";
        case "4":
          return "elapsed";
        default: {
          const neverGrade: never = grade;
          return neverGrade;
        }
      }
    })();
    return bandStart("time", grade, TIME_IDS, fallback);
  },
  sheetDefaultLevel: "half",
  isLevel: (value) => isId(TIME_IDS, value),
  pill: (level) => t(`Telling Time · ${level.label}`, `La hora · ${show(level.label)}`, `As horas · ${show(level.label)}`, `L'heure · ${show(level.label)}`, `认识钟表 · ${show(level.label)}`, `समय देखना · ${show(level.label)}`),
  bars: TIME_BARS,
  chips: TIME_CHIPS,
  skillLabel: (key) => labelFor(TIME_BARS, key) ?? labelFor(TIME_CHIPS, key),
  chipLabel: (key) => labelFor(TIME_CHIPS, key),
};

const MONEY_IDS = ["name", "count", "make", "change", "dollars", "spend"] as const;
const MONEY_BARS: SkillRow[] = [
  { key: "money:name", label: "Name coins" },
  { key: "money:count", label: "Count coins" },
  { key: "money:make", label: "Make an amount" },
  { key: "money:change", label: "Make change" },
  { key: "money:dollars", label: "Dollars and cents" },
  { key: "money:spend", label: "Money problems" },
];
const MONEY_CHIPS: SkillRow[] = [
  { key: "money:name", label: "Names coins" },
  { key: "money:count", label: "Counts coins" },
  { key: "money:make", label: "Makes an amount" },
  { key: "money:change", label: "Makes change" },
  { key: "money:dollars", label: "Dollars and cents" },
  { key: "money:spend", label: "Money problems" },
];

export const moneyCard: GameCard = {
  id: "money",
  title: "Money",
  audience: "Pre-K–4",
  tint: "gold",
  mascot: "lemon",
  sheetSlug: "money",
  sheetScreen: "sheet-money",
  blurb:
    "Free printable coin practice for Pre-K to grade 4. Name pennies, nickels, dimes, and quarters, count them, make an amount, make change, read dollars and cents, and solve money problems.",
  sheetCount: 12,
  layout: "card",
  levels: [
    { id: "name", label: "Name the coins", num: 1 },
    { id: "count", label: "Count coins", num: 2 },
    { id: "make", label: "Make an amount", num: 3 },
    { id: "change", label: "Make change", num: 4 },
    { id: "dollars", label: "Dollars and cents", num: 5 },
    { id: "spend", label: "Money problems", num: 6 },
  ],
  defaultLevel(grade) {
    const fallback = ((): string => {
      switch (grade) {
        case "PK":
        case "K":
          return "name";
        case "1":
          return "count";
        case "2":
          return "make";
        case "3":
          return "dollars";
        case "4":
          return "spend";
        default: {
          const neverGrade: never = grade;
          return neverGrade;
        }
      }
    })();
    return bandStart("money", grade, MONEY_IDS, fallback);
  },
  sheetDefaultLevel: "count",
  isLevel: (value) => isId(MONEY_IDS, value),
  pill: (level) => gamePill("Money", level.num),
  bars: MONEY_BARS,
  chips: MONEY_CHIPS,
  skillLabel: (key) => labelFor(MONEY_BARS, key) ?? labelFor(MONEY_CHIPS, key),
  chipLabel: (key) => labelFor(MONEY_CHIPS, key),
};

const SIGHT_IDS = ["preprimer", "primer", "first", "second", "third", "fourth"] as const;
const SIGHT_ROWS: SkillRow[] = [
  { key: "sight:preprimer", label: "Pre-primer words" },
  { key: "sight:primer", label: "Primer words" },
  { key: "sight:first", label: "1st grade words" },
  { key: "sight:second", label: "2nd grade words" },
  { key: "sight:third", label: "3rd grade words" },
  { key: "sight:fourth", label: "Grade 4 vocabulary" },
];

export const sightCard: GameCard = {
  id: "sight",
  title: "Sight Words",
  audience: "K–4",
  tint: "lav",
  mascot: "grape",
  sheetSlug: "sight-words",
  sheetScreen: "sheet-sight",
  blurb:
    "Free Dolch and Fry sight word practice for kindergarten through grade 4. Hear a word, match a picture, and fill a sentence. Trace the list, then check the answer key.",
  sheetCount: 12,
  layout: "card",
  levels: [
    { id: "preprimer", label: "Pre-primer", num: 1 },
    { id: "primer", label: "Primer", num: 2 },
    { id: "first", label: "1st grade", num: 3 },
    { id: "second", label: "2nd grade", num: 4 },
    { id: "third", label: "3rd grade", num: 5 },
    { id: "fourth", label: "Grade 4 vocabulary", num: 6 },
  ],
  defaultLevel(grade) {
    const fallback = ((): string => {
      switch (grade) {
        case "PK":
        case "K":
          return "preprimer";
        case "1":
          return "primer";
        case "2":
          return "second";
        case "3":
          return "third";
        case "4":
          return "fourth";
        default: {
          const neverGrade: never = grade;
          return neverGrade;
        }
      }
    })();
    return bandStart("sight", grade, SIGHT_IDS, fallback);
  },
  sheetDefaultLevel: "preprimer",
  isLevel: (value) => isId(SIGHT_IDS, value),
  pill: (level) => gamePill("Sight Words", level.num),
  bars: SIGHT_ROWS,
  chips: SIGHT_ROWS,
  skillLabel: (key) => labelFor(SIGHT_ROWS, key),
  chipLabel: (key) => labelFor(SIGHT_ROWS, key),
};

const SPELL_IDS = ["cvc", "digraphs", "blends", "long", "patterns", "grade4"] as const;
const SPELL_ROWS: SkillRow[] = [
  { key: "spell:cvc", label: "CVC words" },
  { key: "spell:digraphs", label: "Digraphs" },
  { key: "spell:blends", label: "Blends" },
  { key: "spell:long", label: "Long vowels" },
  { key: "spell:patterns", label: "Grade 2–3 patterns" },
  { key: "spell:grade4", label: "Grade 4 words" },
];

export const spellingCard: GameCard = {
  id: "spelling",
  title: "Spelling",
  audience: "K–4",
  tint: "sky",
  mascot: "owl",
  sheetSlug: "spelling",
  sheetScreen: "sheet-spelling",
  blurb:
    "Free spelling for kindergarten through grade 4. Hear a word in a sentence, then build it from letter tiles. Lists move from CVC words to digraphs, blends, long vowels, and grade 4 words.",
  sheetCount: 12,
  layout: "card",
  levels: [
    { id: "cvc", label: "CVC words", num: 1 },
    { id: "digraphs", label: "Digraphs", num: 2 },
    { id: "blends", label: "Blends", num: 3 },
    { id: "long", label: "Long vowels", num: 4 },
    { id: "patterns", label: "Grade 2–3 patterns", num: 5 },
    { id: "grade4", label: "Grade 4 words", num: 6 },
  ],
  defaultLevel(grade) {
    const fallback = ((): string => {
      switch (grade) {
        case "PK":
        case "K":
          return "cvc";
        case "1":
          return "digraphs";
        case "2":
          return "long";
        case "3":
          return "patterns";
        case "4":
          return "grade4";
        default: {
          const neverGrade: never = grade;
          return neverGrade;
        }
      }
    })();
    return bandStart("spelling", grade, SPELL_IDS, fallback);
  },
  sheetDefaultLevel: "cvc",
  isLevel: (value) => isId(SPELL_IDS, value),
  pill: (level) => gamePill("Spelling", level.num),
  bars: SPELL_ROWS,
  chips: SPELL_ROWS,
  skillLabel: (key) => labelFor(SPELL_ROWS, key),
  chipLabel: (key) => labelFor(SPELL_ROWS, key),
};

const COUNT_ROWS: SkillRow[] = [
  { key: "count:objects", label: "Count to 10" },
  { key: "count:to20", label: "Count to 20" },
  { key: "count:compare", label: "More or less" },
  { key: "count:neighbor", label: "Before and after" },
  { key: "count:subitize", label: "Dot patterns" },
  { key: "count:tenframe", label: "Ten-frames" },
  { key: "count:build", label: "Build a ten-frame" },
];

export const countCard = sceneCard("Counting", COUNT_ROWS, {
  id: "count",
  title: "Counting",
  audience: "Pre-K–4",
  tint: "coral",
  mascot: "chick",
  sheetSlug: "counting",
  sheetScreen: "sheet-count",
  blurb:
    "Free counting practice for Pre-K through grade 4. Count objects to 20, compare groups, find the number before and after, read dot patterns, and fill a ten-frame.",
  levels: [
    { id: "objects", label: "Count to 10", num: 1 },
    { id: "to20", label: "Count to 20", num: 2 },
    { id: "compare", label: "More or less", num: 3 },
    { id: "neighbor", label: "Before and after", num: 4 },
    { id: "subitize", label: "Dot patterns", num: 5 },
    { id: "tenframe", label: "Ten-frames", num: 6 },
    { id: "build", label: "Build a ten-frame", num: 7 },
  ],
  defaultLevel(grade) {
    switch (grade) {
      case "PK":
      case "K":
        return "objects";
      case "1":
        return "to20";
      case "2":
        return "tenframe";
      case "3":
      case "4":
        return "neighbor";
      default: {
        const neverGrade: never = grade;
        return neverGrade;
      }
    }
  },
  sheetDefaultLevel: "objects",
  isLevel: (value) => isId(["objects", "to20", "compare", "neighbor", "subitize", "tenframe", "build"], value),
});

const PLACE_ROWS: SkillRow[] = [
  { key: "place:blocks", label: "Tens and ones" },
  { key: "place:expanded", label: "Expanded form" },
  { key: "place:compare", label: "Compare numbers" },
  { key: "place:round10", label: "Round to 10" },
  { key: "place:round100", label: "Round to 100" },
  { key: "place:build", label: "Build a number" },
  { key: "place:big", label: "Place value to 1,000,000" },
  { key: "place:roundBig", label: "Round large numbers" },
];

export const placeCard = sceneCard("Place Value", PLACE_ROWS, {
  id: "place",
  title: "Place Value",
  audience: "1–4",
  tint: "leaf",
  mascot: "bear",
  sheetSlug: "place-value",
  sheetScreen: "sheet-place",
  blurb:
    "Free place value practice for grades 1–4. Tens and ones with base-ten blocks, expanded form, comparing numbers, rounding, and thousands up to a million.",
  levels: [
    { id: "blocks", label: "Tens and ones", num: 1 },
    { id: "expanded", label: "Expanded form", num: 2 },
    { id: "compare", label: "Compare numbers", num: 3 },
    { id: "round10", label: "Round to 10", num: 4 },
    { id: "round100", label: "Round to 100", num: 5 },
    { id: "build", label: "Build a number", num: 6 },
    { id: "big", label: "Place value to 1,000,000", num: 7 },
    { id: "roundBig", label: "Round large numbers", num: 8 },
  ],
  defaultLevel(grade) {
    switch (grade) {
      case "PK":
      case "K":
      case "1":
        return "blocks";
      case "2":
        return "expanded";
      case "3":
        return "round10";
      case "4":
        return "big";
      default: {
        const neverGrade: never = grade;
        return neverGrade;
      }
    }
  },
  sheetDefaultLevel: "blocks",
  isLevel: (value) => isId(["blocks", "expanded", "compare", "round10", "round100", "build", "big", "roundBig"], value),
});

const SHAPE_ROWS: SkillRow[] = [
  { key: "shapes:color", label: "Colors" },
  { key: "shapes:match", label: "Matching" },
  { key: "shapes:pattern", label: "Patterns" },
  { key: "shapes:flat", label: "Flat shapes" },
  { key: "shapes:solid", label: "Solid shapes" },
  { key: "shapes:position", label: "Position" },
  { key: "shapes:sort", label: "Flat or solid" },
  { key: "shapes:traits", label: "What matters" },
  { key: "shapes:compose", label: "Join shapes" },
  { key: "shapes:sides", label: "Sides and corners" },
  { key: "shapes:faces", label: "Faces" },
  { key: "shapes:rows", label: "Rows of squares" },
  { key: "shapes:symmetry", label: "Symmetry" },
  { key: "shapes:quads", label: "Quadrilaterals" },
  { key: "shapes:share", label: "Unit fractions" },
  { key: "shapes:parts", label: "Equal parts" },
  { key: "shapes:cover", label: "Cover the rectangle" },
  { key: "shapes:fold", label: "Line of symmetry" },
  { key: "shapes:angles", label: "Angles" },
];

export const shapesCard = sceneCard("Shapes", SHAPE_ROWS, {
  id: "shapes",
  title: "Shapes",
  audience: "Pre-K–4",
  tint: "berry",
  mascot: "cat",
  sheetSlug: "shapes",
  sheetScreen: "sheet-shapes",
  blurb:
    "Free geometry for Pre-K to grade 4. Name shapes, learn position words, join shapes, count faces and squares, and sort quadrilaterals.",
  levels: [
    { id: "color", label: "Colors", num: 1 },
    { id: "match", label: "Matching", num: 2 },
    { id: "pattern", label: "Patterns", num: 3 },
    { id: "flat", label: "Flat shapes", num: 4 },
    { id: "solid", label: "Solid shapes", num: 5 },
    { id: "position", label: "Position", num: 6 },
    { id: "sort", label: "Flat or solid", num: 7 },
    { id: "traits", label: "What matters", num: 8 },
    { id: "compose", label: "Join shapes", num: 9 },
    { id: "sides", label: "Sides and corners", num: 10 },
    { id: "faces", label: "Faces", num: 11 },
    { id: "rows", label: "Rows of squares", num: 12 },
    { id: "symmetry", label: "Symmetry", num: 13 },
    { id: "quads", label: "Quadrilaterals", num: 14 },
    { id: "share", label: "Unit fractions", num: 15 },
    { id: "parts", label: "Halves, thirds, fourths", num: 16 },
    { id: "cover", label: "Cover the rectangle", num: 17 },
    { id: "fold", label: "Line of symmetry", num: 18 },
    { id: "angles", label: "Angles", num: 19 },
  ],
  defaultLevel(grade) {
    switch (grade) {
      case "PK":
        return "color";
      case "K":
        return "flat";
      case "1":
        return "traits";
      case "2":
        return "faces";
      case "3":
        return "quads";
      case "4":
        return "angles";
      default: {
        const neverGrade: never = grade;
        return neverGrade;
      }
    }
  },
  sheetDefaultLevel: "flat",
  isLevel: (value) =>
    isId(
      [
        "color",
        "match",
        "pattern",
        "flat",
        "solid",
        "position",
        "sort",
        "traits",
        "compose",
        "sides",
        "faces",
        "rows",
        "symmetry",
        "quads",
        "share",
        "parts",
        "cover",
        "fold",
        "angles",
      ],
      value,
    ),
});

const FRACTION_ROWS: SkillRow[] = [
  { key: "fractions:parts", label: "Parts of a whole" },
  { key: "fractions:unit", label: "Unit fractions" },
  { key: "fractions:line", label: "Fractions on a line" },
  { key: "fractions:compare", label: "Compare fractions" },
  { key: "fractions:equivalent", label: "Equivalent fractions" },
  { key: "fractions:shade", label: "Shade a fraction" },
  { key: "fractions:addLike", label: "Add like fractions" },
  { key: "fractions:decimals", label: "Decimals" },
];

export const fractionsCard = sceneCard("Fractions", FRACTION_ROWS, {
  id: "fractions",
  title: "Fractions",
  audience: "1–4",
  tint: "sand",
  mascot: "panda",
  sheetSlug: "fractions",
  sheetScreen: "sheet-fractions",
  blurb:
    "Free fraction practice for grades 1–4. Parts of a whole, unit fractions, fractions on a number line, comparing fractions, equivalent fractions with pictures, and decimals.",
  levels: [
    { id: "parts", label: "Parts of a whole", num: 1 },
    { id: "unit", label: "Unit fractions", num: 2 },
    { id: "line", label: "Number line", num: 3 },
    { id: "compare", label: "Compare fractions", num: 4 },
    { id: "equivalent", label: "Equivalent fractions", num: 5 },
    { id: "shade", label: "Shade a fraction", num: 6 },
    { id: "addLike", label: "Add like fractions", num: 7 },
    { id: "decimals", label: "Decimals", num: 8 },
  ],
  defaultLevel(grade) {
    switch (grade) {
      case "PK":
      case "K":
      case "1":
        return "parts";
      case "2":
        return "line";
      case "3":
        return "equivalent";
      case "4":
        return "addLike";
      default: {
        const neverGrade: never = grade;
        return neverGrade;
      }
    }
  },
  sheetDefaultLevel: "parts",
  isLevel: (value) => isId(["parts", "unit", "line", "compare", "equivalent", "shade", "addLike", "decimals"], value),
});

const MEASURE_ROWS: SkillRow[] = [
  { key: "measure:size", label: "Bigger and smaller" },
  { key: "measure:compare", label: "Longer or shorter" },
  { key: "measure:ruler", label: "Measure with a ruler" },
  { key: "measure:picture", label: "Picture graph" },
  { key: "measure:bar", label: "Bar graph" },
  { key: "measure:more", label: "How many more" },
  { key: "measure:area", label: "Area" },
  { key: "measure:perimeter", label: "Perimeter" },
];

export const measureCard = sceneCard("Measurement", MEASURE_ROWS, {
  id: "measure",
  title: "Measurement",
  audience: "Pre-K–4",
  tint: "aqua",
  mascot: "penguin",
  sheetSlug: "measurement",
  sheetScreen: "sheet-measure",
  blurb:
    "Free measurement and data practice for Pre-K through grade 4. Compare longer and shorter, measure inches on a ruler, read picture graphs and bar graphs, and find area.",
  levels: [
    { id: "size", label: "Bigger and smaller", num: 1 },
    { id: "compare", label: "Longer or shorter", num: 2 },
    { id: "picture", label: "Picture graph", num: 3 },
    { id: "bar", label: "Bar graph", num: 4 },
    { id: "ruler", label: "Measure with a ruler", num: 5 },
    { id: "more", label: "How many more", num: 6 },
    { id: "area", label: "Area", num: 7 },
    { id: "perimeter", label: "Perimeter", num: 8 },
  ],
  defaultLevel(grade) {
    switch (grade) {
      case "PK":
        return "size";
      case "K":
        return "compare";
      case "1":
        return "picture";
      case "2":
        return "ruler";
      case "3":
        return "bar";
      case "4":
        return "area";
      default: {
        const neverGrade: never = grade;
        return neverGrade;
      }
    }
  },
  sheetDefaultLevel: "compare",
  isLevel: (value) => isId(["size", "compare", "picture", "bar", "ruler", "more", "area", "perimeter"], value),
});

const PHONICS_ROWS: SkillRow[] = [
  { key: "phonics:letters", label: "Letter names" },
  { key: "phonics:sounds", label: "Letter sounds" },
  { key: "phonics:begin", label: "Beginning sounds" },
  { key: "phonics:rhyme", label: "Rhyming words" },
  { key: "phonics:cvc", label: "CVC blending" },
  { key: "phonics:end", label: "Ending sounds" },
];

export const phonicsCard = sceneCard("Phonics", PHONICS_ROWS, {
  id: "phonics",
  title: "Phonics",
  audience: "Pre-K–4",
  tint: "lilac",
  mascot: "bunny",
  sheetSlug: "phonics",
  sheetScreen: "sheet-phonics",
  blurb:
    "Free phonics practice for Pre-K through grade 4. Letter sounds, beginning sounds with pictures, rhyming words, and CVC blending. A speaker reads the sound, with the sound written out when a voice is not available.",
  levels: [
    { id: "letters", label: "Letter names", num: 1 },
    { id: "sounds", label: "Letter sounds", num: 2 },
    { id: "begin", label: "Beginning sounds", num: 3 },
    { id: "rhyme", label: "Rhyming words", num: 4 },
    { id: "cvc", label: "CVC blending", num: 5 },
    { id: "end", label: "Ending sounds", num: 6 },
  ],
  defaultLevel(grade) {
    switch (grade) {
      case "PK":
        return "letters";
      case "K":
        return "sounds";
      case "1":
        return "begin";
      case "2":
      case "3":
        return "cvc";
      case "4":
        return "end";
      default: {
        const neverGrade: never = grade;
        return neverGrade;
      }
    }
  },
  sheetDefaultLevel: "sounds",
  isLevel: (value) => isId(["letters", "sounds", "begin", "rhyme", "cvc", "end"], value),
});

const PROBLEM_ROWS: SkillRow[] = [
  { key: "problems:add", label: "Add stories" },
  { key: "problems:sub", label: "Subtract stories" },
  { key: "problems:mult", label: "Multiply stories" },
  { key: "problems:div", label: "Share stories" },
  { key: "problems:picture", label: "Picture stories" },
  { key: "problems:steps", label: "Two-step stories" },
];

export const problemsCard = sceneCard("Word Problems", PROBLEM_ROWS, {
  id: "problems",
  title: "Word Problems",
  audience: "K–4",
  tint: "rose",
  mascot: "fox",
  sheetSlug: "word-problems",
  sheetScreen: "sheet-problems",
  blurb:
    "Free word problems for kindergarten through grade 4. Short add, subtract, multiply, share, and two-step stories with a picture, read aloud for children who are still learning to read.",
  levels: [
    { id: "add", label: "Add stories", num: 1 },
    { id: "sub", label: "Subtract stories", num: 2 },
    { id: "mult", label: "Multiply stories", num: 3 },
    { id: "div", label: "Share stories", num: 4 },
    { id: "picture", label: "Picture stories", num: 5 },
    { id: "steps", label: "Two-step stories", num: 6 },
  ],
  defaultLevel(grade) {
    switch (grade) {
      case "PK":
      case "K":
      case "1":
        return "add";
      case "2":
        return "sub";
      case "3":
        return "picture";
      case "4":
        return "steps";
      default: {
        const neverGrade: never = grade;
        return neverGrade;
      }
    }
  },
  sheetDefaultLevel: "add",
  isLevel: (value) => isId(["add", "sub", "mult", "div", "picture", "steps"], value),
});

const VARIABLE_ROWS: SkillRow[] = [
  { key: "variables:addend", label: "Addend within 10" },
  { key: "variables:either", label: "Blank within 20" },
  { key: "variables:factor", label: "Missing factor" },
  { key: "variables:times", label: "Times blank" },
  { key: "variables:steps", label: "Two-step blank" },
];

export const variablesCard = sceneCard("What is missing", VARIABLE_ROWS, {
  id: "variables",
  title: "What is missing",
  audience: "K–4",
  tint: "iris",
  mascot: "otter",
  sheetSlug: "missing-numbers",
  sheetScreen: "sheet-variables",
  blurb:
    "Free missing-number equations for kindergarten through grade 4. Find the box in an addition, subtraction, multiplication, or two-step equation. A first look at variables. No signup.",
  levels: [
    { id: "addend", label: "Addend within 10", num: 1 },
    { id: "either", label: "Blank within 20", num: 2 },
    { id: "factor", label: "Missing factor", num: 3 },
    { id: "times", label: "Times blank", num: 4 },
    { id: "steps", label: "Two-step blank", num: 5 },
  ],
  defaultLevel(grade) {
    const ids = ["addend", "either", "factor", "times", "steps"] as const;
    const fallback = ((): string => {
      switch (grade) {
        case "PK":
        case "K":
        case "1":
          return "addend";
        case "2":
          return "either";
        case "3":
          return "times";
        case "4":
          return "steps";
        default: {
          const neverGrade: never = grade;
          return neverGrade;
        }
      }
    })();
    return bandStart("variables", grade, ids, fallback);
  },
  sheetDefaultLevel: "addend",
  isLevel: (value) => isId(["addend", "either", "factor", "times", "steps"], value),
});

const GRAPH_ROWS: SkillRow[] = [
  { key: "graphs:sort", label: "Sort" },
  { key: "graphs:tally", label: "Tally" },
  { key: "graphs:picture", label: "Picture graph" },
  { key: "graphs:bar", label: "Bar graph" },
  { key: "graphs:scale", label: "Scaled graph" },
  { key: "graphs:line", label: "Line plot" },
];

export const graphsCard = sceneCard("Data", GRAPH_ROWS, {
  id: "graphs",
  title: "Data",
  audience: "Pre-K–4",
  tint: "chart",
  mascot: "duck",
  sheetSlug: "data",
  sheetScreen: "sheet-graphs",
  blurb:
    "Free data and graph practice for Pre-K through grade 4. Sort and count, tally up to three groups, build picture and bar graphs, read a scale, and use a line plot with fractions.",
  levels: [
    { id: "sort", label: "Sort", num: 1 },
    { id: "tally", label: "Tally", num: 2 },
    { id: "picture", label: "Picture graph", num: 3 },
    { id: "bar", label: "Bar graph", num: 4 },
    { id: "scale", label: "Scaled graph", num: 5 },
    { id: "line", label: "Line plot", num: 6 },
  ],
  defaultLevel(grade) {
    const ids = ["sort", "tally", "picture", "bar", "scale", "line"] as const;
    const fallback = ((): string => {
      switch (grade) {
        case "PK":
        case "K":
          return "sort";
        case "1":
          return "tally";
        case "2":
          return "picture";
        case "3":
          return "scale";
        case "4":
          return "line";
        default: {
          const neverGrade: never = grade;
          return neverGrade;
        }
      }
    })();
    return bandStart("graphs", grade, ids, fallback);
  },
  sheetDefaultLevel: "sort",
  isLevel: (value) => isId(["sort", "tally", "picture", "bar", "scale", "line"], value),
});

/** Home-card order is also the island order. Append a game; do not insert one in front. */
export const GAME_CARDS = [
  timesCard,
  addCard,
  timeCard,
  moneyCard,
  sightCard,
  spellingCard,
  countCard,
  placeCard,
  shapesCard,
  fractionsCard,
  measureCard,
  phonicsCard,
  problemsCard,
  variablesCard,
  graphsCard,
] as const;

export type GameId = (typeof GAME_CARDS)[number]["id"];
