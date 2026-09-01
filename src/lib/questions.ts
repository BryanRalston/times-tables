import type { Rng } from "./rng";
import { rngRandom } from "./rng";
import type {
  ActivityDef,
  AreaData,
  ClockData,
  Coin,
  ComputeData,
  FractionData,
  GraphData,
  GroupsData,
  ItemSource,
  MeasureData,
  MoneyData,
  PerimeterData,
  PlaceValueData,
  Question,
  TenFrameData,
} from "./types";
import { moneyFmt, pad2 } from "./utils";

let qn = 0;
function qid(rng: Rng): string {
  qn += 1;
  return `q-${qn}-${Math.floor(rng.next() * 1e9).toString(36)}`;
}

const DENS = [2, 3, 4, 5, 6, 8, 10] as const;
const PLACES = ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands"] as const;
const SHAPE_NAMES: Record<number, string> = {
  3: "triangle",
  4: "quadrilateral",
  5: "pentagon",
  6: "hexagon",
  8: "octagon",
};
const COIN_VALUE: Record<Coin, number> = {
  penny: 1,
  nickel: 5,
  dime: 10,
  quarter: 25,
  dollar: 100,
  five: 500,
};
const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function wordBelow100(n: number): string {
  if (n < 10) return ONES[n] ?? String(n);
  if (n < 20) return TEENS[n - 10] ?? String(n);
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS[t]}-${ONES[o]}` : (TENS[t] ?? String(n));
}

function wordForm(n: number): string {
  if (n === 0) return "zero";
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const hundreds = Math.floor(rest / 100);
  const below = rest % 100;
  const parts: string[] = [];
  if (thousands) parts.push(`${wordBelow100(thousands)} thousand`);
  if (hundreds) parts.push(`${ONES[hundreds]} hundred`);
  if (below) parts.push(wordBelow100(below));
  return parts.join(" ");
}

const NAMES = ["Maya", "Leo", "Priya", "Sam", "Ava", "Noah", "Elena", "Kai", "Rosa", "Ben"];
const THINGS = ["apples", "stickers", "marbles", "crayons", "shells", "cards", "blocks", "beads"];
const SYMBOLS = ["★", "●", "▲", "■", "♥"];

function keypadQ(rng: Rng, partial: Omit<Question, "id" | "input"> & { input?: Question["input"] }): Question {
  return { id: qid(rng), input: partial.input ?? "keypad", ...partial };
}

export function welcomeFirst(rng: Rng): Question {
  return keypadQ(rng, {
    kind: "tenframe",
    prompt: "6 + n = 10",
    hint: "Take the dots you can see. n is what's hiding.",
    answer: "4",
    needsInteract: true,
    data: { total: 10, shown: 6, equation: "6 + n = 10" } satisfies TenFrameData,
  });
}

function tenframeQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const minT = Number(params.minTotal ?? 8);
  const maxT = Number(params.maxTotal ?? 10);
  const total = rng.int(minT, maxT);
  const shown = rng.int(Math.max(1, total - 8), Math.max(1, total - 2));
  const n = total - shown;
  const sub = params.mode === "sub" || (total >= 12 && rng.next() < 0.45);
  const equation = sub ? `${total} − n = ${shown}` : `${shown} + n = ${total}`;
  return keypadQ(rng, {
    kind: "tenframe",
    prompt: equation,
    hint: "Take the dots you can see. n is what's hiding.",
    answer: String(n),
    needsInteract: true,
    data: { total, shown, equation } satisfies TenFrameData,
  });
}

function groupsQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const pool = ((params.factors as number[] | undefined) ?? [2, 3, 4, 5]).filter((n) => n >= 0);
  const nonzero = pool.filter((n) => n > 0);
  const size = rng.pick(nonzero.length ? nonzero : [2, 3, 4, 5]);
  const groups = rng.int(2, 6);
  const product = size * groups;
  const hide = (params.hide as GroupsData["hide"] | undefined) ?? rng.pick(["groups", "size", "product"]);
  let prompt = "";
  let answer = "";
  let equation = "";
  if (hide === "product") {
    equation = `${groups} × ${size} = n`;
    prompt = `${groups} groups of ${size}. How many in all?`;
    answer = String(product);
  } else if (hide === "groups") {
    equation = `${size} × n = ${product}`;
    prompt = `${size} × n = ${product}`;
    answer = String(groups);
  } else {
    equation = `n × ${groups} = ${product}`;
    prompt = `${groups} groups. ${product} in all. How many in each group?`;
    answer = String(size);
  }
  return keypadQ(rng, {
    kind: "groups",
    prompt,
    hint: "Count one group, then count the groups.",
    answer,
    needsInteract: hide !== "product",
    factKey: `${Math.min(size, groups)}×${Math.max(size, groups)}`,
    data: { groups, size, hide, equation } satisfies GroupsData,
  });
}

function arrayQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const pool = (params.factors as number[] | undefined) ?? [2, 3, 4, 5, 6];
  const cols = rng.pick(pool.filter((n) => n >= 2 && n <= 8));
  const rows = rng.int(2, 6);
  const hide = rng.pick(["rows", "cols", "product"] as const);
  const product = rows * cols;
  let prompt = `${rows} rows of ${cols}. How many in all?`;
  let answer = String(product);
  if (hide === "rows") {
    prompt = `An array of ${product}. ${cols} in each row. How many rows?`;
    answer = String(rows);
  } else if (hide === "cols") {
    prompt = `An array of ${product}. ${rows} rows. How many in each row?`;
    answer = String(cols);
  }
  if (params.area) {
    prompt = hide === "product" ? `A ${rows} by ${cols} rectangle. Area?` : prompt.replace("array", "rectangle");
  }
  return keypadQ(rng, {
    kind: "array",
    prompt,
    answer,
    factKey: `${Math.min(rows, cols)}×${Math.max(rows, cols)}`,
    data: { rows, cols, hide },
  });
}

function placeValueQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  if (params.mode === "expanded") {
    const tens = rng.int(2, 9) * 10;
    const ones = rng.int(1, 9);
    const total = tens + ones;
    return keypadQ(rng, {
      kind: "placevalue",
      prompt: `${tens} + n = ${total}`,
      hint: "Tens you can see. n is the leftover ones.",
      answer: String(ones),
      data: { number: total, digit: ones, place: "ones", mode: "expanded" } satisfies PlaceValueData,
    });
  }
  if (params.mode === "word") {
    const n = rng.int(105, 9876);
    const words = wordForm(n);
    const distractors = [wordForm(n + 10), wordForm(Math.max(n - 100, 12)), wordForm(n + 1000 > 9999 ? n - 1000 : n + 1000)];
    const choices = rng.shuffle([words, ...distractors]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
    return keypadQ(rng, {
      kind: "placevalue",
      prompt: `Which is ${n.toLocaleString("en-US")} in words?`,
      answer: words,
      input: "choice",
      choices,
      data: { number: n, digit: n % 10, place: "ones", mode: "word", words } satisfies PlaceValueData,
    });
  }
  const six = Boolean(params.six);
  const digits = six ? rng.int(5, 6) : rng.int(3, 4);
  const min = digits === 3 ? 105 : digits === 4 ? 1025 : digits === 5 ? 10250 : 102500;
  const max = digits === 3 ? 980 : digits === 4 ? 9876 : digits === 5 ? 98000 : 987654;
  const n = rng.int(min, max);
  const s = String(n);
  const idx = rng.int(0, s.length - 1);
  const digit = Number(s[idx]);
  const place = PLACES[s.length - 1 - idx]!;
  const value = digit * 10 ** (s.length - 1 - idx);
  const mode = rng.pick(["place", "value"] as const);
  const pool = PLACES.slice(0, Math.max(4, s.length));
  if (mode === "place") {
    return keypadQ(rng, {
      kind: "placevalue",
      prompt: `In ${n.toLocaleString("en-US")}, what place is the ${digit} in?`,
      answer: place,
      alts: [place.replace(/s$/, "")],
      input: "choice",
      choices: rng.shuffle([...pool]),
      data: { number: n, digit, place, mode },
    });
  }
  return keypadQ(rng, {
    kind: "placevalue",
    prompt: `In ${n.toLocaleString("en-US")}, what is the value of the ${digit} in the ${place}?`,
    answer: String(value),
    data: { number: n, digit, place, mode: "value" },
  });
}

function buildQ(rng: Rng): Question {
  const thousands = rng.int(0, 9);
  const hundreds = rng.int(0, 9);
  const tens = rng.int(0, 9);
  const ones = rng.int(1, 9);
  const target = thousands * 1000 + hundreds * 100 + tens * 10 + ones;
  return keypadQ(rng, {
    kind: "build",
    prompt: `Build ${target}. How many hundreds?`,
    hint: "Thousands, hundreds, tens, ones.",
    answer: String(hundreds),
    data: { target },
  });
}

function compareQ(rng: Rng): Question {
  const a = rng.int(120, 9800);
  let b = rng.int(120, 9800);
  if (rng.next() < 0.15) b = a;
  const ans = a < b ? "<" : a > b ? ">" : "=";
  return keypadQ(rng, {
    kind: "compare",
    prompt: `${a} ○ ${b}`,
    answer: ans,
    input: "compare",
    data: { a, b },
  });
}

function orderQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  if (params.fractions) {
    const den = rng.pick([4, 5, 6, 8, 10]);
    const nums = rng.shuffle([1, 2, 3, den - 1]).slice(0, 3);
    const dir = rng.pick(["asc", "desc"] as const);
    const sorted = [...nums].sort((x, y) => (dir === "asc" ? x - y : y - x));
    return keypadQ(rng, {
      kind: "order",
      prompt: dir === "asc" ? "Least to greatest." : "Greatest to least.",
      answer: sorted.map((n) => `${n}/${den}`).join(" "),
      input: "order",
      data: { numbers: nums, dir },
      choices: nums.map((n) => `${n}/${den}`),
    });
  }
  const numbers = [rng.int(100, 9000), rng.int(100, 9000), rng.int(100, 9000)];
  const dir = rng.pick(["asc", "desc"] as const);
  const sorted = [...numbers].sort((a, b) => (dir === "asc" ? a - b : b - a));
  return keypadQ(rng, {
    kind: "order",
    prompt: dir === "asc" ? "Least to greatest." : "Greatest to least.",
    answer: sorted.join(" "),
    input: "order",
    data: { numbers, dir },
    choices: numbers.map(String),
  });
}

function familyQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const pool = ((params.factors as number[] | undefined) ?? [2, 3, 4, 5, 6]).filter((n) => n >= 2);
  const a = rng.pick(pool);
  const b = rng.int(2, 6);
  const p = a * b;
  const facts = [`${a} × ${b} = ${p}`, `${b} × ${a} = ${p}`, `${p} ÷ ${a} = ${b}`, `${p} ÷ ${b} = ${a}`];
  const ask = rng.pick(facts);
  const wrong = [
    `${a} × ${b} = ${p + a}`,
    `${p} ÷ ${a} = ${b + 1}`,
    `${a + 1} × ${b} = ${p}`,
    `${p} − ${a} = ${b}`,
  ];
  const choices = rng.shuffle([ask, rng.pick(wrong), rng.pick(wrong.filter((w) => w !== ask))]);
  return keypadQ(rng, {
    kind: "choice",
    prompt: `Which fact belongs with ${a} groups of ${b}?`,
    answer: ask,
    input: "choice",
    choices,
    factKey: `${Math.min(a, b)}×${Math.max(a, b)}`,
    data: { visual: "none" },
  });
}

function shapeQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const sides = rng.pick([3, 4, 5, 6, 8]);
  const name = SHAPE_NAMES[sides]!;
  const mode = String(params.mode ?? "name");
  if (mode === "sides") {
    const ask = rng.pick(["sides", "vertices"] as const);
    return keypadQ(rng, {
      kind: "choice",
      prompt: ask === "sides" ? "How many sides?" : "How many vertices?",
      answer: String(sides),
      data: { visual: "shape", shape: name, sides, isPolygon: true, rotation: rng.int(0, 20) },
    });
  }
  if (mode === "isPolygon") {
    const ok = rng.next() < 0.6;
    return keypadQ(rng, {
      kind: "choice",
      prompt: "Is this a polygon?",
      answer: ok ? "yes" : "no",
      input: "choice",
      choices: ["yes", "no"],
      data: { visual: "shape", shape: ok ? name : rng.pick(["circle", "open"]), sides: ok ? sides : 0, isPolygon: ok },
    });
  }
  if (mode === "attr") {
    return keypadQ(rng, {
      kind: "choice",
      prompt: `A ${name} has how many vertices?`,
      answer: String(sides),
      data: { visual: "shape", shape: name, sides, isPolygon: true },
    });
  }
  if (mode === "combine") {
    return keypadQ(rng, {
      kind: "choice",
      prompt: "Two triangles joined on a side make which polygon?",
      answer: "quadrilateral",
      alts: ["square", "rectangle", "quad"],
      input: "choice",
      choices: rng.shuffle(["triangle", "quadrilateral", "pentagon", "hexagon"]).slice(0, 4),
      data: { visual: "combine", parts: ["triangle", "triangle"], result: "quadrilateral", isPolygon: true, sides: 4, shape: "quadrilateral" },
    });
  }
  if (mode === "subdivide") {
    return keypadQ(rng, {
      kind: "choice",
      prompt: "This quadrilateral is split. How many triangles?",
      answer: "2",
      input: "choice",
      choices: ["2", "3", "4", "1"],
      data: { visual: "subdivide", shape: "quadrilateral", sides: 4, isPolygon: true },
    });
  }
  if (mode === "dataQ") {
    const ok = "How many pets does our class have?";
    const choices = rng.shuffle([ok, "What color is the sky?", "How tall will I be next year?", "Who is the fastest runner forever?"]);
    return keypadQ(rng, {
      kind: "choice",
      prompt: "Which question can we answer by collecting class data?",
      answer: ok,
      input: "choice",
      choices,
      data: { visual: "none" },
    });
  }
  return keypadQ(rng, {
    kind: "choice",
    prompt: "What is this polygon called?",
    answer: name,
    alts: sides === 4 ? ["rectangle", "square", "quad"] : [],
    input: "choice",
    choices: rng.shuffle(["triangle", "quadrilateral", "pentagon", "hexagon", "octagon"]).slice(0, 4).concat(name).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4),
    data: { visual: "shape", shape: name, sides, isPolygon: true, rotation: rng.int(-15, 15) },
  });
}

function fractionQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const den = rng.pick([...DENS]);
  const mode = String(params.mode ?? "name") as FractionData["mode"];
  if (mode === "line" || params.compare) {
    if (params.compare) {
      const den1 = rng.pick([...DENS]);
      const num1 = rng.int(1, den1);
      const num2 = rng.int(0, den1);
      const ans = num1 < num2 ? "<" : num1 > num2 ? ">" : "=";
      return keypadQ(rng, {
        kind: "fraction",
        prompt: `${num1}/${den1} ○ ${num2}/${den1} on the number line`,
        answer: ans,
        input: "compare",
        data: { num: num1, den: den1, num2, den2: den1, mode: "line", shaded: num1 },
      });
    }
    const num = rng.int(1, den);
    return keypadQ(rng, {
      kind: "fraction",
      prompt: "What fraction is marked on the number line?",
      answer: `${num}/${den}`,
      input: "fraction",
      data: { num, den, mode: "line", shaded: num },
    });
  }
  if (mode === "unit") {
    return keypadQ(rng, {
      kind: "fraction",
      prompt: `One piece of ${den}. Name the unit fraction.`,
      answer: `1/${den}`,
      input: "fraction",
      data: { num: 1, den, mode: "unit", shaded: 1 },
    });
  }
  if (mode === "leftover") {
    const shown = rng.int(1, den - 1);
    const n = den - shown;
    return keypadQ(rng, {
      kind: "fraction",
      prompt: `${shown}/${den} + n = 1. What is n?`,
      hint: "Take the pieces you can see.",
      answer: `${n}/${den}`,
      alts: [String(n)],
      input: "fraction",
      needsInteract: true,
      data: { num: shown, den, mode: "leftover", shaded: shown },
    });
  }
  if (mode === "mixed") {
    const whole = rng.int(1, 3);
    const num = rng.int(1, den - 1);
    return keypadQ(rng, {
      kind: "fraction",
      prompt: "Name the mixed number.",
      answer: `${whole} ${num}/${den}`,
      input: "fraction",
      data: { num, den, mode: "mixed", shaded: whole * den + num },
    });
  }
  if (mode === "compare") {
    const den1 = rng.pick([...DENS]);
    let den2 = rng.pick(DENS.filter((d) => d !== den1));
    const num1 = rng.int(1, den1 - 1);
    const num2 = rng.int(1, den2 - 1);
    const v1 = num1 / den1;
    const v2 = num2 / den2;
    const ans = v1 < v2 ? "<" : v1 > v2 ? ">" : "=";
    return keypadQ(rng, {
      kind: "fraction",
      prompt: `${num1}/${den1} ○ ${num2}/${den2}`,
      answer: ans,
      input: "compare",
      data: { num: num1, den: den1, num2, den2, mode: "compare", shaded: num1 },
    });
  }
  if (mode === "benchmark") {
    const num = rng.int(1, den);
    const v = num / den;
    const bench = v < 0.25 ? "0" : v < 0.75 ? "1/2" : "1";
    return keypadQ(rng, {
      kind: "fraction",
      prompt: `Is ${num}/${den} closer to 0, 1/2, or 1?`,
      answer: bench,
      input: "choice",
      choices: ["0", "1/2", "1"],
      data: { num, den, mode: "benchmark", shaded: num },
    });
  }
  if (mode === "equiv") {
    const baseDen = rng.pick([2, 3, 4, 5]);
    const k = rng.pick([2, 3]);
    const num = rng.int(1, baseDen - 1);
    return keypadQ(rng, {
      kind: "fraction",
      prompt: `${num}/${baseDen} = n/${baseDen * k}. What is n?`,
      answer: String(num * k),
      data: { num, den: baseDen, num2: num * k, den2: baseDen * k, mode: "equiv", shaded: num },
    });
  }
  const num = rng.int(1, den);
  return keypadQ(rng, {
    kind: "fraction",
    prompt: "What fraction is shaded?",
    answer: `${num}/${den}`,
    input: "fraction",
    data: { num, den, mode: "name", shaded: num },
  });
}

function clockQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const hours = rng.int(1, 12);
  const minutePool = params.nearest === "minute" ? rng.int(0, 59) : rng.pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const minutes = minutePool;
  if (String(params.mode ?? "read") === "elapsed") {
    const hoursLater = rng.pick([1, 2, 3]);
    const endH = ((hours - 1 + hoursLater) % 12) + 1;
    const endClock = `${endH}:${pad2(minutes)}`;
    return keypadQ(rng, {
      kind: "clock",
      prompt: `Start ${hours}:${pad2(minutes)}. End ${endClock}. How many hours passed?`,
      answer: String(hoursLater),
      alts: [`${hoursLater} hour`, `${hoursLater} hours`],
      input: "keypad",
      data: { hours, minutes, mode: "elapsed", elapsedHours: hoursLater, elapsedMinutes: 0, find: "elapsed" } satisfies ClockData,
    });
  }
  return keypadQ(rng, {
    kind: "clock",
    prompt: "What time is it?",
    answer: `${hours}:${pad2(minutes)}`,
    input: "clock",
    data: { hours, minutes, mode: "read", find: "time" } satisfies ClockData,
  });
}

function randomPurse(rng: Rng, max: number): { coins: Partial<Record<Coin, number>>; cents: number } {
  const coins: Partial<Record<Coin, number>> = {};
  let cents = 0;
  const order: Coin[] = rng.shuffle(["quarter", "dime", "nickel", "penny", "dollar", "five"]);
  for (const c of order) {
    const cap = c === "penny" ? 8 : c === "dollar" ? 3 : c === "five" ? 1 : 4;
    const n = rng.int(0, cap);
    if (!n) continue;
    const next = cents + n * COIN_VALUE[c];
    if (next <= max) {
      coins[c] = n;
      cents = next;
    }
  }
  if (cents === 0) {
    coins.dime = 1;
    cents = 10;
  }
  return { coins, cents };
}

function moneyQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const mode = String(params.mode ?? "count");
  const max = Number(params.max ?? 100);
  if (mode === "make") {
    const target = 100;
    const dimes = rng.int(2, 8);
    const leftover = target - dimes * 10;
    return keypadQ(rng, {
      kind: "money",
      prompt: `${dimes} dimes. How many more cents to make a dollar?`,
      answer: String(leftover),
      alts: [moneyFmt(leftover)],
      data: { coins: { dime: dimes }, target, mode: "make" } satisfies MoneyData,
    });
  }
  if (mode === "change") {
    const pay = max >= 500 ? rng.pick([100, 500]) : 100;
    const cost = rng.int(Math.max(10, pay - 90), pay - 5);
    const n = pay - cost;
    return keypadQ(rng, {
      kind: "money",
      prompt: `An item costs ${moneyFmt(cost)}. You pay ${moneyFmt(pay)}. How much change?`,
      hint: "n is leftover.",
      answer: String(n),
      alts: [moneyFmt(n)],
      needsInteract: true,
      data: { coins: pay === 500 ? { five: 1 } : { dollar: 1 }, target: pay, mode: "change", cost, pay } satisfies MoneyData,
    });
  }
  if (mode === "compare") {
    const a = randomPurse(rng, Math.min(max, 400));
    const b = randomPurse(rng, Math.min(max, 400));
    const ans = a.cents < b.cents ? "<" : a.cents > b.cents ? ">" : "=";
    return keypadQ(rng, {
      kind: "money",
      prompt: `${moneyFmt(a.cents)} ○ ${moneyFmt(b.cents)}`,
      answer: ans,
      input: "compare",
      data: { coins: a.coins, mode: "compare", otherCents: b.cents } satisfies MoneyData,
    });
  }
  const purse = randomPurse(rng, max);
  return keypadQ(rng, {
    kind: "money",
    prompt: "How many cents?",
    answer: String(purse.cents),
    alts: [moneyFmt(purse.cents)],
    data: { coins: purse.coins, mode: "count" } satisfies MoneyData,
  });
}

function areaQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const rows = rng.int(3, 5);
  const cols = rng.int(3, 6);
  const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => rng.next() > 0.25));
  if (cells.flat().every((c) => !c)) cells[0]![0] = true;
  const total = cells.flat().filter(Boolean).length;
  const hide = Boolean(params.hide);
  const hideCount = hide ? rng.int(1, Math.min(4, total - 1)) : 0;
  const shown = total - hideCount;
  return keypadQ(rng, {
    kind: "area",
    prompt: hide ? `${shown} squares showing. n hide. Area?` : "How many unit squares?",
    answer: hide ? String(hideCount) : String(total),
    alts: hide ? [String(total)] : undefined,
    needsInteract: hide,
    data: { cells, unit: "square units", hideCount } satisfies AreaData,
  });
}

function perimeterQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const sidesN = rng.pick([3, 4, 5, 6]);
  const sides = Array.from({ length: sidesN }, () => rng.int(2, 8));
  const name = SHAPE_NAMES[sidesN] ?? "polygon";
  const peri = sides.reduce((a, b) => a + b, 0);
  if (params.hide || params.mode === "leftover") {
    const hideIndex = rng.int(0, sidesN - 1);
    const shown = peri - sides[hideIndex]!;
    return keypadQ(rng, {
      kind: "perimeter",
      prompt: `A ${name}. Sides add to ${peri}. You see ${shown}. n is the missing side.`,
      answer: String(sides[hideIndex]),
      needsInteract: true,
      data: { sides, unit: "units", name, hideIndex } satisfies PerimeterData,
    });
  }
  return keypadQ(rng, {
    kind: "perimeter",
    prompt: `Perimeter of this ${name}?`,
    answer: String(peri),
    data: { sides, unit: "units", name } satisfies PerimeterData,
  });
}

function graphQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const labels = rng.shuffle(["cats", "dogs", "birds", "fish", "hamsters"]).slice(0, 4);
  const key = Number(params.key ?? rng.pick([1, 2]));
  const kind = (params.kind as "picto" | "bar") ?? "picto";
  const rows = labels.map((label) => ({ label, value: rng.int(1, 8) * key }));
  const ask = rng.pick(["greatest", "least", "value", "more", "total"] as const);
  const focus = rng.pick(rows).label;
  const focusB = rng.pick(rows.filter((r) => r.label !== focus)).label;
  const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
  let prompt = "";
  let answer = "";
  if (ask === "greatest") {
    const m = Math.max(...rows.map((r) => r.value));
    const winners = rows.filter((r) => r.value === m);
    prompt = "Which has the most?";
    answer = winners[0]!.label;
  } else if (ask === "least") {
    const m = Math.min(...rows.map((r) => r.value));
    prompt = "Which has the least?";
    answer = rows.find((r) => r.value === m)!.label;
  } else if (ask === "value") {
    prompt = `How many ${focus}?`;
    answer = String(byLabel[focus]);
  } else if (ask === "more") {
    prompt = `How many more ${focus} than ${focusB}?`;
    answer = String(Math.abs(byLabel[focus]! - byLabel[focusB]!));
  } else {
    prompt = "How many in all?";
    answer = String(rows.reduce((n, r) => n + r.value, 0));
  }
  return keypadQ(rng, {
    kind: "graph",
    prompt,
    hint: key > 1 ? `Each picture stands for ${key}.` : undefined,
    answer,
    input: ask === "greatest" || ask === "least" ? "choice" : "keypad",
    choices: ask === "greatest" || ask === "least" ? labels : undefined,
    data: {
      title: "Class pets",
      kind,
      key,
      symbol: rng.pick(SYMBOLS),
      rows,
      ask,
      focus,
      focusB,
    } satisfies GraphData,
  });
}

function patternQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const step = rng.pick(((params.steps as number[]) ?? [2, 5, 10]).filter((n) => n > 0));
  const down = params.dir === "down" || (params.dir !== "up" && rng.next() < 0.45);
  const start = down ? rng.int(20, 40) : rng.int(0, 8);
  const delta = down ? -step : step;
  const seq: (number | null)[] = Array.from({ length: 6 }, (_, i) => start + i * delta);
  if (params.mode === "describe") {
    const rule = down ? `−${step}` : `+${step}`;
    const choices = rng.shuffle([rule, down ? `+${step}` : `−${step}`, `+${step + 1}`, `×${step}`]).slice(0, 4);
    return keypadQ(rng, {
      kind: "pattern",
      prompt: "What is the rule?",
      answer: rule,
      input: "choice",
      choices,
      data: { seq, step: delta, dir: down ? "down" : "up", rule },
    });
  }
  const hide = rng.int(1, 4);
  const answer = String(seq[hide]);
  seq[hide] = null;
  return keypadQ(rng, {
    kind: "pattern",
    prompt: down ? "The pattern is shrinking. What number is hiding?" : "The pattern is growing. What number is hiding?",
    answer,
    data: { seq, step: delta, dir: down ? "down" : "up" },
  });
}

function measureQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const mode = String(params.mode ?? "read") as MeasureData["mode"];
  if (mode === "unit") {
    const items: { prompt: string; answer: string; choices: string[] }[] = [
      { prompt: "Best unit for the length of a pencil?", answer: "inch", choices: ["inch", "yard", "mile", "gallon"] },
      { prompt: "Best unit for the length of a classroom?", answer: "meter", choices: ["centimeter", "meter", "mile", "gram"] },
      { prompt: "Best unit for a watermelon?", answer: "pound", choices: ["ounce", "pound", "inch", "cup"] },
      { prompt: "Best unit for a spoon of water?", answer: "milliliter", choices: ["liter", "milliliter", "yard", "kilogram"] },
      { prompt: "Do you need an estimate or an exact measure to fill a prescription?", answer: "exact", choices: ["estimate", "exact"] },
    ];
    const item = rng.pick(items);
    return keypadQ(rng, {
      kind: "measure",
      prompt: item.prompt,
      answer: item.answer,
      input: "choice",
      choices: item.choices,
      data: { attribute: "length", system: "us", unit: item.answer, value: 0, max: 1, mode: "unit" },
    });
  }
  const attribute = (params.attribute as MeasureData["attribute"]) ?? rng.pick(["length", "mass", "volume"]);
  if (attribute === "length") {
    const metric = rng.next() < 0.5;
    const unit = metric ? rng.pick(["cm", "m"]) : rng.pick(["in", "ft"]);
    const max = unit === "m" || unit === "ft" ? 8 : 8;
    const halves = !metric && unit === "in";
    const value = halves ? rng.int(2, 14) / 2 : rng.int(2, max);
    return keypadQ(rng, {
      kind: "measure",
      prompt: `How long? (${unit})`,
      answer: String(value),
      alts: [`${value} ${unit}`],
      data: { attribute: "length", system: metric ? "metric" : "us", unit, value, max, mode: "read" },
    });
  }
  if (attribute === "mass") {
    const metric = rng.next() < 0.5;
    const unit = metric ? rng.pick(["g", "kg"]) : rng.pick(["oz", "lb"]);
    const value = rng.int(2, 8);
    return keypadQ(rng, {
      kind: "measure",
      prompt: `How heavy? (${unit})`,
      answer: String(value),
      alts: [`${value} ${unit}`],
      data: { attribute: "mass", system: metric ? "metric" : "us", unit, value, max: 10, mode: "read" },
    });
  }
  const metric = rng.next() < 0.5;
  const unit = metric ? rng.pick(["mL", "L"]) : rng.pick(["cup", "qt"]);
  const value = rng.int(1, 6);
  return keypadQ(rng, {
    kind: "measure",
    prompt: `How much liquid? (${unit})`,
    answer: String(value),
    alts: [`${value} ${unit}`],
    data: { attribute: "volume", system: metric ? "metric" : "us", unit, value, max: 8, mode: "read" },
  });
}

function computeQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const mode = String(params.mode ?? "exact") as ComputeData["mode"];
  const op: "+" | "−" = rng.next() < 0.55 ? "+" : "−";
  let a = rng.int(120, 860);
  let b = rng.int(40, 900);
  if (op === "−" && b > a) [a, b] = [b, a];
  if (op === "+" && a + b > 1000) b = 1000 - a;
  if (mode === "estimate") {
    const round = (n: number) => Math.round(n / 100) * 100;
    const ans = op === "+" ? round(a) + round(b) : round(a) - round(b);
    return keypadQ(rng, {
      kind: "compute",
      prompt: `About how much is ${a} ${op} ${b}? (nearest hundred)`,
      answer: String(ans),
      data: { a, b, op, mode: "estimate" },
    });
  }
  const ans = op === "+" ? a + b : a - b;
  return keypadQ(rng, {
    kind: "compute",
    prompt: `${a} ${op} ${b}`,
    answer: String(ans),
    data: { a, b, op, mode: "exact" },
  });
}

function fluencyQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const pool = ((params.factors as number[] | undefined) ?? [0, 1, 2, 5, 10]).slice();
  const ops = (params.ops as Array<"+" | "−" | "×" | "÷"> | undefined) ?? ["×", "÷"];
  if (ops.includes("+") && !ops.includes("×")) {
    const a = rng.int(8, 90);
    const b = rng.int(6, 40);
    const op = rng.pick(ops.filter((o) => o === "+" || o === "−"));
    if (op === "+") {
      return keypadQ(rng, {
        kind: "fluency",
        prompt: `${a} + ${b}`,
        answer: String(a + b),
        data: { a, b, op: "+" },
      });
    }
    const t = a + b;
    return keypadQ(rng, {
      kind: "fluency",
      prompt: `${t} − ${a}`,
      answer: String(b),
      data: { a: t, b: a, op: "−" },
    });
  }
  const a = rng.pick(pool);
  const b = a === 0 || a === 1 ? rng.int(0, 10) : rng.int(0, 10);
  const op: "×" | "÷" = a === 0 || b === 0 ? "×" : rng.pick(ops.filter((o) => o === "×" || o === "÷") as Array<"×" | "÷">);
  if (op === "÷") {
    const product = a * (b === 0 ? rng.int(1, 10) : b || rng.int(1, 10));
    const div = a === 0 ? rng.pick(pool.filter((n) => n > 0)) : a || 1;
    return keypadQ(rng, {
      kind: "fluency",
      prompt: `${product} ÷ ${div}`,
      answer: String(product / div),
      factKey: `${Math.min(div, product / div)}×${Math.max(div, product / div)}`,
      data: { a: product, b: div, op: "÷" },
    });
  }
  return keypadQ(rng, {
    kind: "fluency",
    prompt: `${a} × ${b}`,
    answer: String(a * b),
    factKey: `${Math.min(a, b)}×${Math.max(a, b)}`,
    data: { a, b, op: "×" },
  });
}

function wordQ(rng: Rng, params: Record<string, unknown> = {}): Question {
  const name = rng.pick(NAMES);
  const thing = rng.pick(THINGS);
  const mode = String(params.mode ?? "add");
  if (mode === "groups") {
    const groups = rng.int(2, 6);
    const size = rng.pick([2, 3, 4, 5]);
    return keypadQ(rng, {
      kind: "groups",
      prompt: `${name} has ${groups} bags of ${size} ${thing}. How many ${thing}?`,
      answer: String(groups * size),
      factKey: `${Math.min(groups, size)}×${Math.max(groups, size)}`,
      data: { groups, size, hide: "product", equation: `${groups} × ${size} = n` },
    });
  }
  if (mode === "take") {
    const total = rng.int(8, 18);
    const shown = rng.int(3, total - 2);
    return keypadQ(rng, {
      kind: "tenframe",
      prompt: `${name} had ${total} ${thing}. ${shown} are in the dish. How many are hiding?`,
      hint: "Take the ones you can see. n is hiding.",
      answer: String(total - shown),
      needsInteract: true,
      data: { total, shown, equation: `${total} − n = ${shown}` },
    });
  }
  if (mode === "compare") {
    const a = rng.int(6, 20);
    const b = rng.int(4, a);
    return keypadQ(rng, {
      kind: "compare",
      prompt: `${name} has ${a} ${thing}. A friend has ${b}. How many more does ${name} have?`,
      answer: String(a - b),
      input: "keypad",
      data: { a, b, visual: "bars" },
    });
  }
  if (mode === "two" || mode === "mixed") {
    const groups = rng.int(2, 5);
    const size = rng.pick([2, 3, 4, 5]);
    const extra = rng.int(1, 8);
    const add = rng.next() < 0.5;
    const product = groups * size;
    const answer = add ? product + extra : Math.max(product - extra, 0);
    return keypadQ(rng, {
      kind: "groups",
      prompt: add
        ? `${name} has ${groups} packs of ${size} ${thing}, then finds ${extra} more. How many now?`
        : `${name} has ${groups} packs of ${size} ${thing} and gives away ${extra}. How many left?`,
      hint: "Groups first. Then add or take. Scratch pad is there.",
      answer: String(answer),
      data: { groups, size, hide: "product", equation: `${groups} × ${size}` },
    });
  }
  const shown = rng.int(4, 9);
  const n = rng.int(2, 6);
  return keypadQ(rng, {
    kind: "tenframe",
    prompt: `${name} sees ${shown} ${thing}. Some are hiding. There are ${shown + n} in all. How many hide?`,
    hint: "Take the dots you can see. n is what's hiding.",
    answer: String(n),
    needsInteract: true,
    data: { total: shown + n, shown, equation: `${shown} + n = ${shown + n}` },
  });
}

export function makeQuestion(activity: ActivityDef, rng: Rng): Question {
  const p = activity.params ?? {};
  let q: Question;
  switch (activity.kind) {
    case "tenframe":
      q = tenframeQ(rng, p);
      break;
    case "groups":
      q = groupsQ(rng, p);
      break;
    case "array":
      q = arrayQ(rng, p);
      break;
    case "placevalue":
      q = placeValueQ(rng, p);
      break;
    case "build":
      q = buildQ(rng);
      break;
    case "compare":
      q = compareQ(rng);
      break;
    case "order":
      q = orderQ(rng, p);
      break;
    case "choice":
      q = p.mode === "family" ? familyQ(rng, p) : shapeQ(rng, p);
      break;
    case "fraction":
      q = fractionQ(rng, p);
      break;
    case "clock":
      q = clockQ(rng, p);
      break;
    case "money":
      q = moneyQ(rng, p);
      break;
    case "area":
      q = areaQ(rng, p);
      break;
    case "perimeter":
      q = perimeterQ(rng, p);
      break;
    case "graph":
      q = graphQ(rng, p);
      break;
    case "pattern":
      q = patternQ(rng, p);
      break;
    case "word":
      q = wordQ(rng, p);
      break;
    case "fluency":
      q = fluencyQ(rng, p);
      break;
    case "measure":
      q = measureQ(rng, p);
      break;
    case "compute":
      q = computeQ(rng, p);
      break;
    default:
      q = tenframeQ(rng, p);
  }
  return { ...q, sol: activity.sol };
}

export function makeWelcomeRound(rng: Rng = rngRandom()): Question[] {
  const first = welcomeFirst(rng);
  const rest = [tenframeQ(rng, { maxTotal: 10 }), tenframeQ(rng, { minTotal: 8, maxTotal: 10 }), tenframeQ(rng, { minTotal: 10, maxTotal: 14 })];
  return [first, ...rest];
}

export function makeActivityRound(activity: ActivityDef, rng: Rng = rngRandom(), count?: number): Question[] {
  const n = count ?? activity.rounds;
  const seen = new Set<string>();
  const out: Question[] = [];
  let guard = 0;
  while (out.length < n && guard < n * 8) {
    guard += 1;
    const q = makeQuestion(activity, rng);
    const key = `${q.prompt}|${q.answer}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  while (out.length < n) out.push(makeQuestion(activity, rng));
  return out;
}

export function makeFluencyItem(rng: Rng, factors: number[]): Question {
  return fluencyQ(rng, { factors, ops: ["×", "÷"] });
}

export function withSource(q: Question, source: ItemSource): Question {
  return { ...q, source };
}
