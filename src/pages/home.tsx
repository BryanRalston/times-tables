import { useMemo } from "react";
import { AppHeader, AppTabs, useUi } from "@/components/chrome";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { YearPath } from "@/components/year-path";
import { todayIso } from "@/lib/calendar";
import { remainingSchoolDaysInUnit, suggestedUnitId, unitById } from "@/lib/curriculum";
import { makeDailyWalk, walkLabel } from "@/lib/daily";
import { parseLocale } from "@/lib/i18n";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";

export function HomePage() {
  const classUnitId = useProgress((s) => s.classUnitId);
  const skipWeekend = useProgress((s) => s.skipWeekend);
  const shaky = useProgress((s) => s.shaky);
  const sessions = useProgress((s) => s.sessions);
  const seenWelcome = useProgress((s) => s.seenWelcome);
  const learnerId = useProgress((s) => s.learnerId);
  const attempts = useProgress((s) => s.attempts);
  const locale = parseLocale(useProgress((s) => s.locale));
  const ui = useUi();
  const date = todayIso();
  const suggested = suggestedUnitId(date, classUnitId || undefined);
  const unit = unitById(suggested);
  const nextAttempt = (attempts[`daily:${suggested}`] ?? 0) + 1;
  const walk = useMemo(
    () =>
      makeDailyWalk({
        date,
        classUnitId: classUnitId || undefined,
        skipWeekend,
        shaky,
        learnerId,
        attempt: nextAttempt,
        locale,
      }),
    [date, classUnitId, skipWeekend, shaky, learnerId, nextAttempt, locale],
  );
  const done = Boolean(sessions[walk.date]?.completed);
  const remain = remainingSchoolDaysInUnit(suggested, walk.schoolDate);

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pb-16 pt-4">
      <AppHeader />
      <AppTabs active="home" />

      {!seenWelcome ? (
        <section className="frost mb-5 rounded-[24px] border border-teal p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <Mascot pose="wave" size="md" className="h-24 w-24 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-teal">{ui.startHere}</p>
              <h2 className="font-display text-xl leading-tight">{ui.whatsHiding}</h2>
              <p className="mt-1 text-sm text-muted">{ui.leftoverBlurb}</p>
              <Button className="mt-3 w-full" size="lg" onClick={() => navigate({ id: "play", kind: "welcome" })}>
                {ui.playLeftover}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="frost mb-6 rounded-[24px] border border-line p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <Mascot pose={done ? "star" : "wave"} size="md" className="h-24 w-24 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-teal">{done ? ui.walkDone : walkLabel(walk, locale)}</p>
            <h2 className="font-display text-xl leading-tight">{unit?.short ?? ui.todaysWalk}</h2>
            <p className="mt-1 text-sm text-muted">{ui.newReview(walk.fresh, walk.review, remain)}</p>
            <Button className="mt-3 w-full" size="lg" onClick={() => navigate({ id: "play", kind: "daily" })}>
              {done ? ui.walkAgain : ui.startWalk}
            </Button>
          </div>
        </div>
      </section>

      <p className="frost mb-3 rounded-[16px] border border-line p-3 text-center text-sm text-muted">
        {ui.yearMap}{" "}
        <button type="button" className="font-medium text-teal" onClick={() => navigate({ id: "lessons" })}>
          {ui.lessons}
        </button>{" "}
        {ui.lessonsMenu}
      </p>
      <YearPath suggestedId={suggested} onOpen={(id) => navigate({ id: "unit", unitId: id })} />
      <p className="mt-6 text-center text-xs text-faint">{ui.nothingLeaves}</p>
    </div>
  );
}
