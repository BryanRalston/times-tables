import { skillHeat, skillKeyForLevel } from "./adapt";
import { GAME_CARDS as GAMES, gameCard } from "./games/catalog";
import { gameOffered } from "./games/offer";
import { tierKey, tierWindow, type Tier } from "./grade-map";
import { t } from "./i18n";
import { bossReady, normalizeJourney, subjectSpot } from "./journey";
import type { Child } from "./model";
import { nextPlacement, type PlacementReason } from "./placement";
import { levelStones } from "./stones";
import { READING_GAMES, SPELLING_GAMES } from "./subject-games";

/**
 * Subjects group the games into a few kid-clear paths. Each subject has its own
 * trail (its games in island order), its own Continue, and its own picks.
 */
export type SubjectId = "math" | "reading" | "spelling";

export interface Subject {
  id: SubjectId;
  /** Squishee picture shown on the subject tab. */
  icon: string;
  /** Games in trail order. Every game is in exactly one subject. */
  games: readonly string[];
  /** Reading also opens the read-along story shelf. */
  stories: boolean;
}

const READING = [...READING_GAMES];
const SPELLING = [...SPELLING_GAMES];
/** Everything else is Math (numbers, time, money, shapes, data), in island order. */
const MATH = GAMES.map((row) => row.id as string).filter((id) => !READING.includes(id) && !SPELLING.includes(id));

export const SUBJECTS: readonly Subject[] = [
  { id: "math", icon: "frog", games: MATH, stories: false },
  { id: "reading", icon: "grape", games: READING, stories: true },
  { id: "spelling", icon: "owl", games: SPELLING, stories: false },
];

export const DEFAULT_SUBJECT: SubjectId = "math";

export function isSubjectId(value: unknown): value is SubjectId {
  return typeof value === "string" && SUBJECTS.some((row) => row.id === value);
}

export function subjectById(id: string | undefined): Subject {
  return SUBJECTS.find((row) => row.id === id) ?? SUBJECTS[0]!;
}

export function subjectOf(gameId: string): SubjectId {
  return SUBJECTS.find((row) => row.games.includes(gameId))?.id ?? DEFAULT_SUBJECT;
}

export function subjectName(id: SubjectId): string {
  switch (id) {
    case "math":
      return t("Math", "Matemáticas", "Matemática", "Maths", "数学", "गणित", "الرياضيات");
    case "reading":
      return t("Reading", "Lectura", "Leitura", "Lecture", "阅读", "पढ़ना", "القراءة");
    case "spelling":
      return t("Spelling", "Ortografía", "Ortografia", "Orthographe", "拼写", "वर्तनी", "التهجئة");
    default: {
      const never: never = id;
      return never;
    }
  }
}

type Learner = Pick<Child, "grade" | "rounds" | "skills" | "levels" | "challengeAhead" | "tiers" | "journey"> & { subject?: string };

function allowedIds(child: Learner, gameId: string): string[] {
  const game = gameCard(gameId);
  if (!game) return [];
  const tier: Tier = child.tiers?.[tierKey(child.grade, gameId)] ?? "medium";
  const window = tierWindow(game.levels.map((row) => row.id), gameId, child.grade, child.challengeAhead === true, tier);
  return window.offer === "later" ? [] : [...window.ids];
}

/** The subject's trail: games shown in this language and open for this grade, in island order. */
export function subjectTrail(child: Learner, id: SubjectId): string[] {
  return subjectById(id).games.filter((gameId) => gameOffered(gameId) && allowedIds(child, gameId).length > 0);
}

/** Every game in the subject shown in this language, open or coming later. */
export function subjectGames(id: SubjectId): string[] {
  return subjectById(id).games.filter((gameId) => gameOffered(gameId));
}

/** Subjects with something to do in this language. Reading keeps the story shelf. */
export function visibleSubjects(child: Learner): Subject[] {
  return SUBJECTS.filter((row) => row.stories || subjectTrail(child, row.id).length > 0);
}

/** Last used subject, else Math, else the first subject with games. */
export function activeSubject(child: Learner): SubjectId {
  const visible = visibleSubjects(child);
  const saved = visible.find((row) => row.id === child.subject);
  return saved?.id ?? visible.find((row) => row.id === DEFAULT_SUBJECT)?.id ?? visible[0]?.id ?? DEFAULT_SUBJECT;
}

export type NextReason = PlacementReason | "boss" | "stories";

export interface NextStep {
  subject: SubjectId;
  /** Empty when the subject has only the story shelf here. */
  game: string;
  level: string;
  /** The level's number on its stepping stone (0 for the story shelf). */
  num: number;
  reason: NextReason;
  /** The hash Continue / Next opens. */
  href: string;
}

/** Tried 2+ times and still under 80% right. */
function stillMissed(child: Learner, gameId: string, level: string): boolean {
  const stat = child.skills[skillKeyForLevel(gameId, level)];
  if (!stat) return false;
  const n = stat.ok + stat.miss;
  return n >= 2 && stat.miss >= 1 && stat.ok / n < 0.8;
}

function stoneNum(gameId: string, level: string): number {
  return gameCard(gameId)?.levels.find((row) => row.id === level)?.num ?? 0;
}

/**
 * THE one "what's next" rule. Home Continue, each subject's Continue and the
 * round-end Next all call this. It walks the subject's own path, so a kid never
 * has to figure out where to go:
 *
 * 1. Stand on the island the subject's path is at (the chosen grade decides
 *    where a new visitor starts: grade 3 Math starts on Times Tables).
 * 2. A level on this island the kid is still missing comes back first.
 * 3. Otherwise, if the boss stone is ready, face the boss.
 * 4. Otherwise the next unfinished level stone, in level order, from the one
 *    the kid is on. When every stone is mastered, keep the last one.
 * Other islands' weak skills never pull Continue off the path; they show under
 * More games. A subject with no game here (Reading in zh/hi/ar) continues to
 * the story shelf.
 */
export function nextFor(child: Learner, id: SubjectId): NextStep {
  const trail = subjectTrail(child, id);
  if (trail.length === 0) return { subject: id, game: "", level: "", num: 0, reason: "stories", href: "#/stories" };
  const spot = subjectSpot(normalizeJourney(child.journey, child.grade), id, child.grade);
  const game = trail.includes(spot.areaId) ? spot.areaId : trail[0]!;
  const href = `#/play/${game}`;
  const stones = levelStones(child, game);
  const ids = stones.map((row) => row.level);
  const nowAt = Math.max(0, stones.findIndex((row) => row.state === "now"));
  const missed = ids.slice(0, nowAt + 1).find((level) => stillMissed(child, game, level));
  if (missed) return { subject: id, game, level: missed, num: stoneNum(game, missed), reason: "weak", href };
  if (bossReady(child.journey, game, child.grade)) {
    const level = ids[nowAt] ?? ids[0] ?? "";
    return { subject: id, game, level, num: stoneNum(game, level), reason: "boss", href };
  }
  const ahead = ids.slice(nowAt);
  const level = ahead.find((row) => skillHeat(child.skills[skillKeyForLevel(game, row)]) !== "mastered") ?? ids[ids.length - 1] ?? "";
  const seen = skillHeat(child.skills[skillKeyForLevel(game, level)]) !== "new";
  const reason: NextReason = ids.indexOf(level) > nowAt ? "stretch" : seen ? "review" : "start";
  return { subject: id, game, level, num: stoneNum(game, level), reason, href };
}

export interface TodayPick {
  game: string;
  level: string;
  reason: NextReason;
}

/**
 * For you today: at most 3 different games in this subject, all open for the grade.
 * First the same next step as Continue, then a weak or stretch pick, then one more.
 */
export function forYouToday(child: Learner, id: SubjectId): TodayPick[] {
  const trail = subjectTrail(child, id);
  const first = nextFor(child, id);
  const picks: TodayPick[] = [];
  if (first.game) picks.push({ game: first.game, level: first.level, reason: first.reason });
  while (picks.length < 3) {
    const rest = trail.filter((gameId) => !picks.some((row) => row.game === gameId));
    if (rest.length === 0) break;
    const place = nextPlacement(child, rest);
    const game = rest.includes(place.game) ? place.game : rest[0]!;
    picks.push({ game, level: game === place.game ? place.level : (allowedIds(child, game)[0] ?? ""), reason: game === place.game ? place.reason : "start" });
  }
  return picks;
}

/** Where a game was opened from. X and Home fallback return here. */
export type From = "home" | "map" | "games";

export function parseFrom(value: string | null | undefined): From {
  return value === "map" || value === "games" ? value : "home";
}

/** The screen X returns to. Map and More games keep the game's subject. */
export function backHref(from: From, gameId: string): string {
  const subject = subjectOf(gameId);
  if (from === "map") return `#/map/${subject}`;
  if (from === "games") return `#/games/${subject}`;
  return "#/";
}

export function playHref(gameId: string, from: From, crown = false): string {
  const path = `#/play/${gameId}${crown ? "/crown" : ""}`;
  return from === "home" ? path : `${path}?from=${from}`;
}
