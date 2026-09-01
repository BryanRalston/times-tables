import { isFriday, isSchoolDay, isWeekend, lastSchoolDayOnOrBefore, schoolDayNumber, weekdayName } from "./calendar";
import {
  earlierUnits,
  fluencyFactorsForUnit,
  remainingSchoolDaysInUnit,
  suggestedUnitId,
  unitById,
  unitSpanDays,
  UNITS,
} from "./curriculum";
import { parseLocale, UI, type Locale } from "./i18n";
import { makeFluencyItem, makeQuestion, withSource } from "./questions";
import { rngFromSeed, type Rng } from "./rng";
import type { ActivityDef, ItemSource, Question, UnitDef } from "./types";

export interface DailyWalk {
  date: string;
  schoolDate: string;
  schoolDay: number;
  weekday: string;
  unit: UnitDef;
  isFriday: boolean;
  isWeekend: boolean;
  isSchoolDay: boolean;
  remainingInUnit: number;
  unitDays: number;
  items: Question[];
  fresh: number;
  review: number;
}

function pickActivity(unit: UnitDef, rng: Rng): ActivityDef {
  return rng.pick(unit.activities);
}

function reviewQuestion(unit: UnitDef, earlier: UnitDef[], shaky: string[], rng: Rng, locale: Locale): Question {
  if (shaky.length && rng.next() < 0.35) {
    const fact = rng.pick(shaky);
    const [a, b] = fact.split("×").map(Number);
    if (a != null && b != null && !Number.isNaN(a) && !Number.isNaN(b)) {
      const q = makeFluencyItem(rng, [a, b]);
      return withSource(q, "review");
    }
  }
  const pool = earlier.length ? earlier : [unit];
  const u = rng.pick(pool);
  const q = makeQuestion(pickActivity(u, rng), rng, locale);
  return withSource(q, "review");
}

export function sessionCounts(opts: { friday: boolean; weekend: boolean }): {
  fresh: number;
  review: number;
  fluency: number;
  fridayExtra: number;
} {
  if (opts.weekend) {
    return { fresh: 4, review: 4, fluency: 2, fridayExtra: 0 };
  }
  if (opts.friday) {
    return { fresh: 8, review: 4, fluency: 2, fridayExtra: 4 };
  }
  return { fresh: 8, review: 4, fluency: 2, fridayExtra: 0 };
}

export function walkSeed(opts: {
  learnerId: string;
  date: string;
  unitId: string;
  attempt: number;
  extra?: boolean;
}): string {
  return `walk:${opts.learnerId}:${opts.date}:${opts.unitId}:${opts.attempt}:${opts.extra ? "xtra" : "day"}`;
}

export function makeDailyWalk(opts: {
  date: string;
  classUnitId?: string;
  skipWeekend?: boolean;
  shaky?: Record<string, number>;
  learnerId?: string;
  attempt?: number;
  locale?: Locale | string;
}): DailyWalk {
  const locale = parseLocale(opts.locale);
  const skipWeekend = opts.skipWeekend !== false;
  const weekend = isWeekend(opts.date);
  const schoolDate = weekend && skipWeekend ? lastSchoolDayOnOrBefore(opts.date) ?? opts.date : opts.date;
  const unitId = suggestedUnitId(schoolDate, opts.classUnitId);
  const unit = unitById(unitId) ?? UNITS[0]!;
  const friday = isFriday(schoolDate) && isSchoolDay(schoolDate);
  const weekendPlay = weekend && skipWeekend;
  const seed = walkSeed({
    learnerId: opts.learnerId || "kid-1",
    date: opts.date,
    unitId: unit.id,
    attempt: opts.attempt ?? 1,
    extra: weekendPlay,
  });
  const rng = rngFromSeed(seed);
  const counts = sessionCounts({ friday, weekend: weekendPlay });
  if (!friday && !weekendPlay) {
    counts.fresh = 6 + rng.int(0, 4);
    counts.review = 3 + rng.int(0, 2);
  }

  const earlier = earlierUnits(unit.id);
  const shakyKeys = Object.entries(opts.shaky ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
  const factors = fluencyFactorsForUnit(unit.id);
  const items: Question[] = [];

  for (let i = 0; i < counts.fresh; i++) {
    items.push(withSource(makeQuestion(pickActivity(unit, rng), rng, locale), "fresh"));
  }
  for (let i = 0; i < counts.review; i++) {
    items.push(reviewQuestion(unit, earlier, shakyKeys, rng, locale));
  }
  for (let i = 0; i < counts.fluency; i++) {
    items.push(withSource(makeFluencyItem(rng, factors), "fluency"));
  }
  for (let i = 0; i < counts.fridayExtra; i++) {
    const src: ItemSource = "friday";
    if (rng.next() < 0.5) items.push(withSource(makeFluencyItem(rng, factors), src));
    else items.push(reviewQuestion(unit, earlier.length ? earlier : [unit], shakyKeys, rng, locale));
  }

  const shuffledTail = rng.shuffle(items.slice(counts.fresh));
  const ordered = [...items.slice(0, counts.fresh), ...shuffledTail];
  const fresh = ordered.filter((q) => q.source === "fresh").length;
  const review = ordered.filter((q) => q.source === "review").length;

  return {
    date: opts.date,
    schoolDate,
    schoolDay: schoolDayNumber(schoolDate),
    weekday: weekdayName(opts.date),
    unit,
    isFriday: friday,
    isWeekend: weekend,
    isSchoolDay: isSchoolDay(opts.date),
    remainingInUnit: remainingSchoolDaysInUnit(unit.id, schoolDate),
    unitDays: unitSpanDays(unit.id),
    items: ordered,
    fresh,
    review,
  };
}

const WEEKDAY_I18N: Record<Locale, Record<string, string>> = {
  en: {},
  es: { Sunday: "domingo", Monday: "lunes", Tuesday: "martes", Wednesday: "miércoles", Thursday: "jueves", Friday: "viernes", Saturday: "sábado" },
  "pt-BR": { Sunday: "domingo", Monday: "segunda", Tuesday: "terça", Wednesday: "quarta", Thursday: "quinta", Friday: "sexta", Saturday: "sábado" },
};

export function walkLabel(walk: DailyWalk, locale: Locale | string = "en"): string {
  const loc = parseLocale(locale);
  const ui = UI[loc];
  if (walk.isWeekend && !walk.isSchoolDay) {
    return `${ui.weekendExtra} · ${walk.unit.short}`;
  }
  const day = WEEKDAY_I18N[loc][walk.weekday] ?? walk.weekday;
  const tag = walk.isFriday ? ui.fridayCheck : ui.walkOf(day);
  return `${tag} · ${walk.unit.short}`;
}
