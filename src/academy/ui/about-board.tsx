import { useState } from "react";
import { show } from "../i18n";
import { MINUS } from "../games/types";
import { aboutMatch, aboutStart, type AboutTask } from "../games/about-data";
import { HandsShell } from "./hands-kit";

export function AboutRead({ n }: { n: number }) {
  return (
    <div className="ac-jump-read" dir="ltr">
      <b>{n}</b>
    </div>
  );
}

export function AboutHands({ task, onAnswer }: { task: AboutTask; onAnswer: (ok: boolean) => void }) {
  const [value, setValue] = useState(() => aboutStart(task.n, task.place, task.answer));
  const stepLabel = String(task.place);
  return (
    <HandsShell kind="about" fact={task.factKey} caption={task.speech.replace(/^।\s*/, "")} total={String(value)} onDone={() => onAnswer(aboutMatch(task, value))}>
      <div className="ac-jump-play">
        <AboutRead n={value} />
        <div className="ac-num-tiles" dir="ltr">
          <button type="button" className="ac-stone" onClick={() => setValue((n) => Math.min(1000, n + task.place))}>
            +{stepLabel}
          </button>
          <button type="button" className="ac-stone" onClick={() => setValue((n) => Math.max(0, n - task.place))}>
            {MINUS}
            {stepLabel}
          </button>
          <button type="button" className="ac-stone" onClick={() => setValue(aboutStart(task.n, task.place, task.answer))}>
            {show("Start over")}
          </button>
        </div>
      </div>
    </HandsShell>
  );
}
