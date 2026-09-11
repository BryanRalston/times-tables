import { Delete } from "lucide-react";
import { useState } from "react";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { todayIso, YEAR_LABEL } from "@/lib/calendar";
import { unitsFor } from "@/lib/curriculum";
import { LOCALES, LOCALE_NATIVE, parseLocale, UI, type Ui } from "@/lib/i18n";
import { navigate } from "@/lib/nav";
import { formatAvgSeconds, needsPracticeList, todayView } from "@/lib/practice";
import { exportSaveJson, importSaveJson, useProgress } from "@/lib/progress";
import { isTestMode } from "@/lib/test-mode";
import { parsePathGrade, type FactStat, type PersonalBests, type TodayPractice } from "@/lib/types";

const GROWNUP_PIN = "2026";
const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0"] as const;

export function GrownupPage({ unlocked: startUnlocked = false }: { unlocked?: boolean } = {}) {
  const name = useProgress((s) => s.name);
  const learnerId = useProgress((s) => s.learnerId);
  const classUnitId = useProgress((s) => s.classUnitId);
  const skipWeekend = useProgress((s) => s.skipWeekend);
  const locale = parseLocale(useProgress((s) => s.locale));
  const setName = useProgress((s) => s.setName);
  const setClassUnit = useProgress((s) => s.setClassUnit);
  const setSkipWeekend = useProgress((s) => s.setSkipWeekend);
  const setLocale = useProgress((s) => s.setLocale);
  const switchLearner = useProgress((s) => s.switchLearner);
  const addLearner = useProgress((s) => s.addLearner);
  const resetAll = useProgress((s) => s.resetAll);
  const learners = useProgress((s) => s.learners);
  const soundOn = useProgress((s) => s.soundOn !== false);
  const setSoundOn = useProgress((s) => s.setSoundOn);
  useProgress((s) => `${s.testMode}:${s.pathGrade}`);
  const testMode = isTestMode(useProgress.getState().testMode);
  const pathGrade = useProgress.getState().pathGrade ?? 3;
  const setTestMode = useProgress((s) => s.setTestMode);
  const setPathGrade = useProgress((s) => s.setPathGrade);
  const grantTestRoll = useProgress((s) => s.grantTestRoll);
  const awardCoins = useProgress((s) => s.awardCoins);
  const clearPathSteps = useProgress((s) => s.clearPathSteps);
  const facts = useProgress((s) => s.facts);
  const shaky = useProgress((s) => s.shaky);
  const today = useProgress((s) => s.today);
  const bests = useProgress((s) => s.bests);
  const ui = UI[locale];
  const classUnits = unitsFor(testMode && pathGrade === 4 ? 4 : 3);
  const roster = Object.entries(learners).map(([id, k]) => ({
    id,
    name: k.name.trim() || (id === "kid-1" ? ui.kid1 : ui.play),
  }));
  const [armed, setArmed] = useState(false);
  const [unlocked, setUnlocked] = useState(startUnlocked);
  const [pin, setPin] = useState("");
  const [pinShake, setPinShake] = useState(0);
  const [importNote, setImportNote] = useState("");

  function pressPin(k: (typeof PIN_KEYS)[number]) {
    if (k === "back") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = (pin + k).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      if (next === GROWNUP_PIN) setUnlocked(true);
      else {
        setPinShake((n) => n + 1);
        setPin("");
      }
    }
  }

  if (!unlocked) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-sm place-items-center px-4 py-8" data-grownup-lock="1">
        <div className="w-full text-center">
          <button type="button" className="mb-6 text-sm text-muted" onClick={() => navigate({ id: "home" })}>
            ← {ui.home}
          </button>
          <Mascot pose="think" size="md" className="mx-auto" />
          <h1 className="mt-3 font-display text-2xl">{ui.grownups}</h1>
          <p className="mt-2 text-sm text-muted">{ui.askGrownup}</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">{ui.enterPin}</p>
          <p
            key={pinShake}
            className={`mt-2 font-display text-4xl tabular-nums tracking-[0.4em] ${pinShake ? "shake" : ""}`}
            aria-label={ui.enterPin}
          >
            {pin.length ? "•".repeat(pin.length) : "····"}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {PIN_KEYS.map((k) => (
              <Button
                key={k}
                variant="secondary"
                size="key"
                aria-label={k === "back" ? "Backspace" : k}
                onClick={() => pressPin(k)}
              >
                {k === "back" ? <Delete className="size-5" /> : k}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-6">
      <button type="button" className="mb-4 text-sm text-muted" onClick={() => navigate({ id: "home" })}>
        ← {ui.home}
      </button>
      <div className="flex items-center gap-3">
        <Mascot pose="think" size="sm" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {ui.grownups} · {YEAR_LABEL}
          </p>
          <h1 className="font-display text-2xl">{ui.classIsOn}</h1>
        </div>
      </div>
      <div className="frost mt-3 rounded-[16px] border border-line p-3 text-sm text-muted">
        <p>{ui.grownupBlurb}</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {ui.grownupPoints.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <label className="frost mt-6 block rounded-[16px] border border-line p-3 text-sm font-medium">
        {ui.language}
        <select
          value={locale}
          onChange={(e) => setLocale(parseLocale(e.target.value))}
          className="mt-1 h-12 w-full rounded-[14px] border border-line bg-surface px-3"
        >
          {LOCALES.map((id) => (
            <option key={id} value={id}>
              {LOCALE_NATIVE[id]}
            </option>
          ))}
        </select>
      </label>

      <label className="frost mt-4 block rounded-[16px] border border-line p-3 text-sm font-medium">
        {ui.whoPlaying}
        <select
          value={learnerId}
          onChange={(e) => switchLearner(e.target.value)}
          className="mt-1 h-12 w-full rounded-[14px] border border-line bg-surface px-3"
        >
          {roster.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
      </label>
      <label className="frost mt-4 block rounded-[16px] border border-line p-3 text-sm font-medium">
        {ui.nameOnPath}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-12 w-full rounded-[14px] border border-line bg-surface px-3"
          maxLength={24}
          placeholder={ui.optional}
        />
      </label>
      <Button variant="secondary" className="mt-3" onClick={() => addLearner(`${ui.kid1} ${roster.length + 1}`)}>
        {ui.anotherKid}
      </Button>
      <p className="frost mt-2 rounded-[16px] border border-line p-3 text-xs text-muted">{ui.kidsBlurb}</p>

      <label className="frost mt-4 block rounded-[16px] border border-line p-3 text-sm font-medium">
        {ui.classIsOn}
        <select
          value={classUnitId}
          onChange={(e) => setClassUnit(e.target.value)}
          className="mt-1 h-12 w-full rounded-[14px] border border-line bg-surface px-3"
        >
          <option value="">{ui.followCalendar}</option>
          {classUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {ui.unitN(u.number)}: {u.short}
            </option>
          ))}
        </select>
      </label>
      {classUnitId ? (
        <p className="mt-2 text-sm text-muted">
          {classUnits.find((u) => u.id === classUnitId)?.title}
          <span className="mt-1 block text-xs text-faint">{classUnits.find((u) => u.id === classUnitId)?.sol.join(" · ")}</span>
        </p>
      ) : null}

      <label className="frost mt-4 flex items-center gap-3 rounded-[16px] border border-line p-3 text-sm">
        <input type="checkbox" checked={skipWeekend} onChange={(e) => setSkipWeekend(e.target.checked)} />
        {ui.weekendExtraUses}
      </label>

      <label className="frost mt-4 flex items-center gap-3 rounded-[16px] border border-line p-3 text-sm">
        <input
          type="checkbox"
          checked={soundOn}
          onChange={(e) => setSoundOn(e.target.checked)}
          data-sound-toggle="1"
        />
        {ui.sounds}
      </label>

      {/* remove before publish */}
      <div className="frost mt-4 rounded-[16px] border border-line p-3" data-test-mode-panel="1">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            data-test-mode-toggle="1"
          />
          {ui.testMode}
        </label>
        <p className="mt-2 text-xs text-muted">{ui.testModeBlurb}</p>
        {testMode ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" data-test-add-roll="1" onClick={() => grantTestRoll()}>
              {ui.testAddRoll}
            </Button>
            <Button variant="secondary" data-test-add-coins="1" onClick={() => awardCoins(10)}>
              {ui.testAddCoins}
            </Button>
            <Button variant="secondary" data-test-clear-steps="1" onClick={() => clearPathSteps()}>
              {ui.testClearSteps}
            </Button>
          </div>
        ) : null}
        {testMode ? (
          <label className="mt-3 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={pathGrade === 4}
              onChange={(e) => setPathGrade(parsePathGrade(e.target.checked ? 4 : 3))}
              data-test-grade4="1"
            />
            {ui.pathGrade4}
          </label>
        ) : null}
      </div>

      <PracticeSummary
        ui={ui}
        facts={facts}
        shaky={shaky}
        today={today}
        bests={bests}
      />

      <div className="frost mt-8 rounded-[16px] border border-line p-4">
        <p className="text-sm text-muted">{ui.nothingLeaves}</p>
        <Button
          variant="secondary"
          className="mt-3"
          data-export-save="1"
          onClick={() => {
            const blob = new Blob([exportSaveJson()], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "grade-3-path.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          {ui.exportSave}
        </Button>
        <label className="mt-3 block text-sm font-medium">
          {ui.importSave}
          <input
            type="file"
            accept="application/json,.json"
            data-import-save="1"
            className="mt-1 block w-full text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (typeof window !== "undefined" && !window.confirm(ui.importConfirm)) return;
              void file.text().then((text) => {
                setImportNote(importSaveJson(text) ? ui.saved : ui.tryAgain);
              });
            }}
          />
        </label>
        {importNote ? <p className="mt-2 text-sm text-muted">{importNote}</p> : null}
      </div>

      <div className="frost mt-8 rounded-[16px] border border-line p-4">
        <p className="text-sm text-muted">{ui.resetBlurb}</p>
        <Button
          variant={armed ? "primary" : "secondary"}
          className="mt-3"
          onClick={() => {
            if (!armed) {
              setArmed(true);
              return;
            }
            resetAll();
            navigate({ id: "home" }, { replace: true });
          }}
        >
          {armed ? ui.tapAgainReset : ui.resetDevice}
        </Button>
      </div>
    </div>
  );
}

function PracticeSummary({
  ui,
  facts,
  shaky,
  today,
  bests,
}: {
  ui: Ui;
  facts: Record<string, FactStat>;
  shaky: Record<string, number>;
  today: TodayPractice;
  bests: PersonalBests;
}) {
  const view = todayView(today ?? { date: "", questions: 0, correct: 0, ms: 0, honestN: 0 }, todayIso());
  const needs = needsPracticeList(facts ?? {}, shaky ?? {});
  const pct = view.pct == null ? null : Math.round(view.pct * 100);
  const avg = view.avgMs == null ? null : formatAvgSeconds(view.avgMs);
  const bestPct = bests?.accuracy ? Math.round(bests.accuracy * 100) : 0;
  const bestAvg = bests?.avgMs ? formatAvgSeconds(bests.avgMs) : null;

  return (
    <div className="frost mt-8 rounded-[16px] border border-line p-4" data-practice-summary="1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{ui.practiceToday}</p>
      <p className="mt-2 text-sm">{ui.questionsN(view.questions)}</p>
      {pct != null ? <p className="text-sm">{ui.correctPct(pct)}</p> : null}
      {avg ? <p className="text-sm text-muted">{ui.avgSeconds(avg)}</p> : null}

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">{ui.needsPractice}</p>
      {needs.length ? (
        <ul className="mt-2 flex flex-wrap gap-2" data-needs-practice="1">
          {needs.map((label) => (
            <li key={label} className="rounded-full bg-star-soft px-2.5 py-1 text-sm text-star">
              {label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">{ui.needsNone}</p>
      )}

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">{ui.personalBests}</p>
      <p className="mt-2 text-sm text-muted">{ui.bestStreak(bests?.streak ?? 0)}</p>
      {bestPct ? <p className="text-sm text-muted">{ui.bestAccuracy(bestPct)}</p> : null}
      {bestAvg ? <p className="text-sm text-muted">{ui.fastestAvg(bestAvg)}</p> : null}
    </div>
  );
}
