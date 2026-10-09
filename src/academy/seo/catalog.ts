import { formatClockTime } from "../../lib/clock";

export type SheetGame = "times" | "add" | "time" | "money" | "count" | "place" | "shapes" | "fractions" | "measure" | "phonics" | "problems";

export interface CoinCounts {
  penny?: number;
  nickel?: number;
  dime?: number;
  quarter?: number;
  dollar?: number;
}

export interface StaticItem {
  prompt: string;
  answer: string;
  clock?: { hours: number; minutes: number };
  pile?: CoinCounts;
  /** Price in cents when the child pays with $1. */
  changeFromDollar?: number;
}

export interface StaticSheet {
  slug: string;
  title: string;
  description: string;
  h1: string;
  game: SheetGame;
  items: StaticItem[];
}

const COIN_WORDS: Record<keyof CoinCounts, [string, string]> = {
  dollar: ["dollar", "dollars"],
  quarter: ["quarter", "quarters"],
  dime: ["dime", "dimes"],
  nickel: ["nickel", "nickels"],
  penny: ["penny", "pennies"],
};

export function coinCents(pile: CoinCounts): number {
  return (
    (pile.penny ?? 0) +
    (pile.nickel ?? 0) * 5 +
    (pile.dime ?? 0) * 10 +
    (pile.quarter ?? 0) * 25 +
    (pile.dollar ?? 0) * 100
  );
}

export function formatMoney(cents: number): string {
  const safe = Math.max(0, Math.floor(cents));
  if (safe < 100) return `${safe}¢`;
  const dollars = Math.floor(safe / 100);
  const rest = safe % 100;
  if (rest === 0) return `$${dollars}`;
  return `$${dollars}.${String(rest).padStart(2, "0")}`;
}

export function describeCoins(pile: CoinCounts): string {
  const order: (keyof CoinCounts)[] = ["dollar", "quarter", "dime", "nickel", "penny"];
  const parts: string[] = [];
  for (const kind of order) {
    const n = pile[kind] ?? 0;
    if (n <= 0) continue;
    const labels = COIN_WORDS[kind];
    parts.push(`${n} ${n === 1 ? labels[0] : labels[1]}`);
  }
  if (parts.length === 0) return "no coins";
  if (parts.length === 1) return parts[0]!;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function timesSheet(factor: number): StaticSheet {
  const items: StaticItem[] = [];
  for (let n = 1; n <= 10; n++) {
    items.push({ prompt: `${factor} × ${n} =`, answer: String(factor * n) });
  }
  return {
    slug: `multiplication-${factor}s`,
    title: `Free Multiplication by ${factor}s Worksheet (K–3) | Squishee Academy`,
    description: `Print a free ${factor}s times table for grades K–3. Ten problems, an answer key, and no signup.`,
    h1: `Multiplication by ${factor}s`,
    game: "times",
    items,
  };
}

function arithmeticSheet(
  spec: Omit<StaticSheet, "items" | "game"> & { game: "add" },
  rows: Array<[number, number, "+" | "-"]>,
): StaticSheet {
  return {
    ...spec,
    items: rows.map(([a, b, op]) => {
      const sign = op === "+" ? "+" : "−";
      const answer = op === "+" ? a + b : a - b;
      return { prompt: `${a} ${sign} ${b} =`, answer: String(answer) };
    }),
  };
}

function timeSheet(spec: Omit<StaticSheet, "items" | "game">, clocks: Array<[number, number]>): StaticSheet {
  return {
    ...spec,
    game: "time",
    items: clocks.map(([hours, minutes]) => ({
      prompt: "What time is it?",
      answer: formatClockTime(hours, minutes),
      clock: { hours, minutes },
    })),
  };
}

function countItem(pile: CoinCounts): StaticItem {
  return {
    prompt: `Count the coins: ${describeCoins(pile)}.`,
    answer: formatMoney(coinCents(pile)),
    pile,
  };
}

function changeItem(price: number): StaticItem {
  return {
    prompt: `You pay with $1. The price is ${price}¢. How much change?`,
    answer: formatMoney(100 - price),
    changeFromDollar: price,
  };
}

function moneySheet(spec: Omit<StaticSheet, "items" | "game">, items: StaticItem[]): StaticSheet {
  return { ...spec, game: "money", items };
}

const MIXED_PRODUCTS: Array<[number, number]> = [
  [3, 4],
  [6, 7],
  [8, 2],
  [5, 9],
  [4, 8],
  [7, 6],
  [9, 3],
  [2, 8],
  [6, 5],
  [9, 9],
  [4, 7],
  [8, 6],
];

export const WORKSHEETS: readonly StaticSheet[] = [
  timesSheet(2),
  timesSheet(3),
  timesSheet(4),
  timesSheet(5),
  timesSheet(6),
  timesSheet(7),
  timesSheet(8),
  timesSheet(9),
  timesSheet(10),
  {
    slug: "multiplication-mixed",
    title: "Free Mixed Multiplication Worksheet (K–3) | Squishee Academy",
    description: "Print a free mixed times table worksheet for grades K–3. Facts through the 9s, with an answer key. No signup.",
    h1: "Mixed multiplication facts",
    game: "times",
    items: MIXED_PRODUCTS.map(([a, b]) => ({ prompt: `${a} × ${b} =`, answer: String(a * b) })),
  },
  arithmeticSheet(
    {
      slug: "addition-within-10",
      title: "Free Addition Within 10 Worksheet (K–3) | Squishee Academy",
      description: "Print a free addition worksheet for sums within 10. Made for kindergarten and grade 1, with an answer key. No signup.",
      h1: "Addition within 10",
      game: "add",
    },
    [
      [2, 3, "+"],
      [4, 4, "+"],
      [1, 6, "+"],
      [5, 5, "+"],
      [3, 7, "+"],
      [0, 8, "+"],
      [2, 6, "+"],
      [4, 1, "+"],
      [9, 1, "+"],
      [3, 2, "+"],
    ],
  ),
  arithmeticSheet(
    {
      slug: "addition-within-20",
      title: "Free Addition Within 20 Worksheet (K–3) | Squishee Academy",
      description: "Print a free addition worksheet for sums within 20. Grades K–3, with an answer key. No signup.",
      h1: "Addition within 20",
      game: "add",
    },
    [
      [9, 8, "+"],
      [7, 6, "+"],
      [12, 5, "+"],
      [11, 8, "+"],
      [4, 13, "+"],
      [15, 4, "+"],
      [6, 9, "+"],
      [10, 10, "+"],
      [8, 7, "+"],
      [14, 3, "+"],
    ],
  ),
  arithmeticSheet(
    {
      slug: "subtraction-within-10",
      title: "Free Subtraction Within 10 Worksheet (K–3) | Squishee Academy",
      description: "Print a free subtraction worksheet for facts within 10. Grades K–3, with an answer key. No signup.",
      h1: "Subtraction within 10",
      game: "add",
    },
    [
      [9, 4, "-"],
      [8, 3, "-"],
      [7, 2, "-"],
      [10, 6, "-"],
      [6, 1, "-"],
      [5, 0, "-"],
      [8, 8, "-"],
      [9, 5, "-"],
      [7, 4, "-"],
      [10, 7, "-"],
    ],
  ),
  arithmeticSheet(
    {
      slug: "subtraction-within-20",
      title: "Free Subtraction Within 20 Worksheet (K–3) | Squishee Academy",
      description: "Print a free subtraction worksheet for facts within 20. Grades K–3, with an answer key. No signup.",
      h1: "Subtraction within 20",
      game: "add",
    },
    [
      [15, 7, "-"],
      [18, 9, "-"],
      [20, 8, "-"],
      [14, 6, "-"],
      [13, 5, "-"],
      [16, 9, "-"],
      [12, 4, "-"],
      [19, 11, "-"],
      [17, 8, "-"],
      [11, 3, "-"],
    ],
  ),
  arithmeticSheet(
    {
      slug: "addition-and-subtraction",
      title: "Free Addition and Subtraction Worksheet (K–3) | Squishee Academy",
      description: "Print a free mixed addition and subtraction worksheet for grades K–3. An answer key is on the page. No signup.",
      h1: "Addition and subtraction",
      game: "add",
    },
    [
      [8, 5, "+"],
      [12, 4, "-"],
      [6, 7, "+"],
      [15, 6, "-"],
      [9, 9, "+"],
      [11, 2, "-"],
      [4, 8, "+"],
      [18, 9, "-"],
      [7, 3, "+"],
      [16, 7, "-"],
    ],
  ),
  timeSheet(
    {
      slug: "telling-time-to-the-hour",
      title: "Free Telling Time to the Hour Worksheet (K–3) | Squishee Academy",
      description: "Print a free o'clock worksheet for grades K–3. Analog clocks and an answer key. No signup.",
      h1: "Telling time to the hour",
    },
    [
      [1, 0],
      [3, 0],
      [6, 0],
      [9, 0],
      [12, 0],
      [4, 0],
      [7, 0],
      [10, 0],
      [2, 0],
      [8, 0],
    ],
  ),
  timeSheet(
    {
      slug: "telling-time-half-hour",
      title: "Free Half Hour Worksheet (K–3) | Squishee Academy",
      description: "Print a free half-hour clock worksheet for grades K–3. Analog clocks and an answer key. No signup.",
      h1: "Telling time to the half hour",
    },
    [
      [1, 30],
      [2, 30],
      [4, 30],
      [5, 30],
      [7, 30],
      [8, 30],
      [10, 30],
      [11, 30],
      [3, 30],
      [6, 30],
    ],
  ),
  timeSheet(
    {
      slug: "telling-time-quarter-hour",
      title: "Free Quarter Hour Worksheet (K–3) | Squishee Academy",
      description: "Print a free quarter-hour clock worksheet for grades K–3. :00, :15, :30, and :45, with an answer key. No signup.",
      h1: "Telling time to the quarter hour",
    },
    [
      [12, 0],
      [12, 15],
      [12, 30],
      [12, 45],
      [3, 15],
      [6, 30],
      [9, 45],
      [1, 0],
      [7, 15],
      [10, 45],
    ],
  ),
  timeSheet(
    {
      slug: "telling-time-five-minutes",
      title: "Free Telling Time to Five Minutes Worksheet (K–3) | Squishee Academy",
      description: "Print a free five-minute clock worksheet for grades K–3. Analog clocks and an answer key. No signup.",
      h1: "Telling time to five minutes",
    },
    [
      [1, 5],
      [2, 10],
      [3, 15],
      [4, 20],
      [5, 25],
      [6, 30],
      [7, 35],
      [8, 40],
      [9, 45],
      [10, 50],
      [11, 55],
      [12, 0],
    ],
  ),
  moneySheet(
    {
      slug: "counting-coins",
      title: "Free Counting Coins Worksheet (K–3) | Squishee Academy",
      description: "Print a free coin-counting worksheet for grades K–3. Pennies, nickels, dimes, and quarters, with an answer key. No signup.",
      h1: "Counting coins",
    },
    [
      countItem({ quarter: 1, dime: 1, penny: 3 }),
      countItem({ dime: 2, nickel: 1 }),
      countItem({ quarter: 2 }),
      countItem({ nickel: 3, penny: 4 }),
      countItem({ dime: 1, nickel: 2, penny: 2 }),
      countItem({ quarter: 1, nickel: 1, penny: 1 }),
      countItem({ dime: 3 }),
      countItem({ quarter: 3, dime: 1 }),
      countItem({ nickel: 4 }),
      countItem({ quarter: 1, dime: 2, nickel: 1 }),
    ],
  ),
  moneySheet(
    {
      slug: "counting-pennies-and-nickels",
      title: "Free Pennies and Nickels Worksheet (K–3) | Squishee Academy",
      description: "Print a free pennies and nickels worksheet for grades K–3. Count the coins and check the answer key. No signup.",
      h1: "Counting pennies and nickels",
    },
    [
      countItem({ penny: 4 }),
      countItem({ nickel: 1 }),
      countItem({ nickel: 1, penny: 3 }),
      countItem({ nickel: 2 }),
      countItem({ nickel: 2, penny: 4 }),
      countItem({ penny: 8 }),
      countItem({ nickel: 3, penny: 2 }),
      countItem({ nickel: 4, penny: 1 }),
      countItem({ nickel: 1, penny: 1 }),
      countItem({ nickel: 3 }),
    ],
  ),
  moneySheet(
    {
      slug: "counting-dimes-and-quarters",
      title: "Free Dimes and Quarters Worksheet (K–3) | Squishee Academy",
      description: "Print a free dimes and quarters worksheet for grades K–3. An answer key is on the page. No signup.",
      h1: "Counting dimes and quarters",
    },
    [
      countItem({ dime: 1 }),
      countItem({ quarter: 1 }),
      countItem({ dime: 2 }),
      countItem({ quarter: 1, dime: 1 }),
      countItem({ quarter: 2 }),
      countItem({ dime: 4 }),
      countItem({ quarter: 1, dime: 2 }),
      countItem({ quarter: 3 }),
      countItem({ dime: 3, quarter: 1 }),
      countItem({ quarter: 2, dime: 1 }),
    ],
  ),
  moneySheet(
    {
      slug: "making-change",
      title: "Free Making Change Worksheet (K–3) | Squishee Academy",
      description: "Print a free making-change worksheet for grades K–3. Pay with one dollar and find the change. Answer key included. No signup.",
      h1: "Making change from a dollar",
    },
    [65, 40, 25, 99, 30, 10, 80, 45, 15, 50].map(changeItem),
  ),
  moneySheet(
    {
      slug: "dollars-and-cents",
      title: "Free Dollars and Cents Worksheet (K–3) | Squishee Academy",
      description: "Print a free dollars and cents worksheet for grades 2–3. Bills and coins, with an answer key. No signup.",
      h1: "Dollars and cents",
    },
    [
      countItem({ dollar: 1 }),
      countItem({ dollar: 1, quarter: 1 }),
      countItem({ dollar: 1, dime: 2, nickel: 1 }),
      countItem({ dollar: 1, penny: 8 }),
      countItem({ dollar: 2 }),
      countItem({ dollar: 1, quarter: 2, dime: 1 }),
      countItem({ dollar: 1, nickel: 3 }),
      countItem({ dollar: 2, dime: 1 }),
      countItem({ dollar: 1, quarter: 1, penny: 2 }),
      countItem({ dollar: 1, dime: 1, nickel: 1, penny: 3 }),
    ],
  ),
  {
    slug: "counting-to-20",
    title: "Free Counting to 20 Worksheet (K–3) | Squishee Academy",
    description: "Print a free counting worksheet for kindergarten through grade 3. Count to 20, compare more and less, and find the number before and after. Answer key included. No signup.",
    h1: "Counting to 20",
    game: "count",
    items: [
      { prompt: "Count the stars: ★★", answer: "2" },
      { prompt: "Count the stars: ★★★★", answer: "4" },
      { prompt: "Count the stars: ★★★★★★★", answer: "7" },
      { prompt: "Count the stars: ★★★★★★★★★★", answer: "10" },
      { prompt: "Count the stars: ★★★★★★★★★★★★★★★", answer: "15" },
      { prompt: "What number comes after 6?", answer: "7" },
      { prompt: "What number comes after 14?", answer: "15" },
      { prompt: "What number comes before 9?", answer: "8" },
      { prompt: "Which is more, 3 or 8?", answer: "8" },
      { prompt: "Which is less, 4 or 1?", answer: "1" },
    ],
  },
  {
    slug: "place-value-blocks",
    title: "Free Place Value Worksheet (Grades 1–3) | Squishee Academy",
    description: "Print a free place value worksheet for grades 1–3. Tens and ones, expanded form, comparing numbers, and rounding. Answer key included. No signup.",
    h1: "Place value blocks",
    game: "place",
    items: [
      { prompt: "3 tens and 4 ones =", answer: "34" },
      { prompt: "6 tens and 0 ones =", answer: "60" },
      { prompt: "Write 47 in expanded form.", answer: "40 + 7" },
      { prompt: "Write 305 in expanded form.", answer: "300 + 0 + 5" },
      { prompt: "Which is greater, 28 or 82?", answer: "82" },
      { prompt: "Which is less, 19 or 91?", answer: "19" },
      { prompt: "Round 46 to the nearest 10.", answer: "50" },
      { prompt: "Round 32 to the nearest 10.", answer: "30" },
      { prompt: "Round 250 to the nearest 100.", answer: "300" },
      { prompt: "Round 640 to the nearest 100.", answer: "600" },
    ],
  },
  {
    slug: "naming-shapes",
    title: "Free Shapes Worksheet (K–3) | Squishee Academy",
    description: "Print a free shapes worksheet for grades K–3. Name flat and solid shapes, count sides, and find lines of symmetry. Answer key included. No signup.",
    h1: "Naming shapes",
    game: "shapes",
    items: [
      { prompt: "Name the flat shape with 3 sides.", answer: "triangle" },
      { prompt: "Name the flat shape with 4 equal sides.", answer: "square" },
      { prompt: "Name the flat shape with no corners.", answer: "circle" },
      { prompt: "Name the flat shape with 4 sides that is longer than it is tall.", answer: "rectangle" },
      { prompt: "Name the solid that rolls every way.", answer: "sphere" },
      { prompt: "Name the solid with a point and a round base.", answer: "cone" },
      { prompt: "Name the solid with 6 square faces.", answer: "cube" },
      { prompt: "How many sides does a pentagon have?", answer: "5" },
      { prompt: "How many sides does a hexagon have?", answer: "6" },
      { prompt: "How many lines of symmetry does a square have?", answer: "4" },
    ],
  },
  {
    slug: "fractions-of-a-whole",
    title: "Free Fractions Worksheet (Grades 1–3) | Squishee Academy",
    description: "Print a free fractions worksheet for grades 1–3. Parts of a whole, comparing fractions, and equivalent fractions. Answer key included. No signup.",
    h1: "Fractions of a whole",
    game: "fractions",
    items: [
      { prompt: "1 of 2 equal parts are shaded. What fraction?", answer: "1/2" },
      { prompt: "1 of 4 equal parts are shaded. What fraction?", answer: "1/4" },
      { prompt: "3 of 4 equal parts are shaded. What fraction?", answer: "3/4" },
      { prompt: "2 of 4 equal parts are shaded. What fraction?", answer: "2/4" },
      { prompt: "1 of 3 equal parts is shaded. What unit fraction?", answer: "1/3" },
      { prompt: "1 of 8 equal parts is shaded. What unit fraction?", answer: "1/8" },
      { prompt: "Which is greater, 1/4 or 3/4?", answer: "3/4" },
      { prompt: "Which is greater, 1/8 or 1/2?", answer: "1/2" },
      { prompt: "Which fraction matches 1/2?", answer: "2/4" },
      { prompt: "Which fraction matches 1/3?", answer: "2/6" },
    ],
  },
  {
    slug: "measuring-length",
    title: "Free Measurement Worksheet (K–3) | Squishee Academy",
    description: "Print a free measurement worksheet for kindergarten through grade 3. Compare length, read a ruler, and read a graph. Answer key included. No signup.",
    h1: "Measuring length",
    game: "measure",
    items: [
      { prompt: "Which is longer, 3 units or 7 units?", answer: "7" },
      { prompt: "Which is shorter, 9 units or 4 units?", answer: "4" },
      { prompt: "Which is longer, 6 units or 2 units?", answer: "6" },
      { prompt: "The ribbon goes from 0 to 5 on the ruler. How many inches?", answer: "5" },
      { prompt: "The ribbon goes from 0 to 8 on the ruler. How many inches?", answer: "8" },
      { prompt: "The ribbon goes from 0 to 12 on the ruler. How many inches?", answer: "12" },
      { prompt: "The graph shows 🍎🍎🍎🍎 apples. How many apples?", answer: "4" },
      { prompt: "The graph shows ▮▮▮▮▮▮ apples. How many apples?", answer: "6" },
      { prompt: "There are 6 cats and 2 dogs. How many more cats?", answer: "4" },
      { prompt: "There are 8 cats and 3 dogs. How many more cats?", answer: "5" },
    ],
  },
  {
    slug: "phonics-beginning-sounds",
    title: "Free Phonics Worksheet (K–3) | Squishee Academy",
    description: "Print a free phonics worksheet for kindergarten through grade 3. Beginning sounds, rhymes, and CVC blending. Answer key included. No signup.",
    h1: "Beginning sounds",
    game: "phonics",
    items: [
      { prompt: "Which word starts with the mmm sound: moon, sun, pig, dog?", answer: "moon" },
      { prompt: "Which word starts with the sss sound: moon, sun, pig, dog?", answer: "sun" },
      { prompt: "Which word starts with the puh sound: moon, sun, pig, dog?", answer: "pig" },
      { prompt: "Which word starts with the aaa sound: apple, egg, igloo, octopus?", answer: "apple" },
      { prompt: "Which word rhymes with cat: hat, pig, sun, dog?", answer: "hat" },
      { prompt: "Which word rhymes with pig: wig, cat, sun, dog?", answer: "wig" },
      { prompt: "Which word rhymes with hop: top, cat, sun, dog?", answer: "top" },
      { prompt: "Blend c-a-t.", answer: "cat" },
      { prompt: "Blend m-a-n.", answer: "man" },
      { prompt: "Blend p-i-g.", answer: "pig" },
    ],
  },
  {
    slug: "addition-word-problems",
    title: "Free Word Problems Worksheet (K–3) | Squishee Academy",
    description: "Print a free word problem worksheet for kindergarten through grade 3. Add, subtract, multiply, and share stories with an answer key. No signup.",
    h1: "Addition word problems",
    game: "problems",
    items: [
      { prompt: "Peach has 3 apples. Frog brings 2 more. How many apples?", answer: "5" },
      { prompt: "Peach has 4 apples. Frog brings 4 more. How many apples?", answer: "8" },
      { prompt: "Peach has 2 apples. Frog brings 5 more. How many apples?", answer: "7" },
      { prompt: "Bear has 8 fish and gives 3 to Panda. How many fish are left?", answer: "5" },
      { prompt: "Bear has 12 fish and gives 4 to Panda. How many fish are left?", answer: "8" },
      { prompt: "Panda has 3 bags with 4 stars in each bag. How many stars?", answer: "12" },
      { prompt: "Panda has 2 bags with 5 stars in each bag. How many stars?", answer: "10" },
      { prompt: "Fox has 12 cookies shared with 3 friends. How many cookies does each friend get?", answer: "4" },
      { prompt: "Fox has 10 cookies shared with 2 friends. How many cookies does each friend get?", answer: "5" },
      { prompt: "Peach has 6 apples. Frog brings 3 more. How many apples?", answer: "9" },
    ],
  },
];

export function sheetBySlug(slug: string): StaticSheet | undefined {
  return WORKSHEETS.find((sheet) => sheet.slug === slug);
}
