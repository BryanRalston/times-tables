import { squisheeById } from "@/lib/squishees";
import { GAMES } from "../games/registry";
import { SQUAD_IDS } from "../model";
import { starsNeeded } from "../rewards";
import { EGG_IDS } from "./egg";
import { hostIdFor } from "./hosts";

/** One short line. Shown in a speech bubble and on the book. */
const LINES: Record<string, string> = {
  peach: "Sweet and ready!",
  frog: "Hop to it!",
  bunny: "Boing! Let's count.",
  melon: "Cool and juicy!",
  grape: "A bunch of fun!",
  bear: "We can count them.",
  cat: "Purr-fect try!",
  panda: "Groups are my favorite.",
  owl: "Hoot! Sound it out.",
  chick: "Peep! You can do it.",
  duck: "Waddle with me!",
  pig: "Oink! Nice work.",
  penguin: "Watch the long hand.",
  whale: "A big splash of math!",
  avocado: "Guac and roll!",
  donut: "Hole-y moly!",
  corn: "A-maize-ing!",
  lemon: "Sweet, not sour.",
  strawberry: "Berry proud of you!",
  cookie: "You are a smart cookie!",
  boba: "Sip, sip, hooray!",
  fox: "Let's share the coins.",
  otter: "Hold paws and count.",
  capybara: "Calm and clever.",
  "crystal-axolotl": "Sparkle and count!",
  "rainbow-cupcake": "A sprinkle of luck!",
  "star-mochi": "Wish on a star!",
  "galaxy-narwhal": "Out of this world!",
};

export type FindKind = "starter" | "boss" | "stars" | "egg";

export interface BookEntry {
  id: string;
  name: string;
  rarity: "common" | "rare";
  line: string;
  find: string;
  findKind: FindKind;
}

export function catchphrase(id: string): string {
  return LINES[id] ?? "Let's play!";
}

export function findBlurb(id: string, games: readonly { id: string; title: string }[] = GAMES): { kind: FindKind; text: string } {
  const index = (SQUAD_IDS as readonly string[]).indexOf(id);
  if (index >= 0 && index < 3) return { kind: "starter", text: "Pick this buddy when you start." };
  const hostGame = games.find((game) => hostIdFor(game.id, games) === id);
  if (hostGame) return { kind: "boss", text: `Beat the ${hostGame.title} boss.` };
  if ((EGG_IDS as readonly string[]).includes(id)) return { kind: "egg", text: "Hatch the island egg." };
  if (index >= 0) return { kind: "stars", text: `Earn ${starsNeeded(index)} stars.` };
  return { kind: "egg", text: "Hatch the island egg." };
}

export function bookEntries(games: readonly { id: string; title: string }[] = GAMES): BookEntry[] {
  const ids: string[] = [];
  const push = (id: string) => {
    if (!squisheeById(id) || ids.includes(id)) return;
    ids.push(id);
  };
  for (const id of SQUAD_IDS) {
    if ((SQUAD_IDS as readonly string[]).indexOf(id) < 3) push(id);
  }
  for (const game of games) push(hostIdFor(game.id, games));
  for (const id of SQUAD_IDS) push(id);
  for (const id of EGG_IDS) push(id);
  return ids.map((id) => {
    const meta = squisheeById(id)!;
    const find = findBlurb(id, games);
    return {
      id,
      name: meta.name,
      rarity: meta.rarity,
      line: catchphrase(id),
      find: find.text,
      findKind: find.kind,
    };
  });
}
