import type { Rng } from "@/lib/rng";
import type { AnswerMark, WordCard } from "../model";

export const WORD_BOX_MAX = 5;

export interface LetterTile {
  id: string;
  letter: string;
}

export interface TileBoard {
  word: string;
  pool: LetterTile[];
  placed: LetterTile[];
  /** How many leading letters are locked in by a hint. */
  locked: number;
}

const EXTRA_LETTERS = ["b", "d", "p", "m", "n", "s", "t", "g", "r", "l", "f", "h", "a", "e", "i", "o", "u"] as const;

export function blankCard(): WordCard {
  return { box: 0, ok: 0, miss: 0, streak: 0 };
}

export function isTrackedWord(factKey: string | undefined): factKey is string {
  return !!factKey && (factKey.startsWith("sw:") || factKey.startsWith("sp:"));
}

/** A clean correct moves the word up a box. A miss or a hint puts it back at box 0. */
export function nextWordCard(prev: WordCard | undefined, ok: boolean, hinted: boolean): WordCard {
  const card = prev ?? blankCard();
  if (!ok) return { box: 0, ok: card.ok, miss: card.miss + 1, streak: 0 };
  if (hinted) return { box: 0, ok: card.ok + 1, miss: card.miss + 1, streak: 0 };
  return {
    box: Math.min(WORD_BOX_MAX, card.box + 1),
    ok: card.ok + 1,
    miss: card.miss,
    streak: card.streak + 1,
  };
}

/** Lower means the word should come back sooner. Unseen words sit in the middle. */
export function dueScore(card: WordCard | undefined): number {
  if (!card) return 2;
  if (card.box === 0 && card.miss > 0) return 0;
  return card.box + 2;
}

export function dueWordIds(cards: Record<string, WordCard>, ids: readonly string[]): string[] {
  return ids
    .filter((id) => {
      const card = cards[id];
      return card != null && dueScore(card) === 0;
    })
    .sort((a, b) => (cards[b]!.miss - cards[a]!.miss) || a.localeCompare(b));
}

export function orderForReview<T extends { id: string }>(items: readonly T[], cards: Record<string, WordCard>): T[] {
  return [...items].sort((a, b) => dueScore(cards[a.id]) - dueScore(cards[b.id]) || a.id.localeCompare(b.id));
}

/** Prefer due words, and still mix in the rest of the list. */
export function pickFromPrefer<T extends { id: string }>(rng: Rng, items: readonly T[], prefer: readonly string[]): T {
  if (items.length === 0) throw new Error("empty word list");
  const wanted = new Set(prefer);
  const due = items.filter((item) => wanted.has(item.id));
  const pool = due.length > 0 && rng.next() < 0.75 ? due : items;
  return rng.pick(pool);
}

export function noteRoundWords(words: Record<string, WordCard>, answers: readonly AnswerMark[]): Record<string, WordCard> {
  let next = words;
  for (const mark of answers) {
    if (!isTrackedWord(mark.factKey)) continue;
    const card = nextWordCard(next[mark.factKey], mark.ok, mark.hint === true || mark.taught === true);
    if (next === words) next = { ...words };
    next[mark.factKey] = card;
  }
  return next;
}

export function insertReplay<T extends { id: string; factKey?: string; replay?: boolean }>(
  queue: readonly T[],
  index: number,
  question: T,
): T[] {
  if (!question.replay || !question.factKey || question.id.endsWith("-r")) return queue as T[];
  const insertAt = Math.min(queue.length, index + 2);
  const soon = queue.slice(index + 1, insertAt + 1);
  if (soon.some((item) => item.factKey === question.factKey)) return queue as T[];
  const copy = queue.slice();
  copy.splice(insertAt, 0, { ...question, id: `${question.id}-r` });
  return copy;
}

export function escapeWord(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function countWord(sentence: string, word: string): number {
  const re = new RegExp(`\\b${escapeWord(word)}\\b`, "gi");
  return sentence.match(re)?.length ?? 0;
}

export function blankOut(sentence: string, word: string): string {
  const re = new RegExp(`\\b${escapeWord(word)}\\b`, "i");
  return sentence.replace(re, "___");
}

export function extraLetters(word: string, rng: Rng, count = 3): string[] {
  const have = new Set(word.split(""));
  const pool = EXTRA_LETTERS.filter((letter) => !have.has(letter));
  return rng.shuffle([...pool]).slice(0, count);
}

export function buildTiles(word: string, extras: readonly string[], rng: Rng): LetterTile[] {
  const tiles: LetterTile[] = [];
  word.split("").forEach((letter, index) => {
    tiles.push({ id: `w${index}-${letter}`, letter });
  });
  extras.forEach((letter, index) => {
    tiles.push({ id: `x${index}-${letter}`, letter });
  });
  return rng.shuffle(tiles);
}

export function freshBoard(word: string, tiles: readonly LetterTile[]): TileBoard {
  return { word, pool: [...tiles], placed: [], locked: 0 };
}

export function placedWord(board: TileBoard): string {
  return board.placed.map((tile) => tile.letter).join("");
}

export function placeTile(board: TileBoard, id: string): TileBoard {
  if (board.placed.length >= board.word.length) return board;
  const tile = board.pool.find((item) => item.id === id);
  if (!tile) return board;
  return {
    ...board,
    pool: board.pool.filter((item) => item.id !== id),
    placed: [...board.placed, tile],
  };
}

export function liftTile(board: TileBoard, id: string): TileBoard {
  const index = board.placed.findIndex((tile) => tile.id === id);
  if (index < 0 || index < board.locked) return board;
  const tile = board.placed[index]!;
  return {
    ...board,
    placed: board.placed.filter((item) => item.id !== id),
    pool: [...board.pool, tile],
  };
}

/** Lock the next correct letter into the slots and send the other tiles back to the pool. */
export function hintLetter(board: TileBoard): TileBoard {
  if (board.locked >= board.word.length) return board;
  const all = [...board.placed, ...board.pool];
  const used = new Set<string>();
  const lockedTiles: LetterTile[] = [];
  for (let i = 0; i <= board.locked; i++) {
    const letter = board.word[i]!;
    const tile = all.find((item) => !used.has(item.id) && item.letter === letter);
    if (!tile) return board;
    used.add(tile.id);
    lockedTiles.push(tile);
  }
  return {
    word: board.word,
    locked: board.locked + 1,
    placed: lockedTiles,
    pool: all.filter((item) => !used.has(item.id)),
  };
}

export function decoyWords(word: string): string[] {
  const chars = word.split("");
  const out: string[] = [];
  if (chars.length >= 2) {
    const swapped = [...chars];
    const first = swapped[0]!;
    swapped[0] = swapped[1]!;
    swapped[1] = first;
    out.push(swapped.join(""));
  }
  const vowels = "aeiou";
  const vowelAt = chars.findIndex((ch) => vowels.includes(ch));
  if (vowelAt >= 0) {
    const current = chars[vowelAt]!;
    const next = vowels[(vowels.indexOf(current) + 1) % vowels.length]!;
    const changed = [...chars];
    changed[vowelAt] = next;
    out.push(changed.join(""));
  }
  const tail = chars[chars.length - 1] === "t" ? "p" : "t";
  out.push(`${word.slice(0, -1)}${tail}`);
  out.push(`${word}e`);
  const unique = [...new Set(out)].filter((item) => item !== word && item.length > 0);
  while (unique.length < 3) unique.push(`${word}${unique.length + 1}`);
  return unique.slice(0, 3);
}
