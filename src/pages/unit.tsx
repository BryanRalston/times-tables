import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { ART } from "@/lib/art";
import { remainingSchoolDaysInUnit, suggestedUnitId, unitById, unitSpanDays, unitWindowLabel } from "@/lib/curriculum";
import { todayIso } from "@/lib/calendar";
import { navigate } from "@/lib/nav";
import { isUnitOpen } from "@/lib/path";
import { sessionsForUnit, useProgress } from "@/lib/progress";

export function UnitPage({ unitId }: { unitId: string }) {
  const unit = unitById(unitId);
  const classUnitId = useProgress((s) => s.classUnitId);
  const activities = useProgress((s) => s.activities);
  const suggested = suggestedUnitId(todayIso(), classUnitId || undefined);
  const current = unitById(suggested);

  if (!unit) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate({ id: "home" })}>
          Path
        </Button>
      </div>
    );
  }

  const open = isUnitOpen(unit, suggested);
  const days = unitSpanDays(unit.id);
  const remain = remainingSchoolDaysInUnit(unit.id, todayIso());
  const walks = sessionsForUnit(unit.id);

  return (
    <div className="paper-grid mx-auto min-h-dvh max-w-lg px-4 py-6">
      <button type="button" className="mb-4 text-sm text-muted" onClick={() => navigate({ id: "home" })}>
        ← Path
      </button>
      <div className="flex items-start gap-3">
        <img src={open ? ART.nodeOpen : ART.nodeLocked} alt="" className="h-20 w-20 object-contain" />
        <div>
          <p className="text-xs font-medium text-muted">
            Unit {unit.number} · {unitWindowLabel(unit.id)}
          </p>
          <h1 className="font-display text-2xl">{unit.short}</h1>
          <p className="text-sm text-muted">{unit.title}</p>
        </div>
      </div>
      <p className="mt-3 text-sm">{unit.blurb}</p>
      <p className="mt-2 text-xs text-muted">
        {days} school days in this unit · {remain} left · {walks} walks done. Unlimited generated practice — it is not a 1–2 day finish.
      </p>
      <p className="mt-1 text-xs text-faint">{unit.sol.join(" · ")}</p>

      {!open ? (
        <div className="mt-6 flex items-center gap-3 rounded-[20px] border border-line bg-surface p-4">
          <Mascot pose="think" size="sm" />
          <p className="text-sm">
            Locked for now. Class is on {current?.short ?? "this year's map"}. Grown-ups can move the class.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <Button className="w-full" size="lg" onClick={() => navigate({ id: "play", kind: "daily" })}>
            Today's walk
          </Button>
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
                </span>
                <span className="text-star">{save?.stars ? "★".repeat(save.stars) : "·"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
