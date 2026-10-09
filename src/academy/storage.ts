import {
  MAX_CHILDREN,
  SQUAD_IDS,
  cleanName,
  defaultLevels,
  isAddLevel,
  isGameId,
  isGrade,
  isSquadId,
  isTimeLevel,
  isTimesLevel,
  type Child,
  type GameId,
  type Grade,
  type Levels,
  type Save,
  type SkillStat,
} from "./model";

export const STORAGE_KEY = "squishee-academy-v1";
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
    bestStars: { times: 0, add: 0, time: 0 },
    rounds: 0,
    levels: defaultLevels(grade),
  };
}

export function freshSave(): Save {
  const child = blankChild();
  return { version: 1, activeId: child.id, sound: true, children: [child] };
}

function clampInt(v: unknown, min: number, max: number, fallback = min): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function parseLevels(raw: unknown, grade: Grade): Levels {
  const base = defaultLevels(grade);
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return {
    times: isTimesLevel(o.times) ? o.times : base.times,
    add: isAddLevel(o.add) ? o.add : base.add,
    time: isTimeLevel(o.time) ? o.time : base.time,
  };
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

function parseBest(raw: unknown): Record<GameId, number> {
  const base = { times: 0, add: 0, time: 0 };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return {
    times: clampInt(o.times, 0, 3),
    add: clampInt(o.add, 0, 3),
    time: clampInt(o.time, 0, 3),
  };
}

export function parseChild(raw: unknown): Child | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id || o.id.length > 40) return null;
  const grade = isGrade(o.grade) ? o.grade : "K";
  const avatarId = isSquadId(o.avatarId) ? o.avatarId : SQUAD_IDS[0];
  const lastPlayed = typeof o.lastPlayed === "string" && DATE_KEY.test(o.lastPlayed) ? o.lastPlayed : null;
  return {
    id: o.id,
    name: typeof o.name === "string" ? cleanName(o.name) : "",
    grade,
    avatarId,
    stars: clampInt(o.stars, 0, 100000),
    streak: clampInt(o.streak, 0, 9999),
    lastPlayed,
    opened: clampInt(o.opened, 0, SQUAD_IDS.length, 3),
    skills: parseSkills(o.skills),
    secondsByDay: parseSeconds(o.secondsByDay),
    bestStars: parseBest(o.bestStars),
    rounds: clampInt(o.rounds, 0, 100000),
    levels: parseLevels(o.levels, grade),
  };
}

export function parseSave(raw: unknown): Save {
  if (!raw || typeof raw !== "object") return freshSave();
  const o = raw as Record<string, unknown>;
  if (o.version !== 1 || !Array.isArray(o.children)) return freshSave();
  const children = o.children.map(parseChild).filter((child): child is Child => child != null).slice(0, MAX_CHILDREN);
  if (!children.length) return freshSave();
  const activeId = children.some((child) => child.id === o.activeId) ? String(o.activeId) : children[0]!.id;
  return { version: 1, activeId, sound: o.sound !== false, children };
}

export function activeChild(save: Save): Child {
  return save.children.find((child) => child.id === save.activeId) ?? save.children[0]!;
}

export function mapActive(save: Save, fn: (child: Child) => Child): Save {
  const id = activeChild(save).id;
  return { ...save, children: save.children.map((child) => (child.id === id ? fn(child) : child)) };
}

export function withGrade(child: Child, grade: Grade): Child {
  return { ...child, grade, levels: defaultLevels(grade) };
}

export function withLevel(child: Child, game: GameId, level: string): Child {
  if (!isGameId(game)) return child;
  switch (game) {
    case "times":
      return isTimesLevel(level) ? { ...child, levels: { ...child.levels, times: level } } : child;
    case "add":
      return isAddLevel(level) ? { ...child, levels: { ...child.levels, add: level } } : child;
    case "time":
      return isTimeLevel(level) ? { ...child, levels: { ...child.levels, time: level } } : child;
    default: {
      const neverGame: never = game;
      return neverGame;
    }
  }
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshSave();
    return parseSave(JSON.parse(raw) as unknown);
  } catch {
    return freshSave();
  }
}

export function writeSave(save: Save): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    /* private mode or a full disk — keep playing this visit */
  }
}

export function needsHello(save: Save): boolean {
  return !activeChild(save).name;
}
