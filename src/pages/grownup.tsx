import { useState } from "react";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { YEAR_LABEL } from "@/lib/calendar";
import { UNITS } from "@/lib/curriculum";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";

export function GrownupPage() {
  const name = useProgress((s) => s.name);
  const learnerId = useProgress((s) => s.learnerId);
  const classUnitId = useProgress((s) => s.classUnitId);
  const skipWeekend = useProgress((s) => s.skipWeekend);
  const setName = useProgress((s) => s.setName);
  const setClassUnit = useProgress((s) => s.setClassUnit);
  const setSkipWeekend = useProgress((s) => s.setSkipWeekend);
  const switchLearner = useProgress((s) => s.switchLearner);
  const addLearner = useProgress((s) => s.addLearner);
  const resetAll = useProgress((s) => s.resetAll);
  const learners = useProgress((s) => s.learners);
  const roster = Object.entries(learners).map(([id, k]) => ({
    id,
    name: k.name.trim() || (id === "kid-1" ? "Kid 1" : "Kid"),
  }));
  const [armed, setArmed] = useState(false);

  return (
    <div className="paper-grid mx-auto min-h-dvh max-w-lg px-4 py-6">
      <button type="button" className="mb-4 text-sm text-muted" onClick={() => navigate({ id: "home" })}>
        ← Home
      </button>
      <div className="flex items-center gap-3">
        <Mascot pose="think" size="sm" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Grown-ups · {YEAR_LABEL}</p>
          <h1 className="font-display text-2xl">Class is on a unit</h1>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Class is on only changes the suggested daily walk. Every lesson stays playable — she can pick Q4 in August. Daily walks stay 8–12 new plus review; a unit cannot be finished in a weekend.
      </p>

      <label className="mt-6 block text-sm font-medium">
        Who is playing
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
        Name on the path
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-12 w-full rounded-[14px] border border-line bg-surface px-3"
          maxLength={24}
          placeholder="Optional"
        />
      </label>
      <Button
        variant="secondary"
        className="mt-3"
        onClick={() => addLearner(`Kid ${roster.length + 1}`)}
      >
        Another kid
      </Button>
      <p className="mt-2 text-xs text-muted">Each kid has their own stars, streak, and squishee shelf. Questions shuffle per kid.</p>

      <label className="mt-4 block text-sm font-medium">
        Class is on
        <select
          value={classUnitId}
          onChange={(e) => setClassUnit(e.target.value)}
          className="mt-1 h-12 w-full rounded-[14px] border border-line bg-surface px-3"
        >
          <option value="">Follow the school calendar</option>
          {UNITS.map((u) => (
            <option key={u.id} value={u.id}>
              Unit {u.number}: {u.short}
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
        Weekend extra uses Friday's unit
      </label>

      <div className="mt-8 rounded-[16px] border border-line bg-surface p-4">
        <p className="text-sm text-muted">Reset clears stars, streak, and the leftover visit. It does not leave the device either.</p>
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
          {armed ? "Tap again to reset" : "Reset this device"}
        </Button>
      </div>
    </div>
  );
}
