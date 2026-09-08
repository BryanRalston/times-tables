import { useMemo } from "react";
import { CandyPath } from "@/components/candy-path";
import { AppHeader, AppScene, AppTabs, ContinueStage, WalkMark, useUi } from "@/components/chrome";
import { todayIso } from "@/lib/calendar";
import { UNITS, suggestedUnitId, unitById } from "@/lib/curriculum";
import { makeDailyWalk } from "@/lib/daily";
import { parseLocale } from "@/lib/i18n";
import { unitText } from "@/lib/labels";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";

export function LessonsPage() {
  const classUnitId = useProgress((s) => s.classUnitId);
  const pathGrade = useProgress((s) => s.pathGrade) ?? 3;
  const skipWeekend = useProgress((s) => s.skipWeekend);
  const shaky = useProgress((s) => s.shaky);
  const facts = useProgress((s) => s.facts);
  const sessions = useProgress((s) => s.sessions);
  const learnerId = useProgress((s) => s.learnerId);
  const attempts = useProgress((s) => s.attempts);
  const locale = parseLocale(useProgress((s) => s.locale));
  const ui = useUi();
  const date = todayIso();
  const suggested = suggestedUnitId(date, classUnitId || undefined, pathGrade);
  const g3Class = UNITS.some((u) => u.id === classUnitId) ? classUnitId : undefined;
  const pathSuggested = suggestedUnitId(date, g3Class, 3);
  const unit = unitById(suggested);
  const nextAttempt = (attempts[`daily:${suggested}`] ?? 0) + 1;
  const walk = useMemo(
    () =>
      makeDailyWalk({
        date,
        classUnitId: classUnitId || undefined,
        skipWeekend,
        shaky,
        facts,
        learnerId,
        attempt: nextAttempt,
        locale,
        grade: pathGrade,
      }),
    [date, classUnitId, skipWeekend, shaky, facts, learnerId, nextAttempt, locale, pathGrade],
  );
  const done = Boolean(sessions[walk.date]?.completed);
  const unitShort = unit ? unitText(unit, locale).short : ui.todaysWalk;

  return (
    <AppScene scene="hills" tabs={<AppTabs active="lessons" />}>
      <AppHeader variant="shelf" title={ui.lessons} />
      <ContinueStage peek>
        <section className="continue-card" data-continue-card="1" data-lessons-continue="1">
          <WalkMark />
          <h2 className="font-display text-[1.65rem] font-semibold leading-tight text-ink">{ui.todaysWalk}</h2>
          <p className="mt-1 text-sm font-semibold text-muted">
            {unitShort} · {walk.fresh} {ui.fresh.toLowerCase()}
          </p>
          <button type="button" className="start-loud" onClick={() => navigate({ id: "play", kind: "daily" })}>
            {done ? ui.walkAgain : ui.start}
          </button>
        </section>
      </ContinueStage>

      <div className="candy-scroll">
        <CandyPath
          suggestedId={pathSuggested}
          onStart={() => navigate({ id: "play", kind: "daily" })}
          onOpenUnit={(id) => navigate({ id: "unit", unitId: id })}
        />
      </div>
      <p className="candy-caption">
        <span aria-hidden>★</span>
        {ui.grade3Path}
        <span aria-hidden>★</span>
      </p>
    </AppScene>
  );
}
