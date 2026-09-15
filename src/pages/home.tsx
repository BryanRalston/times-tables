import { useMemo, useState } from "react";
import { AppHeader, AppScene, AppTabs, useUi } from "@/components/chrome";
import { PokeToy } from "@/components/poke-toy";
import { todayIso } from "@/lib/calendar";
import { remainingSchoolDaysInUnit, suggestedUnitId, unitById } from "@/lib/curriculum";
import { makeDailyWalk } from "@/lib/daily";
import { parseLocale } from "@/lib/i18n";
import { unitText } from "@/lib/labels";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { STARTER_SQUISHEE_IDS, isStarterSquishee, pathHopperId, squisheeById } from "@/lib/squishees";
import { holdPathGrade } from "@/lib/test-mode";
import { dailyWalkActivityId } from "@/lib/radial-web";
import { cn } from "@/lib/utils";

export function HomePage() {
  useProgress(
    (s) =>
      `${s.setupDone}:${s.name}:${s.hopperId}:${s.squishees.join(",")}:${s.classUnitId}:${s.pathGrade}:${Object.keys(s.sessions).sort().join(",")}:${Object.keys(s.attempts).sort().join(",")}`,
  );
  const st = useProgress.getState();
  const setupDone = st.setupDone;
  const name = st.name;
  const hopperId = pathHopperId(st.squishees, st.hopperId);
  const classUnitId = st.classUnitId;
  const pathGrade = holdPathGrade(st.testMode, st.pathGrade);
  const skipWeekend = st.skipWeekend;
  const shaky = st.shaky;
  const facts = st.facts;
  const sessions = st.sessions;
  const learnerId = st.learnerId;
  const attempts = st.attempts;
  const activities = st.activities;
  const locale = parseLocale(st.locale);
  const ui = useUi();
  const date = todayIso();
  const suggested = suggestedUnitId(date, classUnitId || undefined, pathGrade);
  const unit = unitById(suggested);
  const attempt = Math.max(1, attempts[dailyWalkActivityId(date)] ?? 0);
  const walk = useMemo(
    () =>
      makeDailyWalk({
        date,
        classUnitId: classUnitId || undefined,
        skipWeekend,
        shaky,
        facts,
        learnerId,
        attempt,
        locale,
        grade: pathGrade,
      }),
    [date, classUnitId, skipWeekend, shaky, facts, learnerId, attempt, locale, pathGrade],
  );
  const done = Boolean(sessions[walk.date]?.completed);
  const remain = remainingSchoolDaysInUnit(suggested, walk.schoolDate);
  const unitShort = unit ? unitText(unit, locale).short : ui.todaysWalk;
  const leftoverDone = Boolean(activities["u1-leftover"]?.plays);

  return (
    <AppScene scene="hills" tabs={<AppTabs active="home" />}>
      <AppHeader />
      {setupDone ? (
        <section className="continue-card" data-continue-card="1" data-home-ready="1">
          <PokeToy id={hopperId} size="md" className="home-buddy" />
          <h2 className="font-display text-[1.65rem] font-semibold leading-tight text-ink">
            {name ? ui.hiName(name) : ui.todaysWalk}
          </h2>
          <p className="mt-1 text-sm font-semibold text-muted">{ui.homeLoop}</p>
          <p className="mt-1 text-sm font-semibold text-muted" data-walk-cards={String(walk.items.length)}>
            {ui.todaysWalk} · {unitShort} · {ui.walkCardsShort(walk.items.length)}
          </p>
          <p className="sr-only">{ui.schoolDaysLeft(remain)}</p>
          <button
            type="button"
            className="start-loud"
            onClick={() => navigate({ id: "play", kind: "daily" })}
          >
            {done ? ui.walkAgain : ui.start}
          </button>
        </section>
      ) : (
        <SetupCard />
      )}

      {setupDone && leftoverDone ? (
        <button
          type="button"
          className="ghost-replay"
          onClick={() => navigate({ id: "play", kind: "activity", activityId: "u1-leftover" })}
        >
          {ui.replay} · {ui.numberSense}
        </button>
      ) : null}

      <p className="mt-auto pb-2 text-center text-[11px] text-faint">{ui.nothingLeaves}</p>
    </AppScene>
  );
}

function SetupCard() {
  const savedName = useProgress((s) => s.name);
  const completeSetup = useProgress((s) => s.completeSetup);
  const ui = useUi();
  const [step, setStep] = useState<"name" | "pick">(savedName.trim() ? "pick" : "name");
  const [draft, setDraft] = useState(savedName);
  const [pick, setPick] = useState<string>("");
  const ready = draft.trim().length > 0;
  const host = isStarterSquishee(pick) ? pick : "peach";

  return (
    <section className="continue-card" data-continue-card="1" data-setup={step}>
      {step === "name" ? (
        <>
          <PokeToy id="peach" size="md" className="home-buddy" />
          <h2 className="font-display text-[1.65rem] font-semibold leading-tight text-ink">{ui.setupHi}</h2>
          <p className="mt-1 text-sm font-semibold text-muted">{ui.setupBlurb}</p>
          <label className="mt-4 block text-sm font-bold text-ink" htmlFor="setup-name">
            {ui.setupNameAsk}
          </label>
          <input
            id="setup-name"
            className="setup-name"
            data-setup-name="1"
            maxLength={24}
            autoComplete="nickname"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            className="start-loud"
            disabled={!ready}
            onClick={() => ready && setStep("pick")}
          >
            {ui.setupNameNext}
          </button>
        </>
      ) : (
        <>
          <h2 className="font-display text-[1.65rem] font-semibold leading-tight text-ink">{ui.hiName(draft.trim())}</h2>
          <p className="mt-1 text-sm font-semibold text-muted">{ui.setupPick}</p>
          <div className="setup-pick" data-setup-pick="1">
            {STARTER_SQUISHEE_IDS.map((id) => {
              const toy = squisheeById(id)!;
              const on = pick === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={cn("setup-face", on && "setup-face-on")}
                  data-starter={id}
                  aria-pressed={on}
                  onClick={() => setPick(id)}
                >
                  <PokeToy id={id} size="sm" className="h-20 w-20" />
                  <span>{toy.name}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="start-loud"
            disabled={!isStarterSquishee(pick)}
            onClick={() => isStarterSquishee(pick) && completeSetup(draft, pick)}
          >
            {ui.setupLetsGo}
          </button>
          <button type="button" className="setup-back" onClick={() => setStep("name")}>
            {ui.setupBack}
          </button>
        </>
      )}
      <span className="sr-only">{host}</span>
    </section>
  );
}
