import type { Rng } from "@/lib/rng";

/** How long a grown-up holds the button before the question appears. */
export const GROWNUP_HOLD_MS = 2000;

/**
 * Two 2-digit numbers to add, with a carry in both columns and a total past 100
 * (for example 67 + 58). Quick for a grown-up; past what the K-2 games teach.
 */
export function grownupGate(rng: Rng): { a: number; b: number; answer: number } {
  const tensA = rng.int(4, 8);
  const tensB = rng.int(5, 8);
  const onesA = rng.int(3, 9);
  const onesB = rng.int(Math.max(1, 11 - onesA), 9);
  const a = tensA * 10 + onesA;
  const b = tensB * 10 + onesB;
  return { a, b, answer: a + b };
}

export function gateAnswerMatches(gate: { answer: number }, raw: string): boolean {
  if (!/^\d{1,4}$/.test(raw.trim())) return false;
  return Number(raw.trim()) === gate.answer;
}
