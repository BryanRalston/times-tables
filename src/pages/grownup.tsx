import { Delete } from "lucide-react";
import { useState } from "react";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { YEAR_LABEL } from "@/lib/calendar";
import { unitsFor } from "@/lib/curriculum";
import { LOCALES, LOCALE_NATIVE, parseLocale, UI } from "@/lib/i18n";
import { navigate } from "@/lib/nav";
import { exportSaveJson, importSaveJson, useProgress } from "@/lib/progress";

const GROWNUP_PIN = "2026";
const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0"] as const;

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
  const [unlocked, setUnlocked] = useState(false);
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
          {unitsFor(3).map((u) => (
            <option key={u.id} value={u.id}>
              {ui.unitN(u.number)}: {u.short}
            </option>
          ))}
        </select>
      </label>
      {classUnitId ? (
        <p className="mt-2 text-sm text-muted">
          {unitsFor(3).find((u) => u.id === classUnitId)?.title}
          <span className="mt-1 block text-xs text-faint">{unitsFor(3).find((u) => u.id === classUnitId)?.sol.join(" · ")}</span>
        </p>
      ) : null}

      <label className="frost mt-4 flex items-center gap-3 rounded-[16px] border border-line p-3 text-sm">
        <input type="checkbox" checked={skipWeekend} onChange={(e) => setSkipWeekend(e.target.checked)} />
        {ui.weekendExtraUses}
      </label>

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
