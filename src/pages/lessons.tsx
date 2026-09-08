import { useMemo } from "react";
import { AppHeader, AppScene, AppTabs, ContinueStage, WalkMark, useUi } from "@/components/chrome";
import { todayIso } from "@/lib/calendar";
import { suggestedUnitId, unitById, unitsFor } from "@/lib/curriculum";
import { makeDailyWalk } from "@/lib/daily";
import { parseLocale } from "@/lib/i18n";
import { activityText, unitText } from "@/lib/labels";
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
  const others = unitsFor(pathGrade).filter((u) => u.id !== suggested);

  return (
    <AppScene scene="hills" tabs={<AppTabs active="lessons" />}>
      <AppHeader variant="shelf" title={ui.lessons} />
      <ContinueStage>
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

      {unit ? (
        <div className="lesson-acts" data-lesson-acts="1">
          {unit.activities.map((a) => (
            <button
              key={a.id}
              type="button"
              className="lesson-act"
              onClick={() => navigate({ id: "play", kind: "activity", activityId: a.id })}
            >
              {activityText(a, locale).title}
            </button>
          ))}
        </div>
      ) : null}

      {others.length ? (
        <div className="lesson-more" data-lesson-more="1">
          {others.map((u) => (
            <button
              key={u.id}
              type="button"
              className="lesson-quiet-unit"
              onClick={() => navigate({ id: "unit", unitId: u.id })}
            >
              {unitText(u, locale).short}
            </button>
          ))}
        </div>
      ) : null}
    </AppScene>
  );
}
