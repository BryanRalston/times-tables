import { useRef } from "react";
import { CandyPath, type CandyPathHandle } from "@/components/candy-path";
import { AppHeader, AppScene, AppTabs, useUi } from "@/components/chrome";
import { todayIso } from "@/lib/calendar";
import { UNITS, suggestedUnitId } from "@/lib/curriculum";
import { navigate } from "@/lib/nav";
import { lessonsHopFrom, lessonsHopTo, pathNowUnitId } from "@/lib/path";
import { useProgress } from "@/lib/progress";
import { hopCreditsOf } from "@/lib/radial-web";

export function LessonsPage() {
  useProgress((s) => `${s.classUnitId}:${s.pathHopperAt}:${s.pathHopSpent}:${Object.keys(s.sessions).length}:${Object.keys(s.activities).length}`);
  const st = useProgress.getState();
  const ui = useUi();
  const date = todayIso();
  const g3Class = UNITS.some((u) => u.id === st.classUnitId) ? st.classUnitId : undefined;
  const calendarId = suggestedUnitId(date, g3Class, 3);
  const pathSuggested = pathNowUnitId(calendarId, st.sessions, st.activities);
  const standFrom = lessonsHopFrom(st.pathHopperAt);
  const standTo = lessonsHopTo(st.pathHopperAt);
  const credits = hopCreditsOf(st.activities, st.pathHopSpent);
  const pathRef = useRef<CandyPathHandle>(null);

  return (
    <AppScene scene="hills" tabs={<AppTabs active="lessons" />}>
      <AppHeader variant="shelf" title={ui.lessons} />
      <div className="candy-scroll" data-lessons-path="1">
        <CandyPath
          ref={pathRef}
          suggestedId={pathSuggested}
          standFrom={standFrom}
          standTo={standTo}
          hopCredits={credits}
          onStart={() => navigate({ id: "play", kind: "daily" })}
          onOpenUnit={(id) => navigate({ id: "unit", unitId: id })}
        />
      </div>
      <div className="candy-dock">
        <p className="candy-caption">
          <span aria-hidden>★</span>
          {credits > 0 ? ui.hopPick : ui.grade3Path}
          <span aria-hidden>★</span>
        </p>
        <button type="button" className="candy-dock-start" onClick={() => pathRef.current?.playNow()}>
          {ui.start}
        </button>
      </div>
    </AppScene>
  );
}
