import { gameById } from "./games/registry";

export type BossLook = "crown" | "cape" | "armor" | "clock" | "coins" | "spell";

/** One island boss. New games can add a row, or skip it and get a generated boss. */
export interface IslandBoss {
  gameId: string;
  name: string;
  taunt: string;
  friendly: string;
  personality: string;
  /** Squishee face the costume sits on. */
  face: string;
  look: BossLook;
  cosmeticId: string;
  cosmeticName: string;
  trophyId: string;
  trophyName: string;
}

const AUTHORED: readonly IslandBoss[] = [
  {
    gameId: "times",
    name: "Professor Spellbottom",
    taunt: "My sparkle spells are very proud. Can you count them?",
    friendly: "You counted every sparkle! Come sit by me.",
    personality: "A peachy professor with a star cape who giggles when the tables come out.",
    face: "peach",
    look: "spell",
    cosmeticId: "spell-cape",
    cosmeticName: "Star cape",
    trophyId: "trophy-spellbottom",
    trophyName: "Spellbottom star",
  },
  {
    gameId: "add",
    name: "Grumble Gumdrop",
    taunt: "Hmph. My gumdrops are sticky. Want to add them up?",
    friendly: "Okay, okay. You can have a gumdrop. Friends?",
    personality: "A grumbly frog in candy armor who is secretly very sweet.",
    face: "frog",
    look: "armor",
    cosmeticId: "gumdrop-helm",
    cosmeticName: "Gumdrop helm",
    trophyId: "trophy-gumdrop",
    trophyName: "Gumdrop trophy",
  },
  {
    gameId: "time",
    name: "Captain Clockwork",
    taunt: "All aboard the tick-tock boat! What time is it?",
    friendly: "Right on time, first mate. Hop aboard!",
    personality: "A melon captain whose clock hat always says snack time.",
    face: "melon",
    look: "clock",
    cosmeticId: "clock-hat",
    cosmeticName: "Clock hat",
    trophyId: "trophy-clockwork",
    trophyName: "Clockwork trophy",
  },
  {
    gameId: "money",
    name: "Sir Coinsworth",
    taunt: "My coins are very shiny. Can you count a knight's treasure?",
    friendly: "A fine count! You may wear my spare crown.",
    personality: "A lemon knight who bows so low the coins jingle.",
    face: "lemon",
    look: "coins",
    cosmeticId: "coin-crown",
    cosmeticName: "Coin crown",
    trophyId: "trophy-coinsworth",
    trophyName: "Coinsworth trophy",
  },
  {
    gameId: "sight",
    name: "Duchess Peekaboo",
    taunt: "I hid a word under my crown. Can you read it?",
    friendly: "You found every word! The crown is just for fun.",
    personality: "A grape duchess who peeks over her crown and giggles at sight words.",
    face: "grape",
    look: "crown",
    cosmeticId: "peek-crown",
    cosmeticName: "Peek crown",
    trophyId: "trophy-peekaboo",
    trophyName: "Peekaboo trophy",
  },
  {
    gameId: "spelling",
    name: "Owlbert Spellwell",
    taunt: "Hoot! My letters got dizzy. Can you line them up?",
    friendly: "What a spelling! You may borrow my letter cape.",
    personality: "A sleepy owl whose cape is stitched with mixed-up letters.",
    face: "owl",
    look: "cape",
    cosmeticId: "letter-cape",
    cosmeticName: "Letter cape",
    trophyId: "trophy-owlbert",
    trophyName: "Owlbert trophy",
  },
  {
    gameId: "count",
    name: "Countess Chirp",
    taunt: "Cheep cheep! I counted my snacks. Did I miss one?",
    friendly: "You counted them all. Come share a snack.",
    personality: "A tiny chick in a huge crown who counts everything twice.",
    face: "chick",
    look: "crown",
    cosmeticId: "chirp-crown",
    cosmeticName: "Chirp crown",
    trophyId: "trophy-chirp",
    trophyName: "Chirp trophy",
  },
  {
    gameId: "place",
    name: "Baron Block",
    taunt: "My blocks are stacked very tall. Which pile is bigger?",
    friendly: "A mighty stack! You can wear my block helm.",
    personality: "A bear baron in candy armor who loves tens and ones.",
    face: "bear",
    look: "armor",
    cosmeticId: "block-helm",
    cosmeticName: "Block helm",
    trophyId: "trophy-block",
    trophyName: "Block trophy",
  },
  {
    gameId: "shapes",
    name: "Captain Corner",
    taunt: "Ahoy! My shapes are rolling around. Can you name them?",
    friendly: "Shipshape! Welcome aboard, shape mate.",
    personality: "A cat captain whose cape is covered in circles and squares.",
    face: "cat",
    look: "cape",
    cosmeticId: "corner-cape",
    cosmeticName: "Corner cape",
    trophyId: "trophy-corner",
    trophyName: "Corner trophy",
  },
  {
    gameId: "fractions",
    name: "Sir Sliceworth",
    taunt: "My pie is cut into friendly slices. How much is left?",
    friendly: "A fair share! You may keep a shiny slice crown.",
    personality: "A panda knight who shares every pie down the middle.",
    face: "panda",
    look: "coins",
    cosmeticId: "slice-crown",
    cosmeticName: "Slice crown",
    trophyId: "trophy-slice",
    trophyName: "Slice trophy",
  },
  {
    gameId: "measure",
    name: "Professor Rulerbottom",
    taunt: "My ribbon is very long. Can you see how far it goes?",
    friendly: "Measured! You are the guest of honor.",
    personality: "A penguin professor with a clock hat that is really a tiny ruler.",
    face: "penguin",
    look: "clock",
    cosmeticId: "ruler-hat",
    cosmeticName: "Ruler hat",
    trophyId: "trophy-ruler",
    trophyName: "Ruler trophy",
  },
  {
    gameId: "phonics",
    name: "Bunny Boom",
    taunt: "Boom! My sounds popped out. Can you catch them?",
    friendly: "You caught every sound. Hop over here!",
    personality: "A bunny in a sparkle cape who pops letter sounds like bubbles.",
    face: "bunny",
    look: "spell",
    cosmeticId: "boom-cape",
    cosmeticName: "Boom cape",
    trophyId: "trophy-boom",
    trophyName: "Boom trophy",
  },
  {
    gameId: "problems",
    name: "Detective Foxglove",
    taunt: "A mystery! The numbers are hiding. Can you solve it?",
    friendly: "Case closed! You are my favorite detective.",
    personality: "A fox detective in gumdrop armor who whispers story clues.",
    face: "fox",
    look: "armor",
    cosmeticId: "clue-helm",
    cosmeticName: "Clue helm",
    trophyId: "trophy-clue",
    trophyName: "Clue trophy",
  },
];

const LOOKS: readonly BossLook[] = ["crown", "cape", "armor", "clock", "coins", "spell"];

function lookIndex(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i) * (i + 1);
  return Math.abs(n) % LOOKS.length;
}

function slug(id: string): string {
  const clean = id.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  return clean || "squishee";
}

/** Authored boss, or a generated one so a new island still has a fight. */
export function bossForGame(gameId: string): IslandBoss {
  const authored = AUTHORED.find((row) => row.gameId === gameId);
  if (authored) return authored;
  const game = gameById(gameId);
  const title = game?.title ?? "Squishee";
  const name = `Boss ${title}`;
  const look = LOOKS[lookIndex(gameId)] ?? "crown";
  return {
    gameId,
    name,
    taunt: `${name} bounced in for a silly showdown. Ready?`,
    friendly: `${name} wants to be friends!`,
    personality: `The big boss of ${title}, in a homemade crown.`,
    face: game?.mascot ?? "peach",
    look,
    cosmeticId: `boss-look-${slug(gameId)}`,
    cosmeticName: "Boss crown",
    trophyId: `trophy-${slug(gameId)}`,
    trophyName: `${title} trophy`,
  };
}

export function lookForCosmetic(id: string): BossLook | null {
  const authored = AUTHORED.find((row) => row.cosmeticId === id);
  if (authored) return authored.look;
  if (id.startsWith("boss-look-")) return "crown";
  return null;
}

export function bossCosmeticName(id: string): string {
  const authored = AUTHORED.find((row) => row.cosmeticId === id);
  if (authored) return authored.cosmeticName;
  if (id.startsWith("boss-look-")) return "Boss crown";
  return "Boss look";
}
