import { useState } from "react";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { YEAR_LABEL } from "@/lib/calendar";
import { UNITS } from "@/lib/curriculum";
import { LOCALES, LOCALE_NATIVE, parseLocale, UI } from "@/lib/i18n";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";

export function GrownupPage() {
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
  const ui = UI[locale];
  const roster = Object.entries(learners).map(([id, k]) => ({
    id,
    name: k.name.trim() || (id === "kid-1" ? ui.kid1 : ui.play),
  }));
  const [armed, setArmed] = useState(false);

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
      <p className="mt-3 text-sm text-muted">{ui.grownupBlurb}</p>

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

      <label className="mt-4 block text-sm font-medium">
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
      <label className="mt-4 block text-sm font-medium">
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
      <p className="mt-2 text-xs text-muted">{ui.kidsBlurb}</p>

      <label className="mt-4 block text-sm font-medium">
        {ui.classIsOn}
        <select
          value={classUnitId}
          onChange={(e) => setClassUnit(e.target.value)}
          className="mt-1 h-12 w-full rounded-[14px] border border-line bg-surface px-3"
        >
          <option value="">{ui.followCalendar}</option>
          {UNITS.map((u) => (
            <option key={u.id} value={u.id}>
              {ui.unitN(u.number)}: {u.short}
            </option>
          ))}
        </select>
      </label>
      {classUnitId ? (
        <p className="mt-2 text-sm text-muted">
          {UNITS.find((u) => u.id === classUnitId)?.title}
          <span className="mt-1 block text-xs text-faint">{UNITS.find((u) => u.id === classUnitId)?.sol.join(" · ")}</span>
        </p>
      ) : null}

      <label className="mt-4 flex items-center gap-3 text-sm">
        <input type="checkbox" checked={skipWeekend} onChange={(e) => setSkipWeekend(e.target.checked)} />
        {ui.weekendExtraUses}
      </label>

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
