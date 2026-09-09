import { useRef } from "react";
import { CandyPath, type CandyPathHandle } from "@/components/candy-path";
import { AppHeader, AppScene, AppTabs, useUi } from "@/components/chrome";
import { todayIso } from "@/lib/calendar";
import { UNITS, suggestedUnitId, unitById } from "@/lib/curriculum";
import { navigate } from "@/lib/nav";
import { farthestClearedUnitNumber, lessonsHopFrom, lessonsHopTo, pathNowUnitId } from "@/lib/path";
import { useProgress } from "@/lib/progress";

export function LessonsPage() {
  useProgress((s) => `${s.classUnitId}:${s.pathHopperAt}:${s.pathNowSeen}:${Object.keys(s.sessions).length}:${Object.keys(s.activities).length}`);
  const st = useProgress.getState();
  const ui = useUi();
  const date = todayIso();
  const g3Class = UNITS.some((u) => u.id === st.classUnitId) ? st.classUnitId : undefined;
  const calendarId = suggestedUnitId(date, g3Class, 3);
  const pathSuggested = pathNowUnitId(calendarId, st.sessions, st.activities);
  const nowNumber = unitById(pathSuggested)?.number ?? 1;
  const cleared = farthestClearedUnitNumber(st.sessions, st.activities);
  const standFrom = lessonsHopFrom(st.pathHopperAt, nowNumber, cleared);
  const standTo = lessonsHopTo(st.pathHopperAt, nowNumber, st.pathNowSeen, cleared);
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
        <button type="button" className="candy-dock-start" onClick={() => pathRef.current?.playNow()}>
          {ui.start}
        </button>
      </div>
    </AppScene>
  );
}
