import { squisheeById } from "@/lib/squishees";
import { GAMES } from "../games/registry";
import { SQUAD_IDS } from "../model";
import { starsNeeded } from "../rewards";
import { EGG_IDS } from "./egg";
import { hostIdFor } from "./hosts";
import { catchphrase } from "./lines";

export { catchphrase } from "./lines";

export type FindKind = "starter" | "boss" | "stars" | "egg";

export interface BookEntry {
  id: string;
  name: string;
  rarity: "common" | "rare";
  line: string;
  find: string;
  findKind: FindKind;
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
