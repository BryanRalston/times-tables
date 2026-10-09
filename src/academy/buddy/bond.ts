import type { Child } from "../model";
import { STUDY_PALS } from "./persona";

/** A few practice rounds, not a long grind. */
export const BOND_FRIEND = 3;
export const BOND_BEST = 6;

export function bondScore(bonds: Record<string, number>, id: string): number {
  return bonds[id] ?? 0;
}

export function bondTier(score: number): 0 | 1 | 2 | 3 {
  if (score >= BOND_BEST) return 3;
  if (score >= BOND_FRIEND) return 2;
  if (score >= 1) return 1;
  return 0;
}

export function bondName(tier: 0 | 1 | 2 | 3): string {
  switch (tier) {
    case 0:
      return "New pal";
    case 1:
      return "Practice pal";
    case 2:
      return "Good friend";
    case 3:
      return "Best buddy";
    default: {
      const neverTier: never = tier;
      return neverTier;
    }
  }
}

export function bondHearts(tier: 0 | 1 | 2 | 3): string {
  switch (tier) {
    case 0:
      return "";
    case 1:
      return "♥";
    case 2:
      return "♥♥";
    case 3:
      return "♥♥♥";
    default: {
      const neverTier: never = tier;
      return neverTier;
    }
  }
}

export function studyCount(bestStars: Record<string, number>): number {
  let n = 0;
  for (const game of Object.keys(STUDY_PALS)) {
    if ((bestStars[game] ?? 0) >= 3) n += 1;
  }
  return n;
}

/** Outfits earned by friendship and by 3-star learning. Coins stay put. */
export function learningLooks(prevBond: number, nextBond: number, prevStudy: number, nextStudy: number): string[] {
  const out: string[] = [];
  if (prevBond < BOND_FRIEND && nextBond >= BOND_FRIEND) out.push("bow");
  if (prevBond < BOND_BEST && nextBond >= BOND_BEST) out.push("party-hat");
  if (prevStudy < 1 && nextStudy >= 1) out.push("scarf");
  if (prevStudy < 3 && nextStudy >= 3) out.push("shades");
  return out;
}

export function withLearningLooks(child: Child, looks: readonly string[]): Child {
  if (!looks.length) return child;
  const cosmetics = [...child.cosmetics];
  let equipped = child.equipped;
  let changed = false;
  for (const id of looks) {
    if (cosmetics.includes(id)) continue;
    cosmetics.push(id);
    changed = true;
    if (!equipped) equipped = id;
  }
  if (!changed) return child;
  return { ...child, cosmetics, equipped };
}
