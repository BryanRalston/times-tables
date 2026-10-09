export type BuddyMove = "hop" | "wiggle" | "spin" | "bounce" | "sway";

export interface Persona {
  line: string;
  fact: string;
  /** Favorite game id. Shown on the book page. */
  game: string;
  trait: string;
  streak: string;
  count: string;
  work: string;
  move: BuddyMove;
}

export interface StoryStar {
  name: string;
  pal: string;
  trait: string;
}

/** Squishees who show up inside story problems, with a pal and a personality. */
export const STORY_STARS: readonly StoryStar[] = [
  { name: "Peach", pal: "Frog", trait: "sweet" },
  { name: "Frog", pal: "Bunny", trait: "hoppy" },
  { name: "Bunny", pal: "Bear", trait: "bouncy" },
  { name: "Bear", pal: "Panda", trait: "cozy" },
  { name: "Panda", pal: "Peach", trait: "careful" },
  { name: "Fox", pal: "Otter", trait: "clever" },
  { name: "Owl", pal: "Chick", trait: "wise" },
  { name: "Penguin", pal: "Whale", trait: "chilly" },
  { name: "Cat", pal: "Cookie", trait: "curious" },
  { name: "Donut", pal: "Boba", trait: "sprinkly" },
];

/**
 * One extra pal per game. A 3-star round in that game befriends them.
 * These faces already live in the offline squishee set.
 */
export const STUDY_PALS: Record<string, string> = {
  times: "koala",
  add: "hedgehog",
  time: "sloth",
  money: "pretzel",
  sight: "kiwi",
  spelling: "mushroom",
  count: "dumpling",
  place: "cactus",
  shapes: "waffle",
  fractions: "matcha",
  measure: "sushi",
  phonics: "axolotl",
  problems: "taco",
};

const PEOPLE: Record<string, Persona> = {
  peach: person("Sweet and ready!", "Peach keeps snacks in a tiny pocket.", "add", "sweet", "Sweet streak!", "Count the sweet ones.", "Here is my work.", "bounce"),
  frog: person("Hop to it!", "Frog hops once for every number.", "count", "hoppy", "Hop, hop, streak!", "Hop as we count.", "Watch me hop it.", "hop"),
  bunny: person("Boing! Let's count.", "Bunny's ears bounce when the answer is right.", "count", "bouncy", "Boing! A streak!", "Boing, count with me.", "Let me show a hop.", "hop"),
  melon: person("Cool and juicy!", "Melon shares slices into equal parts.", "fractions", "cool", "Cool streak!", "Count the slices.", "Watch the pieces.", "spin"),
  grape: person("A bunch of fun!", "Grape likes equal bunches.", "times", "bunchy", "A bunch of stars!", "Count the bunch.", "One bunch at a time.", "spin"),
  bear: person("We can count them.", "Bear lines things up before adding.", "add", "cozy", "Cozy little streak!", "Count them with me.", "I will line them up.", "sway"),
  cat: person("Purr-fect try!", "Cat collects words like yarn.", "sight", "curious", "Purr-fect streak!", "Count softly.", "Let me sound it out.", "sway"),
  panda: person("Groups are my favorite.", "Panda sorts snacks into groups.", "times", "careful", "Group streak!", "Count each group.", "Watch the groups.", "sway"),
  owl: person("Hoot! Sound it out.", "Owl reads under a lamp.", "spelling", "wise", "Hoot! A streak!", "Count the sounds.", "Sound it out with me.", "sway"),
  chick: person("Peep! You can do it.", "Chick peeps once per count.", "count", "peepy", "Peep! Streak!", "Peep, one, two.", "Peep. Here is how.", "hop"),
  duck: person("Waddle with me!", "Duck waddles along a number line.", "place", "waddly", "Waddle streak!", "Waddle and count.", "Watch my waddle.", "hop"),
  pig: person("Oink! Nice work.", "Pig stacks blocks into shapes.", "shapes", "muddy", "Oink! A streak!", "Oink and count.", "Look at my picture.", "wiggle"),
  penguin: person("Watch the long hand.", "Penguin times every swim.", "time", "chilly", "Ice streak!", "Count the minutes.", "Watch the long hand.", "wiggle"),
  whale: person("A big splash of math!", "Whale shares the ocean into parts.", "fractions", "splashy", "Splash streak!", "Count the splashes.", "Here is the share.", "wiggle"),
  avocado: person("Guac and roll!", "Avocado measures ribbons.", "measure", "green", "Guac streak!", "Count the inches.", "Start at zero.", "bounce"),
  donut: person("Hole-y moly!", "Donut loves beginning sounds.", "phonics", "sprinkly", "Sprinkle streak!", "Count the sounds.", "Say each sound.", "spin"),
  corn: person("A-maize-ing!", "Corn tells snack stories.", "problems", "corny", "A-maize-ing streak!", "Count the story.", "Let us use the picture.", "bounce"),
  lemon: person("Sweet, not sour.", "Lemon keeps a calm shop.", "money", "zippy", "Zesty streak!", "Count the coins.", "Add the coins up.", "bounce"),
  strawberry: person("Berry proud of you!", "Strawberry remembers words.", "sight", "berry", "Berry streak!", "Count the seeds.", "Look at the word.", "bounce"),
  cookie: person("You are a smart cookie!", "Cookie spells with crumbs.", "spelling", "crumbly", "Smart-cookie streak!", "Count the letters.", "Build the word.", "spin"),
  boba: person("Sip, sip, hooray!", "Boba sips once each minute.", "time", "bubbly", "Sip sip streak!", "Count the bubbles.", "Watch the clock.", "spin"),
  fox: person("Let's share the coins.", "Fox runs a fair little shop.", "money", "clever", "Clever streak!", "Count the coins.", "Add, then the change.", "wiggle"),
  otter: person("Hold paws and count.", "Otter holds paws to keep count.", "count", "splashy", "Paw streak!", "Hold paws and count.", "I will count it.", "wiggle"),
  capybara: person("Calm and clever.", "Capybara likes quiet place value.", "place", "calm", "Calm streak!", "Count the tens.", "Tens, then ones.", "sway"),
  "crystal-axolotl": person("Sparkle and count!", "Crystal Axolotl glows when you learn a sound.", "phonics", "sparkly", "Sparkle streak!", "Count the sparkles.", "Listen with me.", "wiggle"),
  "rainbow-cupcake": person("A sprinkle of luck!", "Rainbow Cupcake shares equal frosting.", "fractions", "frosted", "Sprinkle streak!", "Count the sprinkles.", "Equal pieces.", "bounce"),
  "star-mochi": person("Wish on a star!", "Star Mochi wishes on equal groups.", "times", "wishy", "Star streak!", "Count the stars.", "One group at a time.", "bounce"),
  "galaxy-narwhal": person("Out of this world!", "Galaxy Narwhal measures moon ribbons.", "measure", "starry", "Galaxy streak!", "Count the stars.", "Look at the marks.", "sway"),
  koala: person("Nap, then count.", "Koala wakes up for equal groups.", "times", "sleepy", "Awake streak!", "Count the groups.", "Groups, then how many.", "sway"),
  hedgehog: person("Little spikes, big sums.", "Hedgehog spikes once for each add.", "add", "spiky", "Spiky streak!", "Count the spikes.", "Start, then add.", "hop"),
  sloth: person("Slow and steady.", "Sloth never rushes the clock.", "time", "slow", "Steady streak!", "Count slowly.", "The long hand moves.", "sway"),
  pretzel: person("Twist and tally.", "Pretzel twists coins into a total.", "money", "twisty", "Twisty streak!", "Count the coins.", "Add coin by coin.", "spin"),
  kiwi: person("A fuzzy new word.", "Kiwi keeps a fuzzy word list.", "sight", "fuzzy", "Fuzzy streak!", "Count the fuzz.", "Hear the word.", "hop"),
  mushroom: person("Spore the letters.", "Mushroom grows a letter at a time.", "spelling", "mossy", "Mossy streak!", "Count the letters.", "Say, then spell.", "sway"),
  dumpling: person("One more in the basket.", "Dumpling fills baskets by counting.", "count", "steamy", "Steamy streak!", "Count the dumplings.", "One, then the next.", "bounce"),
  cactus: person("Tall as a ten.", "Cactus grows in tens.", "place", "prickly", "Prickly streak!", "Count the tens.", "Tens and ones.", "sway"),
  waffle: person("Squares in a grid.", "Waffle is a grid of little squares.", "shapes", "crispy", "Crispy streak!", "Count the squares.", "Look at the sides.", "sway"),
  matcha: person("Whisk the parts.", "Matcha whisks a whole into parts.", "fractions", "foamy", "Foamy streak!", "Count the parts.", "Shaded, then the whole.", "bounce"),
  sushi: person("Line them up.", "Sushi lines bites up to measure.", "measure", "tidy", "Tidy streak!", "Count the pieces.", "Start at the end.", "sway"),
  axolotl: person("Frill and a sound.", "Axolotl frills when a sound matches.", "phonics", "frilly", "Frilly streak!", "Count the sounds.", "Say the sound.", "wiggle"),
  taco: person("A story in a shell.", "Taco tucks a story in every shell.", "problems", "crunchy", "Crunchy streak!", "Count the story.", "Use the picture.", "spin"),
};

function person(
  line: string,
  fact: string,
  game: string,
  trait: string,
  streak: string,
  count: string,
  work: string,
  move: BuddyMove,
): Persona {
  return { line, fact, game, trait, streak, count, work, move };
}

const FALLBACK: Persona = person(
  "Let's play!",
  "A squishee who loves to learn.",
  "count",
  "kind",
  "Nice streak!",
  "Count with me.",
  "Watch how I do it.",
  "bounce",
);

export function personaOf(id: string): Persona {
  return PEOPLE[id] ?? FALLBACK;
}

export function studyGame(id: string): string | null {
  for (const [game, pal] of Object.entries(STUDY_PALS)) {
    if (pal === id) return game;
  }
  return null;
}

export function buddyMove(id: string): BuddyMove {
  return personaOf(id).move;
}
