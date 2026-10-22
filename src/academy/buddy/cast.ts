import { squisheeById } from "@/lib/squishees";
import { show, t } from "../i18n";
import { GAME_CARDS as GAMES } from "../games/catalog";
import { SQUAD_IDS } from "../model";
import { starsNeeded } from "../rewards";
import { EGG_IDS } from "./egg";
import { hostIdFor } from "./hosts";
import { personaOf, STUDY_PALS, studyGame } from "./persona";

export { catchphrase } from "./lines";

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

export function findBlurb(id: string, games: readonly { id: string; title: string }[] = GAMES): { kind: FindKind; text: string } {
  const index = (SQUAD_IDS as readonly string[]).indexOf(id);
  if (index >= 0 && index < 3) return { kind: "starter", text: t("Pick this buddy when you start.", "Elige este amigo al empezar.") };
  const hostGame = games.find((game) => hostIdFor(game.id, games) === id);
  if (hostGame) return { kind: "boss", text: t(`Beat the ${hostGame.title} boss.`, `Vence al jefe de ${show(hostGame.title)}.`, `Vença o chefe de ${show(hostGame.title)}.`, `Bats le chef de ${show(hostGame.title)}.`) };
  if ((EGG_IDS as readonly string[]).includes(id)) return { kind: "egg", text: t("Hatch the island egg.", "Abre el huevo de la isla.") };
  const studied = studyGame(id);
  if (studied) {
    const title = games.find((game) => game.id === studied)?.title ?? "a game";
    return { kind: "study", text: t(`Earn 3 stars in ${title}.`, `Gana 3 estrellas en ${show(title)}.`, `Ganhe 3 estrelas em ${show(title)}.`, `Gagne 3 étoiles dans ${show(title)}.`) };
  }
  if (index >= 0) return { kind: "stars", text: t(`Earn ${starsNeeded(index)} stars.`, `Gana ${starsNeeded(index)} estrellas.`, `Ganhe ${starsNeeded(index)} estrelas.`, `Gagne ${starsNeeded(index)} étoiles.`) };
  return { kind: "egg", text: t("Hatch the island egg.", "Abre el huevo de la isla.") };
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
    const favorite = show(games.find((game) => game.id === persona.game)?.title ?? "Counting");
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
