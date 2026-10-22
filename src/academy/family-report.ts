import { barKeys, chipKeys, GAME_CARDS as GAMES, gameCard as gameById, skillLabel, type GameId } from "./games/catalog";
import { getLocale, show, t } from "./i18n";
import type { SkillStat } from "./model";
import { isMastered, skillPercent } from "./rewards";
import { gameIdForSkill, sheetForSkill, sheetTitle, sheetUrl, timesFactorOf } from "./sheet-match";
import { STORIES } from "./stories/catalog";

export interface PracticeTip {
  text: string;
  factor: number | null;
  gameId: string | null;
  sheetSlug: string | null;
  sheetQuery: string;
  sheetTitle: string | null;
  sheetHref: string | null;
}

export interface StuckSkill {
  key: string;
  label: string;
  pct: number;
  attempts: number;
  score: number;
}

export interface SkillMeter {
  key: string;
  label: string;
  pct: number;
  attempts: number;
}

export interface GameAccuracy {
  id: GameId;
  title: string;
  pct: number;
  attempts: number;
  skills: SkillMeter[];
}

export function attemptLabel(n: number): string {
  const count = Math.max(0, Math.floor(n));
  if (count === 1) return t("1 try", "1 intento");
  return t(`${count} tries`, `${count} intentos`, `${count} tentativas`);
}

export function parentSkillLabel(key: string): string {
  if (key.startsWith("fact:")) {
    const fact = key.slice(5);
    if (/^\d+×\d+$/.test(fact)) return fact;
  }
  const known = skillLabel(key);
  if (known !== key) return known;
  const gameId = gameIdForSkill(key);
  const game = gameId ? gameById(gameId) : undefined;
  if (!game || !gameId) return known;
  const levelId = levelOf(gameId, key);
  const level = game.levels.find((row) => row.id === levelId);
  if (level) return show(level.label);
  return show(game.title);
}

function levelOf(gameId: GameId, key: string): string {
  if (gameId === "spelling" && key.startsWith("spell:")) return key.slice("spell:".length);
  const prefix = `${gameId}:`;
  if (key.startsWith(prefix)) return key.slice(prefix.length);
  return "";
}

function questionPrefix(id: GameId): string {
  if (id === "spelling") return "spell:";
  return `${id}:`;
}

function sumStats(skills: Record<string, SkillStat>, keys: Iterable<string>): { ok: number; miss: number } {
  let ok = 0;
  let miss = 0;
  for (const key of keys) {
    const stat = skills[key];
    if (!stat) continue;
    ok += stat.ok;
    miss += stat.miss;
  }
  return { ok, miss };
}

function sumPrefix(skills: Record<string, SkillStat>, prefix: string): { ok: number; miss: number } {
  const keys = Object.keys(skills).filter((key) => key.startsWith(prefix));
  return sumStats(skills, keys);
}

function trackedKeys(skills: Record<string, SkillStat>): string[] {
  const keys = new Set<string>([...barKeys(), ...chipKeys()]);
  for (const key of Object.keys(skills)) {
    if (key.startsWith("fact:") && /^\d+×\d+$/.test(key.slice(5))) keys.add(key);
    if (key.startsWith("times:")) keys.add(key);
  }
  return [...keys];
}

/** Skills with enough tries that are still under the mastery line, hardest first. */
export function stuckSkills(skills: Record<string, SkillStat>): StuckSkill[] {
  const rows: StuckSkill[] = [];
  for (const key of trackedKeys(skills)) {
    const stat = skills[key];
    if (!stat) continue;
    const attempts = stat.ok + stat.miss;
    if (attempts < 2 || stat.miss < 1) continue;
    if (stat.ok / attempts >= 0.8) continue;
    rows.push({
      key,
      label: parentSkillLabel(key),
      pct: Math.round((stat.ok / attempts) * 100),
      attempts,
      score: stat.miss / attempts + stat.miss * 0.01,
    });
  }
  rows.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  return rows;
}

export function stuckLabels(skills: Record<string, SkillStat>): string[] {
  const labels: string[] = [];
  for (const row of stuckSkills(skills)) {
    if (labels.includes(row.label)) continue;
    labels.push(row.label);
    if (labels.length === 3) break;
  }
  return labels;
}

/** Up to three skills that are already feeling easy. */
export function winLabels(skills: Record<string, SkillStat>): string[] {
  const stuck = new Set(stuckSkills(skills).map((row) => row.key));
  const ranked: { key: string; pct: number; attempts: number; mastered: boolean }[] = [];
  for (const key of trackedKeys(skills)) {
    if (stuck.has(key)) continue;
    const stat = skills[key];
    const pct = skillPercent(stat);
    if (pct == null || !stat) continue;
    const attempts = stat.ok + stat.miss;
    const mastered = isMastered(stat);
    if (!mastered && !(attempts >= 3 && pct >= 70)) continue;
    ranked.push({ key, pct, attempts, mastered });
  }
  ranked.sort((a, b) => Number(b.mastered) - Number(a.mastered) || b.pct - a.pct || b.attempts - a.attempts || a.key.localeCompare(b.key));
  const labels: string[] = [];
  for (const row of ranked) {
    const label = parentSkillLabel(row.key);
    if (labels.includes(label)) continue;
    labels.push(label);
    if (labels.length === 3) break;
  }
  return labels;
}

function hasTimesRows(skills: Record<string, SkillStat>): boolean {
  for (const [key, stat] of Object.entries(skills)) {
    if (stat.ok + stat.miss <= 0) continue;
    if (key.startsWith("times:") || key.startsWith("table:")) return true;
  }
  return false;
}

function skillMeters(gameId: GameId, skills: Record<string, SkillStat>): SkillMeter[] {
  const game = gameById(gameId);
  if (!game) return [];
  const keys = new Set<string>();
  for (const row of game.bars) keys.add(row.key);
  for (const row of game.chips) keys.add(row.key);
  for (const level of game.levels) {
    keys.add(gameId === "spelling" ? `spell:${level.id}` : `${gameId}:${level.id}`);
  }
  if (gameId === "times" && !hasTimesRows(skills)) {
    for (const key of Object.keys(skills)) {
      if (key.startsWith("fact:") && /^\d+×\d+$/.test(key.slice(5))) keys.add(key);
    }
  }
  const rows: SkillMeter[] = [];
  for (const key of keys) {
    const stat = skills[key];
    const pct = skillPercent(stat);
    if (pct == null || !stat) continue;
    rows.push({ key, label: parentSkillLabel(key), pct, attempts: stat.ok + stat.miss });
  }
  rows.sort((a, b) => {
    const aOpen = a.attempts >= 2 && a.pct < 80 ? 0 : 1;
    const bOpen = b.attempts >= 2 && b.pct < 80 ? 0 : 1;
    return aOpen - bOpen || a.pct - b.pct || b.attempts - a.attempts || a.key.localeCompare(b.key);
  });
  return rows.slice(0, 6);
}

/** One accuracy row per game the child has actually played, math and reading. */
export function gameAccuracy(skills: Record<string, SkillStat>): GameAccuracy[] {
  const rows: GameAccuracy[] = [];
  for (const game of GAMES) {
    const totals = totalsFor(game.id, skills);
    const attempts = totals.ok + totals.miss;
    if (attempts <= 0) continue;
    rows.push({
      id: game.id,
      title: show(game.title),
      pct: Math.round((totals.ok / attempts) * 100),
      attempts,
      skills: skillMeters(game.id, skills),
    });
  }
  rows.sort((a, b) => b.attempts - a.attempts || a.id.localeCompare(b.id));
  return rows;
}

function totalsFor(id: GameId, skills: Record<string, SkillStat>): { ok: number; miss: number } {
  const game = gameById(id);
  const fromQuestions = sumPrefix(skills, questionPrefix(id));
  if (fromQuestions.ok + fromQuestions.miss > 0) return fromQuestions;
  if (!game) return fromQuestions;
  const fromBars = sumStats(
    skills,
    game.bars.map((row) => row.key),
  );
  if (fromBars.ok + fromBars.miss > 0) return fromBars;
  const fromChips = sumStats(
    skills,
    game.chips.map((row) => row.key),
  );
  if (fromChips.ok + fromChips.miss > 0 || id !== "times") return fromChips;
  const facts = Object.keys(skills).filter((key) => key.startsWith("fact:") && /^\d+×\d+$/.test(key.slice(5)));
  return sumStats(skills, facts);
}

function tipFrom(who: string, names: string[], match: NonNullable<ReturnType<typeof sheetForSkill>>, factor: number | null): PracticeTip {
  const sheet = sheetTitle(match);
  const subject =
    names.length >= 2 ? t(`${names[0]} and ${names[1]}`, `${names[0]} y ${names[1]}`, `${names[0]} e ${names[1]}`) : (names[0] ?? sheet);
  return {
    text: t(
      `${who} is still learning ${subject}. The free "${sheet}" worksheet is a calm one for tonight.`,
      `${who} todavía está aprendiendo ${subject}. La hoja gratis «${sheet}» es una forma tranquila para esta noche.`, `${who} ainda está aprendendo ${subject}. A folha grátis «${sheet}» é um jeito tranquilo para hoje à noite.`,
    ),
    factor,
    gameId: match.gameId,
    sheetSlug: match.slug,
    sheetQuery: match.query,
    sheetTitle: sheet,
    sheetHref: sheetUrl(match),
  };
}

function reviewTip(who: string, skills: Record<string, SkillStat>): PracticeTip | null {
  const games = gameAccuracy(skills);
  const review = games[0];
  if (!review) return null;
  const rough = review.skills.find((row) => row.pct < 80);
  if (rough) {
    const match = sheetForSkill(rough.key);
    if (match) return tipFrom(who, [rough.label], match, timesFactorOf(rough.key));
  }
  const key = review.skills[0]?.key;
  const fallbackKey = `${review.id}:${gameById(review.id)?.levels[0]?.id ?? ""}`;
  const match = (key ? sheetForSkill(key) : null) ?? sheetForSkill(fallbackKey);
  if (!match) return null;
  const sheet = sheetTitle(match);
  return {
    text: t(
      `${who} is doing well. The free "${sheet}" worksheet is a calm one if you want a page tonight.`,
      `${who} va bien. La hoja gratis «${sheet}» es una forma tranquila si quieren una página esta noche.`, `${who} vai bem. A folha grátis «${sheet}» é um jeito tranquilo se quiserem uma página hoje à noite.`,
    ),
    factor: key ? timesFactorOf(key) : null,
    gameId: match.gameId,
    sheetSlug: match.slug,
    sheetQuery: match.query,
    sheetTitle: sheet,
    sheetHref: sheetUrl(match),
  };
}

function emptyTip(who: string): PracticeTip {
  return {
    text: t(
      `${who} can print a free worksheet and play it together tonight.`,
      `${who} puede imprimir una hoja gratis y jugarla juntos esta noche.`, `${who} pode imprimir uma folha grátis e jogar juntos hoje à noite.`,
    ),
    factor: null,
    gameId: null,
    sheetSlug: null,
    sheetQuery: "",
    sheetTitle: null,
    sheetHref: null,
  };
}

/**
 * One calm suggestion for tonight. Picks the skill that still needs practice
 * across every game, then names that game's free worksheet.
 */
export function practiceTip(name: string, skills: Record<string, SkillStat>): PracticeTip {
  const who = name.trim() || t("Your child", "Tu hijo o hija");
  const stuck = stuckSkills(skills);
  for (let i = 0; i < stuck.length; i++) {
    const top = stuck[i];
    if (!top) continue;
    const match = sheetForSkill(top.key);
    if (!match) continue;
    const next = stuck[i + 1];
    const sameGame = next != null && next.label !== top.label && sheetForSkill(next.key)?.gameId === match.gameId;
    const names = sameGame && next ? [top.label, next.label] : [top.label];
    return tipFrom(who, names, match, timesFactorOf(top.key));
  }
  return reviewTip(who, skills) ?? emptyTip(who);
}

export interface StoryBrief {
  finishes: number;
  /** English titles. Empty in Spanish so the report does not show untranslated books. */
  titles: readonly string[];
  line: string;
}

/** Books finished on this device. Spanish keeps the count and hides the English titles. */
export function storyBrief(skills: Record<string, SkillStat>): StoryBrief {
  const titles: string[] = [];
  let finishes = 0;
  for (const story of STORIES) {
    const n = skills[`story:${story.id}`]?.ok ?? 0;
    if (n <= 0) continue;
    finishes += n;
    titles.push(story.title);
  }
  if (getLocale() === "es" || getLocale() === "pt") {
    const line =
      getLocale() === "pt"
        ? finishes === 0
          ? "As histórias estão em inglês por enquanto."
          : finishes === 1
            ? "1 história lida em inglês."
            : `${finishes} histórias lidas em inglês.`
        : finishes === 0
          ? "Los cuentos están en inglés por ahora."
          : finishes === 1
            ? "1 cuento leído en inglés."
            : `${finishes} cuentos leídos en inglés.`;
    return { finishes, titles: [], line };
  }
  const line =
    finishes === 0 ? "No stories finished yet." : finishes === 1 ? "1 story finished." : `${finishes} stories finished.`;
  return { finishes, titles, line };
}
