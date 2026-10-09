import { squisheeById } from "@/lib/squishees";
import { GAMES } from "../games/registry";

/**
 * Island residents. Starters (peach, frog, bunny) stay free so a boss
 * befriends someone new. Unknown games pick the next free face.
 */
const NAMED_HOSTS: Record<string, string> = {
  times: "panda",
  add: "bear",
  time: "penguin",
  money: "fox",
  sight: "cat",
  spelling: "owl",
};

const HOST_POOL = [
  "chick",
  "duck",
  "pig",
  "whale",
  "avocado",
  "donut",
  "corn",
  "lemon",
  "strawberry",
  "cookie",
  "boba",
  "otter",
  "capybara",
  "melon",
  "grape",
];

export function hostIdFor(gameId: string, games: readonly { id: string }[] = GAMES): string {
  const named = NAMED_HOSTS[gameId];
  if (named && squisheeById(named)) return named;
  const used = new Set(Object.values(NAMED_HOSTS));
  const free = HOST_POOL.filter((id) => squisheeById(id) && !used.has(id));
  const index = games.findIndex((game) => game.id === gameId);
  const slot = index < 0 ? 0 : index;
  return free[slot % Math.max(1, free.length)] ?? "panda";
}

export function friendFromBoss(friends: readonly string[], gameId: string, won: boolean): string[] {
  if (!won) return [...friends];
  const host = hostIdFor(gameId);
  if (!squisheeById(host) || friends.includes(host)) return [...friends];
  return [...friends, host];
}
