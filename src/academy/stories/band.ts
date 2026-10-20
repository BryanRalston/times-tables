import { squisheeById } from "@/lib/squishees";
import type { Grade } from "../model";
import { RHYME_FAMILIES, SOUND_BANK } from "../games/phonics";
import { ALL_SIGHT, type SightList } from "../games/sight-data";
import { ALL_SPELL, type SpellLevel } from "../games/spell-data";

/** Read-along books stop at grade 2. Older grades can still open them. */
export type StoryGrade = "PK" | "K" | "1" | "2";

const GRADE_RANK: Record<Grade, number> = {
  PK: 0,
  K: 1,
  "1": 2,
  "2": 3,
  "3": 4,
  "4": 5,
};

const SIGHT_BAND: Record<StoryGrade, readonly SightList[]> = {
  PK: ["preprimer"],
  K: ["preprimer", "primer"],
  "1": ["preprimer", "primer", "first"],
  "2": ["preprimer", "primer", "first", "second"],
};

const SPELL_BAND: Record<StoryGrade, readonly SpellLevel[]> = {
  PK: [],
  K: ["cvc"],
  "1": ["cvc", "digraphs", "blends", "long"],
  "2": ["cvc", "digraphs", "blends", "long", "patterns"],
};

function listWords(grade: StoryGrade): Set<string> {
  const words = new Set<string>();
  const sight = new Set(SIGHT_BAND[grade]);
  for (const row of ALL_SIGHT) {
    if (sight.has(row.list)) words.add(row.word.toLowerCase());
  }
  const spell = new Set<SpellLevel>(SPELL_BAND[grade]);
  for (const row of ALL_SPELL) {
    if (spell.has(row.level)) words.add(row.word.toLowerCase());
  }
  for (const row of SOUND_BANK) words.add(row.word.toLowerCase());
  for (const family of RHYME_FAMILIES) {
    for (const word of family.words) words.add(word.toLowerCase());
  }
  return words;
}

const BANDS: Record<StoryGrade, Set<string>> = {
  PK: listWords("PK"),
  K: listWords("K"),
  "1": listWords("1"),
  "2": listWords("2"),
};

/** Single-word squishee name, lowercased. Multi-word names are not story tokens. */
export function castToken(id: string): string | null {
  const name = squisheeById(id)?.name ?? "";
  if (!/^[A-Za-z]+$/.test(name)) return null;
  return name.toLowerCase();
}

export function wordAllowed(grade: StoryGrade, word: string, castIds: readonly string[]): boolean {
  const token = word.toLowerCase();
  if (BANDS[grade].has(token)) return true;
  for (const id of castIds) {
    if (castToken(id) === token) return true;
  }
  return false;
}

export function storyRank(grade: StoryGrade): number {
  return GRADE_RANK[grade];
}

/** Books at this grade and every easier book. Grade 3 and 4 keep the grade 2 shelf. */
export function gradeCap(grade: Grade): number {
  return Math.min(GRADE_RANK[grade], GRADE_RANK["2"]);
}

export function storyGradeLabel(grade: StoryGrade): string {
  switch (grade) {
    case "PK":
      return "Pre-K";
    case "K":
      return "K";
    case "1":
      return "Grade 1";
    case "2":
      return "Grade 2";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}
