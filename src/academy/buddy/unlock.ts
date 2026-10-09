import { squisheeById } from "@/lib/squishees";
import { SQUAD_IDS, type Child } from "../model";
import { unlockedCount } from "../rewards";
import { hatchPick } from "./egg";
import { STUDY_PALS } from "./persona";

export function ownedIds(child: Pick<Child, "stars" | "gifted" | "friends" | "hatched"> & { bestStars?: Record<string, number> }): string[] {
  const ids: string[] = [];
  const push = (id: string) => {
    if (!id || ids.includes(id) || !squisheeById(id)) return;
    ids.push(id);
  };
  for (let i = 0; i < unlockedCount(child.stars) && i < SQUAD_IDS.length; i++) push(SQUAD_IDS[i]!);
  for (const id of child.gifted) push(id);
  for (const id of child.friends) push(id);
  for (const id of child.hatched) push(id);
  const best = child.bestStars ?? {};
  for (const [game, id] of Object.entries(STUDY_PALS)) {
    if ((best[game] ?? 0) >= 3) push(id);
  }
  return ids;
}

export function palOwned(
  child: Pick<Child, "stars" | "gifted" | "friends" | "hatched"> & { bestStars?: Record<string, number> },
  id: string,
): boolean {
  return ownedIds(child).includes(id);
}

export function withBuddy(child: Child, id: string): Child {
  if (!palOwned(child, id) || child.avatarId === id) return child;
  return { ...child, avatarId: id };
}

export function openEgg(child: Child, today: string): Child {
  if (child.dailyDate !== today || child.egg !== "closed") return child;
  const id = hatchPick(today, ownedIds(child));
  const hatched = id && !child.hatched.includes(id) ? [...child.hatched, id] : child.hatched;
  return { ...child, egg: "open", hatched };
}
