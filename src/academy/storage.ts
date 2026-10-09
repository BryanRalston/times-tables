import { parseCosmeticIds, parseEquippedCosmetic } from "@/lib/cosmetics";
import { squisheeById } from "@/lib/squishees";
import { hostIdFor } from "./buddy/hosts";
import { ownedIds, palOwned } from "./buddy/unlock";
import { defaultLevels, gameById, GAMES, isGameId } from "./games/registry";
import { levelAllowed } from "./grade-map";
import { blankJourney, normalizeJourney, parseJourney } from "./journey";
import {
  DAILY_GOAL,
  MAX_CHILDREN,
  SQUAD_IDS,
  cleanName,
  isGrade,
  isSquadId,
  type Child,
  type DailyGiftState,
  type Grade,
  type Save,
  type SkillStat,
} from "./model";

/** Stable key. The schema version lives on the save, not in the key name. */
export const STORAGE_KEY = "squishee-academy-v1";
export const SAVE_VERSION = 6;

/**
 * Migrations run from the save's version up to SAVE_VERSION.
 * Keyed by the version being left behind. Each step must set version to key + 1.
 */
const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  1: migrateV1toV2,
  2: migrateV2toV3,
  3: migrateV3toV4,
  4: migrateV4toV5,
  5: migrateV5toV6,
};

/** A newer app wrote this disk. Don't replace it with an older schema. */
let holdDisk = false;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function newId(): string {
  return `c-${Math.random().toString(36).slice(2, 10)}`;
}

export function blankChild(opts: { id?: string; name?: string; grade?: Grade; avatarId?: string } = {}): Child {
  const grade = opts.grade ?? "K";
  const avatarId = opts.avatarId && isSquadId(opts.avatarId) ? opts.avatarId : "peach";
  return {
    id: opts.id ?? newId(),
    name: cleanName(opts.name ?? ""),
    grade,
    avatarId,
    stars: 0,
    streak: 0,
    lastPlayed: null,
    opened: 3,
    skills: {},
    secondsByDay: {},
    bestStars: Object.fromEntries(GAMES.map((game) => [game.id, 0])),
    rounds: 0,
    levels: defaultLevels(grade),
    coins: 0,
    cosmetics: [],
    equipped: "",
    gifted: [],
    journey: normalizeJourney(blankJourney(), grade),
    dailyDate: null,
    dailyRounds: 0,
    dailyGift: "none",
    friends: [],
    hatched: [],
    egg: "none",
    words: {},
    challengeAhead: false,
  };
}

export function freshSave(): Save {
  const child = blankChild();
  return { version: SAVE_VERSION, activeId: child.id, sound: true, children: [child] };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

/** Version 1 stored levels for the launch games only. Open those maps for later games. */
function migrateV1toV2(raw: Record<string, unknown>): Record<string, unknown> {
  const children = Array.isArray(raw.children)
    ? raw.children.map((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) return row;
        const child = row as Record<string, unknown>;
        return { ...child, levels: asRecord(child.levels), bestStars: asRecord(child.bestStars) };
      })
    : raw.children;
  return { ...raw, version: 2, children };
}

/** Version 2 had stars and levels, and no island, coins, or daily gift. */
function migrateV2toV3(raw: Record<string, unknown>): Record<string, unknown> {
  const children = Array.isArray(raw.children)
    ? raw.children.map((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) return row;
        const child = row as Record<string, unknown>;
        return {
          ...child,
          coins: child.coins ?? 0,
          cosmetics: child.cosmetics ?? [],
          equipped: child.equipped ?? "",
          gifted: child.gifted ?? [],
          journey: child.journey ?? blankJourney(),
          dailyDate: child.dailyDate ?? null,
          dailyRounds: child.dailyRounds ?? 0,
          dailyGift: child.dailyGift ?? "none",
        };
      })
    : raw.children;
  return { ...raw, version: 3, children };
}

/** Version 3 had island progress and no per-word memory for sight words or spelling. */
function migrateV3toV4(raw: Record<string, unknown>): Record<string, unknown> {
  const children = Array.isArray(raw.children)
    ? raw.children.map((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) return row;
        const child = row as Record<string, unknown>;
        return { ...child, words: asRecord(child.words) };
      })
    : raw.children;
  return { ...raw, version: 4, children };
}

/** Version 4 had word cards, and no buddy book, boss friends, or island egg. */
function migrateV4toV5(raw: Record<string, unknown>): Record<string, unknown> {
  const children = Array.isArray(raw.children)
    ? raw.children.map((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) return row;
        const child = row as Record<string, unknown>;
        const journey = asRecord(child.journey);
        const bosses = Array.isArray(journey.bosses) ? journey.bosses.filter((id): id is string => typeof id === "string") : [];
        const friends = Array.isArray(child.friends) ? child.friends : bosses.map((id) => hostIdFor(id));
        const rounds = typeof child.dailyRounds === "number" ? child.dailyRounds : 0;
        const egg =
          child.egg === "open" || child.egg === "closed" || child.egg === "none"
            ? child.egg
            : rounds >= DAILY_GOAL
              ? "closed"
              : "none";
        return {
          ...child,
          friends,
          hatched: Array.isArray(child.hatched) ? child.hatched : [],
          egg,
        };
      })
    : raw.children;
  return { ...raw, version: 5, children };
}

/** Version 5 had buddies. New islands fill in when the child is parsed. */
function migrateV5toV6(raw: Record<string, unknown>): Record<string, unknown> {
  const children = Array.isArray(raw.children)
    ? raw.children.map((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) return row;
        const child = row as Record<string, unknown>;
        return { ...child, levels: asRecord(child.levels), bestStars: asRecord(child.bestStars) };
      })
    : raw.children;
  return { ...raw, version: 6, children };
}

function migrateRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  let current = raw as Record<string, unknown>;
  const initial = current.version;
  if (typeof initial !== "number" || initial > SAVE_VERSION || initial < 1) return raw;
  let version = initial;
  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return raw;
    const next = step(current);
    if (typeof next.version !== "number" || next.version !== version + 1) return raw;
    current = next;
    version = next.version;
  }
  return current;
}

function clampInt(v: unknown, min: number, max: number, fallback = min): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function parseLevels(raw: unknown, grade: Grade, challengeAhead: boolean): Record<string, string> {
  const out: Record<string, string> = { ...defaultLevels(grade) };
  if (!raw || typeof raw !== "object") return out;
  const o = raw as Record<string, unknown>;
  for (const game of GAMES) {
    if (!game.isLevel(o[game.id])) continue;
    const level = String(o[game.id]);
    const ids = game.levels.map((row) => row.id);
    if (levelAllowed(ids, game.id, grade, level, challengeAhead)) out[game.id] = level;
  }
  return out;
}

function parseSkills(raw: unknown): Record<string, SkillStat> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, SkillStat> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key || key.length > 40 || !value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    out[key] = { ok: clampInt(row.ok, 0, 100000), miss: clampInt(row.miss, 0, 100000) };
  }
  return out;
}

function parseSeconds(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!DATE_KEY.test(key)) continue;
    out[key] = clampInt(value, 0, 4 * 60 * 60);
  }
  return out;
}

function parseWords(raw: unknown): Child["words"] {
  if (!raw || typeof raw !== "object") return {};
  const out: Child["words"] = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^(sw|sp):[a-z0-9'-]{1,32}$/i.test(key)) continue;
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    out[key] = {
      box: clampInt(row.box, 0, 5),
      ok: clampInt(row.ok, 0, 100000),
      miss: clampInt(row.miss, 0, 100000),
      streak: clampInt(row.streak, 0, 100000),
    };
  }
  return out;
}

function parseGiftState(raw: unknown): DailyGiftState {
  if (raw === "closed" || raw === "open" || raw === "none") return raw;
  return "none";
}

function parseGifted(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const id of raw) {
    if (typeof id !== "string" || !isSquadId(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

function parseSquisheeIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const id of raw) {
    if (typeof id !== "string" || !squisheeById(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

function parseBest(raw: unknown): Record<string, number> {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, number> = {};
  for (const game of GAMES) out[game.id] = clampInt(o[game.id], 0, 3);
  return out;
}

export function parseChild(raw: unknown): Child | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id || o.id.length > 40) return null;
  const grade = isGrade(o.grade) ? o.grade : "K";
  const lastPlayed = typeof o.lastPlayed === "string" && DATE_KEY.test(o.lastPlayed) ? o.lastPlayed : null;
  const cosmetics = parseCosmeticIds(o.cosmetics);
  const dailyDate = typeof o.dailyDate === "string" && DATE_KEY.test(o.dailyDate) ? o.dailyDate : null;
  const challengeAhead = o.challengeAhead === true;
  const journey = parseJourney(o.journey, grade);
  const friends = parseSquisheeIds(o.friends);
  for (const boss of journey.bosses) {
    const host = hostIdFor(boss);
    if (host && !friends.includes(host)) friends.push(host);
  }
  const hatched = parseSquisheeIds(o.hatched);
  const gifted = parseGifted(o.gifted);
  const stars = clampInt(o.stars, 0, 100000);
  const draft = {
    stars,
    gifted,
    friends,
    hatched,
  };
  const avatarRaw = typeof o.avatarId === "string" && squisheeById(o.avatarId) ? o.avatarId : SQUAD_IDS[0];
  const avatarId = palOwned(draft, avatarRaw) ? avatarRaw : (ownedIds(draft)[0] ?? SQUAD_IDS[0]);
  return {
    id: o.id,
    name: typeof o.name === "string" ? cleanName(o.name) : "",
    grade,
    avatarId,
    stars,
    streak: clampInt(o.streak, 0, 9999),
    lastPlayed,
    opened: clampInt(o.opened, 0, SQUAD_IDS.length, 3),
    skills: parseSkills(o.skills),
    secondsByDay: parseSeconds(o.secondsByDay),
    bestStars: parseBest(o.bestStars),
    rounds: clampInt(o.rounds, 0, 100000),
    levels: parseLevels(o.levels, grade, challengeAhead),
    coins: clampInt(o.coins, 0, 1_000_000),
    cosmetics,
    equipped: parseEquippedCosmetic(o.equipped, cosmetics),
    gifted,
    journey,
    dailyDate,
    dailyRounds: clampInt(o.dailyRounds, 0, 100),
    dailyGift: parseGiftState(o.dailyGift),
    friends,
    hatched,
    egg: parseGiftState(o.egg),
    words: parseWords(o.words),
    challengeAhead,
  };
}

export function parseSave(raw: unknown): Save {
  const migrated = migrateRaw(raw);
  if (!migrated || typeof migrated !== "object") return freshSave();
  const o = migrated as Record<string, unknown>;
  if (o.version !== SAVE_VERSION || !Array.isArray(o.children)) return freshSave();
  const children = o.children.map(parseChild).filter((child): child is Child => child != null).slice(0, MAX_CHILDREN);
  if (!children.length) return freshSave();
  const activeId = children.some((child) => child.id === o.activeId) ? String(o.activeId) : children[0]!.id;
  return { version: SAVE_VERSION, activeId, sound: o.sound !== false, children };
}

export function activeChild(save: Save): Child {
  return save.children.find((child) => child.id === save.activeId) ?? save.children[0]!;
}

export function mapActive(save: Save, fn: (child: Child) => Child): Save {
  const id = activeChild(save).id;
  return { ...save, children: save.children.map((child) => (child.id === id ? fn(child) : child)) };
}

export function withGrade(child: Child, grade: Grade): Child {
  return {
    ...child,
    grade,
    levels: defaultLevels(grade),
    journey: normalizeJourney(child.journey, grade),
  };
}

export function withLevel(child: Child, gameId: string, level: string): Child {
  const game = gameById(gameId);
  if (!game || !isGameId(game.id) || !game.isLevel(level)) return child;
  const ids = game.levels.map((row) => row.id);
  if (!levelAllowed(ids, game.id, child.grade, level, child.challengeAhead)) return child;
  return { ...child, levels: { ...child.levels, [game.id]: level } };
}

export function addChild(save: Save, name: string, grade: Grade): Save {
  if (save.children.length >= MAX_CHILDREN) return save;
  const cleaned = cleanName(name);
  if (!cleaned) return save;
  const avatarId = save.children.length % 2 === 0 ? "peach" : "frog";
  const child = blankChild({ name: cleaned, grade, avatarId });
  return { ...save, activeId: child.id, children: [...save.children, child] };
}

export function loadSave(): Save {
  holdDisk = false;
  try {
    const rawText = localStorage.getItem(STORAGE_KEY);
    if (!rawText) return freshSave();
    const raw = JSON.parse(rawText) as unknown;
    const version =
      raw && typeof raw === "object" && typeof (raw as { version?: unknown }).version === "number"
        ? (raw as { version: number }).version
        : 0;
    if (version > SAVE_VERSION) {
      holdDisk = true;
      const played = parseSave({ ...(raw as Record<string, unknown>), version: SAVE_VERSION });
      return played;
    }
    return parseSave(raw);
  } catch {
    return freshSave();
  }
}

export function writeSave(save: Save): void {
  if (holdDisk) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    /* private mode or a full disk — keep playing this visit */
  }
}

export function needsHello(save: Save): boolean {
  return !activeChild(save).name;
}
