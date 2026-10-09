import { applyBuyCosmetic, COSMETICS, isCosmeticId } from "@/lib/cosmetics";
import { hashSeed } from "@/lib/rng";
import { GAMES, barKeys, chipKeys, chipLabel as chipText, skillLabel as skillText, type GameId } from "./games/registry";
import { advanceJourney, withDailyRound } from "./journey";
import { SQUAD_IDS, addDays, weekDates, type Child, type RoundResult, type SkillStat } from "./model";

/** Finishing a round always earns a star. 90% earns 3. 60% earns 2. A 10-question round is 9 and 6. */
export function starsForRound(correct: number, total = 10): 1 | 2 | 3 {
  const c = Math.max(0, Math.floor(correct));
  const t = Math.max(1, Math.floor(total) || 10);
  const ratio = c / t;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

/** Play coins for a round. A long combo and a beaten boss add a little extra. */
export function coinsForRound(correct: number, total: number, bestCombo = 0, boss = false): number {
  const stars = starsForRound(correct, total);
  let coins = stars * 2;
  if (bestCombo >= 3) coins += 1;
  if (bestCombo >= 5) coins += 1;
  if (boss && total > 0 && correct / total >= 0.6) coins += 3;
  return coins;
}

export function nextStreak(
  prev: { count: number; lastPlayed: string | null },
  today: string,
): { count: number; lastPlayed: string } {
  if (prev.lastPlayed === today) return { count: Math.max(1, prev.count), lastPlayed: today };
  if (prev.lastPlayed === addDays(today, -1) && prev.count > 0) {
    return { count: prev.count + 1, lastPlayed: today };
  }
  return { count: 1, lastPlayed: today };
}

/** Stars required before squad slot `index` is unlocked. The first three are free. */
export function starsNeeded(index: number): number {
  if (index < 3) return 0;
  const n = index - 2;
  return 2 * n * n + 3 * n + 1;
}

export function unlockedCount(stars: number): number {
  const safe = Math.max(0, Math.floor(stars));
  let n = 0;
  for (let i = 0; i < SQUAD_IDS.length; i++) {
    if (safe >= starsNeeded(i)) n += 1;
  }
  return n;
}

export function newestUnlock(prevStars: number, nextStars: number): string | null {
  const before = unlockedCount(prevStars);
  const after = unlockedCount(nextStars);
  if (after <= before) return null;
  return SQUAD_IDS[after - 1] ?? null;
}

export function giftCount(child: Pick<Child, "stars" | "opened">): number {
  return Math.max(0, unlockedCount(child.stars) - child.opened);
}

export function palUnlocked(child: Pick<Child, "stars" | "gifted">, id: string, index: number): boolean {
  return index < unlockedCount(child.stars) || child.gifted.includes(id);
}

export type GiftRoll =
  | { kind: "coins"; amount: number }
  | { kind: "cosmetic"; id: string }
  | { kind: "pal"; id: string };

/** The same day always opens the same gift. Coins, an outfit, or a squishee. */
export function rollGift(today: string, child: Pick<Child, "cosmetics" | "gifted" | "stars">): GiftRoll {
  const n = hashSeed(`gift:${today}`);
  const lane = n % 3;
  if (lane === 1) {
    const left = COSMETICS.map((item) => item.id).filter((id) => !child.cosmetics.includes(id));
    const pick = left[n % left.length];
    if (pick) return { kind: "cosmetic", id: pick };
  }
  if (lane === 2) {
    const unlocked = new Set<string>([...SQUAD_IDS.slice(0, unlockedCount(child.stars)), ...child.gifted]);
    const next = SQUAD_IDS.find((id) => !unlocked.has(id));
    if (next) return { kind: "pal", id: next };
  }
  return { kind: "coins", amount: 4 + (n % 5) };
}

export function claimDailyGift(child: Child, today: string): Child {
  if (child.dailyDate !== today || child.dailyGift !== "closed") return child;
  const gift = rollGift(today, child);
  const opened: Child = { ...child, dailyGift: "open" };
  if (gift.kind === "coins") {
    return { ...opened, coins: Math.min(1_000_000, opened.coins + gift.amount) };
  }
  if (gift.kind === "cosmetic") {
    const cosmetics = opened.cosmetics.includes(gift.id) ? opened.cosmetics : [...opened.cosmetics, gift.id];
    return { ...opened, cosmetics, equipped: opened.equipped || gift.id };
  }
  const gifted = opened.gifted.includes(gift.id) ? opened.gifted : [...opened.gifted, gift.id];
  return { ...opened, gifted };
}

export function buyOutfit(child: Child, id: string): Child {
  const result = applyBuyCosmetic(child.coins, child.cosmetics, id);
  if (!result.ok) return child;
  return {
    ...child,
    coins: result.coins,
    cosmetics: result.cosmetics,
    equipped: child.equipped || id,
  };
}

export function wearOutfit(child: Child, id: string): Child {
  if (id === "") return child.equipped ? { ...child, equipped: "" } : child;
  if (!isCosmeticId(id) || !child.cosmetics.includes(id)) return child;
  if (child.equipped === id) return child;
  return { ...child, equipped: id };
}

export function acknowledgeUnlocks(child: Child): Child {
  const opened = Math.max(child.opened, unlockedCount(child.stars));
  if (opened === child.opened) return child;
  return { ...child, opened };
}

export function gameOfDay(today: string): GameId {
  const games = GAMES.map((game) => game.id);
  return games[hashSeed(today) % games.length]!;
}

function bump(skills: Record<string, SkillStat>, key: string, ok: boolean) {
  if (!key) return;
  const prev = skills[key] ?? { ok: 0, miss: 0 };
  skills[key] = {
    ok: prev.ok + (ok ? 1 : 0),
    miss: prev.miss + (ok ? 0 : 1),
  };
}

const DAY_CAP_SECONDS = 4 * 60 * 60;

export function applyRound(child: Child, result: RoundResult, today: string): Child {
  const stars = starsForRound(result.correct, result.total);
  const streak = nextStreak({ count: child.streak, lastPlayed: child.lastPlayed }, today);
  const skills: Record<string, SkillStat> = { ...child.skills };
  for (const mark of result.answers) {
    bump(skills, mark.skill, mark.ok);
    for (const tag of mark.tags) bump(skills, tag, mark.ok);
    if (mark.factKey) bump(skills, `fact:${mark.factKey}`, mark.ok);
  }
  const secondsByDay = { ...child.secondsByDay };
  const add = Math.max(0, Math.min(180, Math.round(result.seconds)));
  secondsByDay[today] = Math.min(DAY_CAP_SECONDS, (secondsByDay[today] ?? 0) + add);
  const bestCombo = Math.max(0, Math.floor(result.bestCombo ?? 0));
  const boss = result.boss === true;
  const daily = withDailyRound(child, today);
  return {
    ...child,
    stars: child.stars + stars,
    streak: streak.count,
    lastPlayed: streak.lastPlayed,
    skills,
    secondsByDay,
    bestStars: {
      ...child.bestStars,
      [result.game]: Math.max(child.bestStars[result.game] ?? 0, stars),
    },
    rounds: child.rounds + 1,
    coins: Math.min(1_000_000, child.coins + coinsForRound(result.correct, result.total, bestCombo, boss)),
    journey: advanceJourney(child.journey, {
      game: result.game,
      correct: result.correct,
      total: result.total,
      boss,
    }),
    ...daily,
  };
}

export function secondsThisWeek(map: Record<string, number>, today: string): number {
  return weekDates(today).reduce((sum, day) => sum + (map[day] ?? 0), 0);
}

export function formatMinutes(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.round((safe / 60) * 10) / 10;
  const text = Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
  return `${text}m`;
}

export function isMastered(stat: SkillStat | undefined): boolean {
  if (!stat) return false;
  const n = stat.ok + stat.miss;
  return n >= 5 && stat.ok / n >= 0.8;
}

export function skillPercent(stat: SkillStat | undefined): number | null {
  if (!stat) return null;
  const n = stat.ok + stat.miss;
  if (n <= 0) return null;
  return Math.round((stat.ok / n) * 100);
}

export function skillLabel(key: string): string {
  return skillText(key);
}

export function chipLabel(key: string): string {
  return chipText(key);
}

export interface SkillBar {
  key: string;
  label: string;
  pct: number;
}

export function skillBars(skills: Record<string, SkillStat>): SkillBar[] {
  const rows: { key: string; pct: number; n: number }[] = [];
  for (const key of barKeys()) {
    const stat = skills[key];
    const pct = skillPercent(stat);
    if (pct == null || !stat) continue;
    rows.push({ key, pct, n: stat.ok + stat.miss });
  }
  rows.sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
  return rows.slice(0, 5).map((row) => ({ key: row.key, label: skillLabel(row.key), pct: row.pct }));
}

export function masteredChips(skills: Record<string, SkillStat>): string[] {
  const chips: string[] = [];
  for (const key of chipKeys()) {
    if (isMastered(skills[key])) chips.push(chipLabel(key));
  }
  return chips;
}

export function weakTimesFacts(skills: Record<string, SkillStat>): string[] {
  const rows: { key: string; score: number }[] = [];
  for (const [key, stat] of Object.entries(skills)) {
    if (!key.startsWith("fact:")) continue;
    const fact = key.slice(5);
    if (!/^\d+×\d+$/.test(fact)) continue;
    const n = stat.ok + stat.miss;
    if (n < 2 || stat.miss < 1) continue;
    if (stat.ok / n >= 0.8) continue;
    rows.push({ key: fact, score: stat.miss / n + stat.miss * 0.01 });
  }
  rows.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  return rows.map((row) => row.key);
}

export function practiceTip(
  name: string,
  skills: Record<string, SkillStat>,
): { text: string; factor: number | null } {
  const who = name.trim() || "Your child";
  const weak = weakTimesFacts(skills);
  if (weak.length >= 2) {
    const factor = Number(weak[0]!.split("×")[0]);
    return {
      text: `${who} keeps missing ${weak[0]} and ${weak[1]}. Try the free times tables worksheet tonight.`,
      factor: Number.isFinite(factor) ? factor : null,
    };
  }
  if (weak.length === 1) {
    const factor = Number(weak[0]!.split("×")[0]);
    return {
      text: `${who} keeps missing ${weak[0]}. Try the free times tables worksheet tonight.`,
      factor: Number.isFinite(factor) ? factor : null,
    };
  }
  return {
    text: `${who} can print a free worksheet and play it together tonight.`,
    factor: null,
  };
}
