import type { StoryGrade } from "./band";
import { SHELF_STORIES } from "./shelf";

export const STORY_PROPS = ["hat", "mat", "sun", "bug", "cup", "kite", "fish", "log", "snack", "moon", "house", "boat"] as const;
export type StoryProp = (typeof STORY_PROPS)[number];

/** Where each prop belongs in the scene. Default for unknown props is ground. */
export const STORY_PROP_PLACEMENTS = {
  hat: "ground",
  mat: "ground",
  sun: "sky",
  bug: "ground",
  cup: "ground",
  kite: "sky",
  fish: "water",
  log: "ground",
  snack: "ground",
  moon: "sky",
  house: "ground",
  boat: "water",
} as const satisfies Record<StoryProp, "ground" | "sky" | "water">;
export type StoryPropPlacement = (typeof STORY_PROP_PLACEMENTS)[StoryProp];

export function storyPropPlacement(id: StoryProp): StoryPropPlacement {
  return STORY_PROP_PLACEMENTS[id];
}

export const STORY_BACKGROUNDS = [
  "meadow",
  "garden",
  "night",
  "shore-split",
  "dock-split",
  "room",
  "kitchen",
  "bedroom",
] as const;
export type StoryBackground = (typeof STORY_BACKGROUNDS)[number];

/** Zones each background supports for prop placement checks. */
export const STORY_BACKGROUND_ZONES = {
  meadow: ["ground", "sky"],
  garden: ["ground", "sky"],
  night: ["ground", "sky"],
  "shore-split": ["ground", "sky", "water"],
  "dock-split": ["ground", "sky", "water"],
  room: ["ground"],
  kitchen: ["ground"],
  bedroom: ["ground", "sky"],
} as const satisfies Record<StoryBackground, readonly StoryPropPlacement[]>;

export type StoryMood = "day" | "night" | "water";

export type StoryPicture =
  | { kind: "pal"; id: string }
  | { kind: "prop"; id: StoryProp };

export interface StoryChoice {
  id: string;
  label: string;
  picture: StoryPicture;
}

export interface StoryCheck {
  prompt: string;
  /** Page index that shows the answer again after a miss. */
  page: number;
  choices: readonly [StoryChoice, StoryChoice];
  answer: string;
}

export interface StoryPage {
  text: string;
  pals: readonly string[];
  prop?: StoryProp;
  mood: StoryMood;
  /** Stable across locales; each page explicitly chooses its setting. */
  background: StoryBackground;
}

export interface Story {
  id: string;
  title: string;
  grade: StoryGrade;
  /** Squishee ids who appear. Their names are allowed words. */
  cast: readonly string[];
  pages: readonly StoryPage[];
  checks: readonly StoryCheck[];
}

export const STORIES: readonly Story[] = [
  {
    id: "pk-peach-cat",
    title: "The cat",
    grade: "PK",
    cast: ["peach", "cat"],
    pages: [
      { text: "Peach can see a cat.", pals: ["peach", "cat"], mood: "day", background: "meadow" },
      { text: "The cat is little.", pals: ["cat"], mood: "day", background: "meadow" },
      { text: "Look! The cat can jump.", pals: ["cat"], mood: "day", background: "meadow" },
      { text: "Peach and the cat play.", pals: ["peach", "cat"], mood: "day", background: "meadow" },
      { text: "I see a big hug.", pals: ["peach", "cat"], mood: "day", background: "meadow" },
    ],
    checks: [
      {
        prompt: "See the cat.",
        page: 0,
        answer: "cat",
        choices: [
          { id: "cat", label: "cat", picture: { kind: "pal", id: "cat" } },
          { id: "pig", label: "pig", picture: { kind: "pal", id: "pig" } },
        ],
      },
      {
        prompt: "The cat can jump.",
        page: 2,
        answer: "cat",
        choices: [
          { id: "cat", label: "cat", picture: { kind: "pal", id: "cat" } },
          { id: "peach", label: "Peach", picture: { kind: "pal", id: "peach" } },
        ],
      },
    ],
  },
  {
    id: "pk-frog-hop",
    title: "Frog can hop",
    grade: "PK",
    cast: ["frog"],
    pages: [
      { text: "Frog can hop.", pals: ["frog"], mood: "day", background: "meadow" },
      { text: "Hop, hop, hop!", pals: ["frog"], mood: "day", background: "meadow" },
      { text: "The frog is red.", pals: ["frog"], mood: "day", background: "meadow" },
      { text: "Look! The sun.", pals: ["frog"], prop: "sun", mood: "day", background: "meadow" },
      { text: "We play. We jump.", pals: ["frog"], mood: "day", background: "meadow" },
    ],
    checks: [
      {
        prompt: "See the frog.",
        page: 0,
        answer: "frog",
        choices: [
          { id: "frog", label: "Frog", picture: { kind: "pal", id: "frog" } },
          { id: "cat", label: "cat", picture: { kind: "pal", id: "cat" } },
        ],
      },
      {
        prompt: "Frog can hop.",
        page: 1,
        answer: "frog",
        choices: [
          { id: "frog", label: "Frog", picture: { kind: "pal", id: "frog" } },
          { id: "pig", label: "pig", picture: { kind: "pal", id: "pig" } },
        ],
      },
    ],
  },
  {
    id: "k-bunny-hat",
    title: "The red hat",
    grade: "K",
    cast: ["bunny"],
    pages: [
      { text: "Bunny can see a red hat.", pals: ["bunny"], prop: "hat", mood: "day", background: "room" },
      { text: "The hat is little.", pals: ["bunny"], prop: "hat", mood: "day", background: "room" },
      { text: "Where is the hat?", pals: ["bunny"], mood: "day", background: "room" },
      { text: "It is on the mat.", pals: ["bunny"], prop: "mat", mood: "day", background: "room" },
      { text: "Bunny ran to the hat.", pals: ["bunny"], prop: "hat", mood: "day", background: "room" },
      { text: "We like the red hat.", pals: ["bunny"], prop: "hat", mood: "day", background: "room" },
    ],
    checks: [
      {
        prompt: "Where is the hat?",
        page: 3,
        answer: "mat",
        choices: [
          { id: "mat", label: "mat", picture: { kind: "prop", id: "mat" } },
          { id: "cup", label: "cup", picture: { kind: "prop", id: "cup" } },
        ],
      },
      {
        prompt: "See the red hat.",
        page: 0,
        answer: "hat",
        choices: [
          { id: "hat", label: "hat", picture: { kind: "prop", id: "hat" } },
          { id: "sun", label: "sun", picture: { kind: "prop", id: "sun" } },
        ],
      },
    ],
  },
  {
    id: "k-pig-bug",
    title: "A little bug",
    grade: "K",
    cast: ["pig"],
    pages: [
      { text: "Pig can see a bug.", pals: ["pig"], prop: "bug", mood: "day", background: "garden" },
      { text: "The bug is little.", pals: ["pig"], prop: "bug", mood: "day", background: "garden" },
      { text: "The bug is on a cup.", pals: ["pig"], prop: "cup", mood: "day", background: "garden" },
      { text: "Pig said, Come here.", pals: ["pig"], mood: "day", background: "garden" },
      { text: "The bug can hop.", pals: ["pig"], prop: "bug", mood: "day", background: "garden" },
      { text: "Pig and the bug play.", pals: ["pig"], prop: "bug", mood: "day", background: "garden" },
    ],
    checks: [
      {
        prompt: "See the bug.",
        page: 0,
        answer: "bug",
        choices: [
          { id: "bug", label: "bug", picture: { kind: "prop", id: "bug" } },
          { id: "cat", label: "cat", picture: { kind: "pal", id: "cat" } },
        ],
      },
      {
        prompt: "The bug is on a cup.",
        page: 2,
        answer: "cup",
        choices: [
          { id: "cup", label: "cup", picture: { kind: "prop", id: "cup" } },
          { id: "hat", label: "hat", picture: { kind: "prop", id: "hat" } },
        ],
      },
    ],
  },
  {
    id: "g1-fox-kite",
    title: "The red kite",
    grade: "1",
    cast: ["fox"],
    pages: [
      { text: "Fox has a red kite.", pals: ["fox"], prop: "kite", mood: "day", background: "meadow" },
      { text: "The kite can fly.", pals: ["fox"], prop: "kite", mood: "day", background: "meadow" },
      { text: "Look! It went up.", pals: ["fox"], prop: "kite", mood: "day", background: "meadow" },
      { text: "Then the kite came down.", pals: ["fox"], prop: "kite", mood: "day", background: "meadow" },
      { text: "Fox ran to get the kite.", pals: ["fox"], prop: "kite", mood: "day", background: "meadow" },
      { text: "He will fly it again.", pals: ["fox"], prop: "kite", mood: "day", background: "meadow" },
      { text: "Fox is glad.", pals: ["fox"], mood: "day", background: "meadow" },
    ],
    checks: [
      {
        prompt: "Who has a kite?",
        page: 0,
        answer: "fox",
        choices: [
          { id: "fox", label: "Fox", picture: { kind: "pal", id: "fox" } },
          { id: "pig", label: "pig", picture: { kind: "pal", id: "pig" } },
        ],
      },
      {
        prompt: "The kite can fly.",
        page: 1,
        answer: "kite",
        choices: [
          { id: "kite", label: "kite", picture: { kind: "prop", id: "kite" } },
          { id: "hat", label: "hat", picture: { kind: "prop", id: "hat" } },
        ],
      },
    ],
  },
  {
    id: "g1-duck-fish",
    title: "Duck can swim",
    grade: "1",
    cast: ["duck"],
    pages: [
      { text: "Duck can see the fish.", pals: ["duck"], prop: "fish", mood: "water", background: "shore-split" },
      { text: "The fish can swim.", pals: ["duck"], prop: "fish", mood: "water", background: "shore-split" },
      { text: "Duck will swim with the fish.", pals: ["duck"], prop: "fish", mood: "water", background: "shore-split" },
      { text: "They play in the sun.", pals: ["duck"], prop: "sun", mood: "day", background: "meadow" },
      { text: "Then Duck sat on a log.", pals: ["duck"], prop: "log", mood: "day", background: "meadow" },
      { text: "She had a good snack.", pals: ["duck"], prop: "snack", mood: "day", background: "meadow" },
    ],
    checks: [
      {
        prompt: "Who can swim?",
        page: 2,
        answer: "duck",
        choices: [
          { id: "duck", label: "Duck", picture: { kind: "pal", id: "duck" } },
          { id: "cat", label: "cat", picture: { kind: "pal", id: "cat" } },
        ],
      },
      {
        prompt: "Duck sat on a log.",
        page: 4,
        answer: "log",
        choices: [
          { id: "log", label: "log", picture: { kind: "prop", id: "log" } },
          { id: "hat", label: "hat", picture: { kind: "prop", id: "hat" } },
        ],
      },
    ],
  },
  {
    id: "g2-owl-night",
    title: "The night moon",
    grade: "2",
    cast: ["owl", "bunny"],
    pages: [
      { text: "Owl can see the moon at night.", pals: ["owl"], prop: "moon", mood: "night", background: "night" },
      { text: "The moon is big and white.", pals: ["owl"], prop: "moon", mood: "night", background: "night" },
      { text: "Bunny came to the house.", pals: ["owl", "bunny"], prop: "house", mood: "night", background: "night" },
      { text: "They sit and look at the moon.", pals: ["owl", "bunny"], prop: "moon", mood: "night", background: "night" },
      { text: "Owl said, The night is very pretty.", pals: ["owl", "bunny"], prop: "moon", mood: "night", background: "night" },
      { text: "Bunny was glad.", pals: ["bunny"], mood: "night", background: "night" },
      { text: "Then they went to sleep.", pals: ["owl", "bunny"], prop: "moon", mood: "night", background: "bedroom" },
    ],
    checks: [
      {
        prompt: "Who can see the moon?",
        page: 0,
        answer: "owl",
        choices: [
          { id: "owl", label: "Owl", picture: { kind: "pal", id: "owl" } },
          { id: "fox", label: "Fox", picture: { kind: "pal", id: "fox" } },
        ],
      },
      {
        prompt: "Bunny came to the house.",
        page: 2,
        answer: "house",
        choices: [
          { id: "house", label: "house", picture: { kind: "prop", id: "house" } },
          { id: "boat", label: "boat", picture: { kind: "prop", id: "boat" } },
        ],
      },
    ],
  },
  {
    id: "g2-bear-boat",
    title: "The boat",
    grade: "2",
    cast: ["bear"],
    pages: [
      { text: "Bear can see a boat.", pals: ["bear"], prop: "boat", mood: "water", background: "dock-split" },
      { text: "The boat is on the water.", pals: ["bear"], prop: "boat", mood: "water", background: "dock-split" },
      { text: "Bear went to the boat.", pals: ["bear"], prop: "boat", mood: "water", background: "dock-split" },
      { text: "The boat can go.", pals: ["bear"], prop: "boat", mood: "water", background: "dock-split" },
      { text: "Bear had a good ride.", pals: ["bear"], prop: "boat", mood: "water", background: "dock-split" },
      { text: "Then Bear came back.", pals: ["bear"], prop: "boat", mood: "water", background: "dock-split" },
      { text: "Bear was glad.", pals: ["bear"], mood: "day", background: "meadow" },
    ],
    checks: [
      {
        prompt: "Who can see a boat?",
        page: 0,
        answer: "bear",
        choices: [
          { id: "bear", label: "Bear", picture: { kind: "pal", id: "bear" } },
          { id: "pig", label: "pig", picture: { kind: "pal", id: "pig" } },
        ],
      },
      {
        prompt: "The boat is on the water.",
        page: 1,
        answer: "boat",
        choices: [
          { id: "boat", label: "boat", picture: { kind: "prop", id: "boat" } },
          { id: "house", label: "house", picture: { kind: "prop", id: "house" } },
        ],
      },
    ],
  },
  ...SHELF_STORIES,
];

export function storyById(id: string | undefined): Story | undefined {
  if (!id) return undefined;
  return STORIES.find((story) => story.id === id);
}
