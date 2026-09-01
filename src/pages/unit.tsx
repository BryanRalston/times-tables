import { HomeLink } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { ART } from "@/lib/art";
import { remainingSchoolDaysInUnit, suggestedUnitId, unitById, unitSpanDays, unitWindowLabel } from "@/lib/curriculum";
import { todayIso } from "@/lib/calendar";
import { navigate } from "@/lib/nav";
import { sessionsForUnit, useProgress } from "@/lib/progress";

export function UnitPage({ unitId }: { unitId: string }) {
  const unit = unitById(unitId);
  const classUnitId = useProgress((s) => s.classUnitId);
  const activities = useProgress((s) => s.activities);
  const suggested = suggestedUnitId(todayIso(), classUnitId || undefined);

  if (!unit) {
    return (
      <div className="p-6">
        <HomeLink />
      </div>
    );
  }

  const now = unit.id === suggested;
  const days = unitSpanDays(unit.id);
  const remain = remainingSchoolDaysInUnit(unit.id, todayIso());
  const walks = sessionsForUnit(unit.id);

  return (
    <div className="paper-grid mx-auto min-h-dvh max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <HomeLink />
        <button type="button" className="text-sm text-teal" onClick={() => navigate({ id: "lessons" })}>
          Lessons
        </button>
      </div>
      <div className="flex items-start gap-3">
        <img src={ART.nodeOpen} alt="" className="h-20 w-20 object-contain" />
        <div>
          <p className="text-xs font-medium text-muted">
            Unit {unit.number} · {unitWindowLabel(unit.id)}
            {now ? <span className="ml-2 text-teal">Now</span> : null}
          </p>
          <h1 className="font-display text-2xl">{unit.short}</h1>
          <p className="text-sm text-muted">{unit.title}</p>
        </div>
      </div>
      <p className="mt-3 text-sm">{unit.blurb}</p>
      <p className="mt-2 text-xs text-muted">
        {days} school days in this unit · {remain} left on the calendar · {walks} walks done. Practice anytime — it is not a 1–2 day finish.
      </p>
      <p className="mt-1 text-xs text-faint">{unit.sol.join(" · ")}</p>

      <div className="mt-6 space-y-3">
        {now ? (
          <Button className="w-full" size="lg" onClick={() => navigate({ id: "play", kind: "daily" })}>
            Today's walk
          </Button>
        ) : null}
        {unit.activities.map((a) => {
          const save = activities[a.id];
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate({ id: "play", kind: "activity", activityId: a.id })}
              className="flex w-full items-center gap-3 rounded-[18px] border border-line bg-surface p-3 text-left"
            >
              <img src={ART.nodeOpen} alt="" className="h-12 w-12 object-contain" />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg leading-tight">{a.title}</span>
                <span className="block text-xs text-muted">{a.blurb}</span>
                <span className="block text-[11px] text-faint">{a.sol.join(" · ")}</span>
              </span>
              <span className="text-star">{save?.stars ? "★".repeat(save.stars) : "Play"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
