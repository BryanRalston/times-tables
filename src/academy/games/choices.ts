import type { Rng } from "@/lib/rng";

export function qid(rng: Rng): string {
  return `ac-${Math.floor(rng.next() * 1e9).toString(36)}`;
}

export function fourChoices(rng: Rng, answer: number, preferred: number[]): string[] {
  const picked: number[] = [];
  const used = new Set<number>([answer]);
  const consider = (n: number) => {
    if (picked.length >= 3) return;
    if (!Number.isInteger(n) || n < 0 || n > 500 || used.has(n)) return;
    used.add(n);
    picked.push(n);
  };
  for (const n of preferred) consider(n);
  let delta = 1;
  while (picked.length < 3 && delta < 80) {
    consider(answer + delta);
    consider(answer - delta);
    delta += 1;
  }
  return rng.shuffle([answer, ...picked]).map(String);
}
