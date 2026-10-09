import { squisheeById } from "@/lib/squishees";
import { GAMES } from "../games/registry";
import { SQUAD_IDS } from "../model";
import { starsNeeded } from "../rewards";
import { EGG_IDS } from "./egg";
import { hostIdFor } from "./hosts";
import { personaOf, STUDY_PALS, studyGame } from "./persona";

export type FindKind = "starter" | "boss" | "stars" | "egg" | "study";

export interface BookEntry {
  id: string;
  name: string;
  rarity: "common" | "rare";
  line: string;
  fact: string;
  favorite: string;
  find: string;
  findKind: FindKind;
}

export function catchphrase(id: string): string {
  return personaOf(id).line;
}

export function findBlurb(id: string, games: readonly { id: string; title: string }[] = GAMES): { kind: FindKind; text: string } {
  const index = (SQUAD_IDS as readonly string[]).indexOf(id);
  if (index >= 0 && index < 3) return { kind: "starter", text: "Pick this buddy when you start." };
  const hostGame = games.find((game) => hostIdFor(game.id, games) === id);
  if (hostGame) return { kind: "boss", text: `Beat the ${hostGame.title} boss.` };
  if ((EGG_IDS as readonly string[]).includes(id)) return { kind: "egg", text: "Hatch the island egg." };
  const studied = studyGame(id);
  if (studied) {
    const title = games.find((game) => game.id === studied)?.title ?? "a game";
    return { kind: "study", text: `Earn 3 stars in ${title}.` };
  }
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
  for (const id of Object.values(STUDY_PALS)) push(id);
  return ids.map((id) => {
    const meta = squisheeById(id)!;
    const find = findBlurb(id, games);
    const persona = personaOf(id);
    const favorite = games.find((game) => game.id === persona.game)?.title ?? "Counting";
    return {
      id,
      name: meta.name,
      rarity: meta.rarity,
      line: persona.line,
      fact: persona.fact,
      favorite,
      find: find.text,
      findKind: find.kind,
    };
  });
}
