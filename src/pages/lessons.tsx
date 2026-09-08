import { CandyPath } from "@/components/candy-path";
import { AppHeader, AppScene, AppTabs, useUi } from "@/components/chrome";
import { todayIso } from "@/lib/calendar";
import { UNITS, suggestedUnitId } from "@/lib/curriculum";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";

export function LessonsPage() {
  const classUnitId = useProgress((s) => s.classUnitId);
  const ui = useUi();
  const date = todayIso();
  const g3Class = UNITS.some((u) => u.id === classUnitId) ? classUnitId : undefined;
  const pathSuggested = suggestedUnitId(date, g3Class, 3);

  return (
    <AppScene scene="hills" tabs={<AppTabs active="lessons" />}>
      <AppHeader variant="shelf" title={ui.lessons} />
      <div className="candy-scroll" data-lessons-path="1">
        <CandyPath
          suggestedId={pathSuggested}
          onStart={() => navigate({ id: "play", kind: "daily" })}
          onOpenUnit={(id) => navigate({ id: "unit", unitId: id })}
        />
      </div>
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
    </AppScene>
  );
}
