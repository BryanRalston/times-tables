import { useState } from "react";
import { show } from "../i18n";
import { MINUS } from "../games/types";
import { jumpsMatch, type JumpTask } from "../games/jumps-data";
import { BlockPile, HandsShell } from "./hands-kit";

function JumpBlocks({ n }: { n: number }) {
  if (n > 999) return null;
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  return <BlockPile hundreds={hundreds} tens={tens} ones={ones} />;
}

export function JumpRead({ n }: { n: number }) {
  return (
    <div className="ac-jump-read" dir="ltr">
      <b>{n}</b>
      <JumpBlocks n={n} />
    </div>
  );
}

export function JumpHands({ task, onAnswer }: { task: JumpTask; onAnswer: (ok: boolean) => void }) {
  const [value, setValue] = useState(task.start);
  const max = task.mode === "thousand" ? 9999 : task.mode === "hundred" ? 1000 : 100;
  const stepLabel = String(task.step);
  return (
    <HandsShell
      kind="jumps"
      fact={task.factKey}
      caption={task.speech}
      total={String(value)}
      onDone={() => onAnswer(jumpsMatch(task, value))}
    >
      <div className="ac-jump-play">
        <JumpRead n={value} />
        <div className="ac-num-tiles" dir="ltr">
          <button type="button" className="ac-stone" onClick={() => setValue((n) => Math.min(max, n + task.step))}>
            +{stepLabel}
          </button>
          <button type="button" className="ac-stone" onClick={() => setValue((n) => Math.max(0, n - task.step))}>
            {MINUS}
            {stepLabel}
          </button>
          <button type="button" className="ac-stone" onClick={() => setValue(task.start)}>
            {show("Start over")}
          </button>
        </div>
      </div>
    </HandsShell>
  );
}
