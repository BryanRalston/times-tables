import { HomeLink, useUi } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { ART } from "@/lib/art";
import { remainingSchoolDaysInUnit, suggestedUnitId, unitById, unitSpanDays, unitWindowLabel } from "@/lib/curriculum";
import { parseLocale } from "@/lib/i18n";
import { activityText, unitText } from "@/lib/labels";
import { todayIso } from "@/lib/calendar";
import { navigate } from "@/lib/nav";
import { sessionsForUnit, useProgress } from "@/lib/progress";

export function UnitPage({ unitId }: { unitId: string }) {
  const unit = unitById(unitId);
  const classUnitId = useProgress((s) => s.classUnitId);
  const pathGrade = useProgress((s) => s.pathGrade) ?? 3;
  const activities = useProgress((s) => s.activities);
  const suggested = suggestedUnitId(todayIso(), classUnitId || undefined, pathGrade);

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
  const locale = parseLocale(useProgress((s) => s.locale));
  const ui = useUi();
  const copy = unitText(unit, locale);

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <HomeLink />
        <button type="button" className="text-sm text-teal" onClick={() => navigate({ id: "lessons" })}>
          {ui.lessons}
        </button>
      </div>
      <div className="flex items-start gap-3">
        <img src={ART.nodeOpen} alt="" className="h-20 w-20 object-contain" />
        <div>
          <p className="text-xs font-medium text-muted">
            Unit {unit.number} · {unitWindowLabel(unit.id)}
            {now ? <span className="ml-2 text-teal">{ui.now}</span> : null}
          </p>
          <h1 className="font-display text-2xl">{copy.short}</h1>
          <p className="text-sm text-muted">{copy.title}</p>
        </div>
      </div>
      <p className="mt-3 text-sm">{copy.blurb}</p>
      <p className="mt-2 text-xs text-muted">
        {ui.unitDays(days, remain, walks)}
      </p>
      <p className="mt-1 text-xs text-faint">{unit.sol.join(" · ")}</p>

      <div className="mt-6 space-y-3">
        {now ? (
          <Button className="w-full" size="lg" onClick={() => navigate({ id: "play", kind: "daily" })}>
            {ui.todaysWalk}
          </Button>
        ) : null}
        {unit.activities.map((a) => {
          const save = activities[a.id];
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate({ id: "play", kind: "activity", activityId: a.id })}
              className="frost flex w-full items-center gap-3 rounded-[18px] border border-line p-3 text-left"
            >
              <img src={ART.nodeOpen} alt="" className="h-12 w-12 object-contain" />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg leading-tight">{activityText(a, locale).title}</span>
                <span className="block text-xs text-muted">{activityText(a, locale).blurb}</span>
                <span className="block text-[11px] text-faint">{a.sol.join(" · ")}</span>
              </span>
              <span className="text-star">{save?.stars ? "★".repeat(save.stars) : ui.play}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
