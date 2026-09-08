import { AppHeader, AppScene, AppTabs, useUi } from "@/components/chrome";
import { CandyPath } from "@/components/candy-path";
import { todayIso } from "@/lib/calendar";
import { UNITS, suggestedUnitId } from "@/lib/curriculum";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";

export function HomePage() {
  const classUnitId = useProgress((s) => s.classUnitId);
  const activities = useProgress((s) => s.activities);
  const ui = useUi();
  const date = todayIso();
  const g3Class = UNITS.some((u) => u.id === classUnitId) ? classUnitId : undefined;
  const suggested = suggestedUnitId(date, g3Class, 3);
  const leftoverDone = Boolean(activities["u1-leftover"]?.plays);

  return (
    <AppScene scene="hills" tabs={<AppTabs active="home" />}>
      <AppHeader />
      <div className="candy-scroll">
        <CandyPath
          suggestedId={suggested}
          onStart={() => navigate({ id: "play", kind: "daily" })}
          onOpenUnit={(id) => navigate({ id: "unit", unitId: id })}
        />
      </div>

      {leftoverDone ? (
        <button
          type="button"
          className="ghost-replay"
          onClick={() => navigate({ id: "play", kind: "activity", activityId: "u1-leftover" })}
        >
          {ui.replay} · {ui.numberSense}
        </button>
      ) : null}

      <div className="candy-dock">
        <p className="candy-caption">
          <span aria-hidden>★</span>
          {ui.grade3Path}
          <span aria-hidden>★</span>
        </p>
        <button type="button" className="candy-dock-start" onClick={() => navigate({ id: "play", kind: "daily" })}>
          {ui.start}
        </button>
      </div>
      <p className="sr-only">{ui.nothingLeaves}</p>
    </AppScene>
  );
}
