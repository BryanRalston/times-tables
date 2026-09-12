import { useRef } from "react";
import { CandyPath, type CandyPathHandle } from "@/components/candy-path";
import { AppHeader, AppScene, AppTabs, useUi } from "@/components/chrome";
import { todayIso } from "@/lib/calendar";
import { UNITS, suggestedUnitId, unitsFor } from "@/lib/curriculum";
import { navigate } from "@/lib/nav";
import { lessonsHopFrom, lessonsHopTo, pathNowUnitId } from "@/lib/path";
import { useProgress } from "@/lib/progress";
import { activePathStepsLeft, canStartDiceTurn, hopCreditsOf } from "@/lib/radial-web";
import { holdPathGrade, isTestMode, testFreeMove } from "@/lib/test-mode";

export function LessonsPage() {
  useProgress(
    (s) =>
      `${s.classUnitId}:${s.pathHopperAt}:${s.pathHopSpent}:${s.pathStepsLeft}:${s.pathGiftRolls}:${s.livePresentPads.join(",")}:${s.testMode}:${Object.keys(s.sessions).sort().join(",")}:${Object.keys(s.activities).sort().join(",")}`,
  );
  const st = useProgress.getState();
  const ui = useUi();
  const date = todayIso();
  const g3Class = UNITS.some((u) => u.id === st.classUnitId) ? st.classUnitId : undefined;
  const calendarId = suggestedUnitId(date, g3Class, 3);
  const pathSuggested = pathNowUnitId(calendarId, st.sessions, st.activities);
  const standFrom = lessonsHopFrom(st.pathHopperAt);
  const standTo = lessonsHopTo(st.pathHopperAt);
  const rolls = hopCreditsOf(st.activities, st.pathHopSpent, st.sessions, st.pathGiftRolls);
  const steps = activePathStepsLeft(st.pathHopSpent, st.pathStepsLeft);
  const freeMove = testFreeMove(st.testMode);
  const inviting = !freeMove && canStartDiceTurn(rolls, steps);
  const picking = freeMove || steps > 0;
  const pathRef = useRef<CandyPathHandle>(null);

  let caption = ui.grade3Path;
  if (freeMove) caption = ui.testModeFreeMove;
  else if (picking) caption = `${ui.hopPick} · ${ui.stepsLeftN(steps)}`;
  else if (inviting) caption = ui.rollInvite;

  return (
    <AppScene scene="hills" tabs={<AppTabs active="lessons" />}>
      <AppHeader variant="shelf" title={ui.lessons} />
      <div className="candy-scroll" data-lessons-path="1" data-lessons-fill="1">
        <CandyPath
          ref={pathRef}
          suggestedId={pathSuggested}
          standFrom={standFrom}
          standTo={standTo}
          hopCredits={rolls}
          stepsLeft={steps}
          freeMove={freeMove}
          railUnits={isTestMode(st.testMode) ? unitsFor(holdPathGrade(st.testMode, st.pathGrade)) : undefined}
          onStart={() => navigate({ id: "play", kind: "daily" })}
          onOpenUnit={(id) => navigate({ id: "unit", unitId: id })}
        />
      </div>
      <div className="candy-dock">
        <p
          className="candy-caption"
          data-hop-pick={picking ? "1" : "0"}
          data-dice-invite={inviting ? "1" : "0"}
          data-hop-credits-ui={String(rolls)}
          data-dice-steps-ui={String(steps)}
          data-test-free-move={freeMove ? "1" : "0"}
        >
          <span aria-hidden>★</span>
          {caption}
          <span aria-hidden>★</span>
        </p>
        {inviting ? (
          <button
            type="button"
            className="candy-dock-start"
            data-dock-roll="1"
            onClick={() => pathRef.current?.rollDie()}
          >
            {ui.rollDie}
          </button>
        ) : (
          <button type="button" className="candy-dock-start" data-dock-start="1" onClick={() => pathRef.current?.playNow()}>
            {ui.start}
          </button>
        )}
      </div>
    </AppScene>
  );
}
