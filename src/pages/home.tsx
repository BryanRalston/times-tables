import { Flame, Settings2, Star } from "lucide-react";
import { useMemo } from "react";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { YearPath } from "@/components/year-path";
import { todayIso, YEAR_LABEL } from "@/lib/calendar";
import { remainingSchoolDaysInUnit, suggestedUnitId, unitById } from "@/lib/curriculum";
import { makeDailyWalk, walkLabel } from "@/lib/daily";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { schoolStreak } from "@/lib/streak";

export function HomePage() {
  const name = useProgress((s) => s.name);
  const stars = useProgress((s) => s.stars);
  const classUnitId = useProgress((s) => s.classUnitId);
  const skipWeekend = useProgress((s) => s.skipWeekend);
  const shaky = useProgress((s) => s.shaky);
  const sessions = useProgress((s) => s.sessions);
  const date = todayIso();
  const suggested = suggestedUnitId(date, classUnitId || undefined);
  const unit = unitById(suggested);
  const walk = useMemo(
    () => makeDailyWalk({ date, classUnitId: classUnitId || undefined, skipWeekend, shaky }),
    [date, classUnitId, skipWeekend, shaky],
  );
  const done = Boolean(sessions[walk.date]?.completed);
  const streak = schoolStreak(sessions, date);
  const remain = remainingSchoolDaysInUnit(suggested, walk.schoolDate);

  return (
    <div className="paper-grid mx-auto min-h-dvh max-w-xl px-4 pb-16 pt-4">
      <header className="mb-4 flex items-center gap-3">
        <Mascot pose="wave" size="sm" className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Grade 3 · {YEAR_LABEL}</p>
          <h1 className="font-display text-2xl">{name ? `${name}'s path` : "Grade 3 Path"}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-star-soft px-2 py-1 text-star">
            <Star className="size-4 fill-current" />
            {stars}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-star-soft px-2 py-1 text-star">
            <Flame className="size-4" />
            {streak}
          </span>
          <button type="button" className="grid size-10 place-items-center rounded-[12px] text-muted" onClick={() => navigate({ id: "grownup" })} aria-label="Grown-ups">
            <Settings2 className="size-5" />
          </button>
        </div>
      </header>

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

      <p className="mb-2 text-center text-sm text-muted">A school-year map. Units last weeks. Facts walk with you all year.</p>
      <YearPath suggestedId={suggested} onOpen={(id) => navigate({ id: "unit", unitId: id })} />
      <p className="mt-6 text-center text-xs text-faint">Nothing leaves this device.</p>
    </div>
  );
}
