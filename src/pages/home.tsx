import { useMemo } from "react";
import { AppHeader, AppScene, AppTabs, ContinueStage, WalkMark, useUi } from "@/components/chrome";
import { todayIso } from "@/lib/calendar";
import { remainingSchoolDaysInUnit, suggestedUnitId, unitById } from "@/lib/curriculum";
import { makeDailyWalk } from "@/lib/daily";
import { parseLocale } from "@/lib/i18n";
import { unitText } from "@/lib/labels";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";

const FAMILIES = [
  { id: "u1-leftover", label: "numberSense" as const },
  { id: "u1-friends", label: "missingAddend" as const },
  { id: "u7-take", label: "missingSubtrahend" as const },
  { id: "u6-facts", label: "timesFacts" as const },
];

export function HomePage() {
  const classUnitId = useProgress((s) => s.classUnitId);
  const pathGrade = useProgress((s) => s.pathGrade) ?? 3;
  const skipWeekend = useProgress((s) => s.skipWeekend);
  const shaky = useProgress((s) => s.shaky);
  const facts = useProgress((s) => s.facts);
  const sessions = useProgress((s) => s.sessions);
  const learnerId = useProgress((s) => s.learnerId);
  const attempts = useProgress((s) => s.attempts);
  const activities = useProgress((s) => s.activities);
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
  const remain = remainingSchoolDaysInUnit(suggested, walk.schoolDate);
  const unitShort = unit ? unitText(unit, locale).short : ui.todaysWalk;
  const leftoverDone = Boolean(activities["u1-leftover"]?.plays);

  return (
    <AppScene scene="hills" tabs={<AppTabs active="home" />}>
      <AppHeader />
      <ContinueStage peek>
        <section className="continue-card" data-continue-card="1">
          <WalkMark />
          <h2 className="font-display text-[1.65rem] font-semibold leading-tight text-ink">{ui.todaysWalk}</h2>
          <p className="mt-1 text-sm font-semibold text-muted">
            {unitShort} · {walk.fresh} {ui.fresh.toLowerCase()}
          </p>
          <p className="sr-only">{ui.newReview(walk.fresh, walk.review, remain)}</p>
          <button
            type="button"
            className="start-loud"
            onClick={() => navigate({ id: "play", kind: "daily" })}
          >
            {done ? ui.walkAgain : ui.start}
          </button>
        </section>
      </ContinueStage>

      {leftoverDone ? (
        <button
          type="button"
          className="ghost-replay"
          onClick={() => navigate({ id: "play", kind: "activity", activityId: "u1-leftover" })}
        >
          {ui.replay} · {ui.numberSense}
        </button>
      ) : null}

      <button type="button" className="all-units" onClick={() => navigate({ id: "lessons" })}>
        {ui.allUnits}
      </button>

      <div className="year-beads" data-year-beads="1">
        {FAMILIES.map((f, i) => {
          const played = Boolean(activities[f.id]?.plays);
          const now = !played && (i === 0 || Boolean(activities[FAMILIES[i - 1].id]?.plays));
          return (
            <button
              key={f.id}
              type="button"
              className="year-bead"
              data-now={now ? "1" : "0"}
              data-done={played ? "1" : "0"}
              onClick={() => navigate({ id: "play", kind: "activity", activityId: f.id })}
            >
              <i />
              {ui[f.label]}
            </button>
          );
        })}
      </div>
      <p className="mt-auto pb-2 text-center text-[11px] text-faint">{ui.nothingLeaves}</p>
    </AppScene>
  );
}
