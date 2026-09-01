import { useMemo } from "react";
import { AppHeader, AppTabs } from "@/components/chrome";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { YearPath } from "@/components/year-path";
import { todayIso } from "@/lib/calendar";
import { remainingSchoolDaysInUnit, suggestedUnitId, unitById } from "@/lib/curriculum";
import { makeDailyWalk, walkLabel } from "@/lib/daily";
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
      }),
    [date, classUnitId, skipWeekend, shaky, learnerId, nextAttempt],
  );
  const done = Boolean(sessions[walk.date]?.completed);
  const remain = remainingSchoolDaysInUnit(suggested, walk.schoolDate);

  return (
    <div className="paper-grid mx-auto min-h-dvh max-w-xl px-4 pb-16 pt-4">
      <AppHeader />
      <AppTabs active="home" />

      {!seenWelcome ? (
        <section className="mb-5 rounded-[24px] border border-teal bg-teal-soft p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <Mascot pose="wave" size="md" className="h-24 w-24 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-teal">Start here</p>
              <h2 className="font-display text-xl leading-tight">What's hiding</h2>
              <p className="mt-1 text-sm text-muted">6 + n = 10 on a ten-frame. Then Home and every lesson.</p>
              <Button className="mt-3 w-full" size="lg" onClick={() => navigate({ id: "play", kind: "welcome" })}>
                Play leftover
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mb-6 rounded-[24px] border border-line bg-surface p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <Mascot pose={done ? "star" : "wave"} size="md" className="h-24 w-24 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-teal">{done ? "Walk done" : walkLabel(walk)}</p>
            <h2 className="font-display text-xl leading-tight">{unit?.short ?? "Today"}</h2>
            <p className="mt-1 text-sm text-muted">
              {walk.fresh} new · {walk.review} review · {remain} school days left in this unit
            </p>
            <Button className="mt-3 w-full" size="lg" onClick={() => navigate({ id: "play", kind: "daily" })}>
              {done ? "Walk again" : "Start today's walk"}
            </Button>
          </div>
        </div>
      </section>

      <p className="mb-3 text-center text-sm text-muted">
        The year map. <button type="button" className="font-medium text-teal" onClick={() => navigate({ id: "lessons" })}>Lessons</button> is the menu — pick any unit, any day.
      </p>
      <YearPath suggestedId={suggested} onOpen={(id) => navigate({ id: "unit", unitId: id })} />
      <p className="mt-6 text-center text-xs text-faint">Nothing leaves this device.</p>
    </div>
  );
}
