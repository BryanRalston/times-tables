import { useState } from "react";
import { show } from "../i18n";
import type { PatternTask } from "../games/patterns-data";
import { patternMatches, ruleLabel } from "../games/patterns-data";
import { HandsShell } from "./hands-kit";

function optionsFor(task: PatternTask): number[] {
  if (task.mode === "grow") return [2, 3, 4, 5, 10];
  const pool = [task.answer, task.answer + task.step, task.answer - task.step, task.answer + 1].filter((n) => n >= 0);
  const unique = pool.filter((n, index) => pool.indexOf(n) === index);
  while (unique.length < 4) unique.push((unique[unique.length - 1] ?? task.answer) + task.step + unique.length);
  return unique.slice(0, 4);
}

export function PatternBench({
  task,
  locked,
  picked,
  onPick,
  tiles = true,
}: {
  task: PatternTask;
  locked: boolean;
  picked: number | null;
  onPick: (n: number | null) => void;
  /** Choice cards answer with the buttons under the row. Hands cards keep the tiles. */
  tiles?: boolean;
}) {
  const shown = task.terms;
  return (
    <div className="ac-pattern-play">
      <div className="ac-pattern-row">
        {shown.map((n, index) => (
          <span key={`${n}-${index}`} className="ac-stone">
            {n}
          </span>
        ))}
        {task.mode === "grow" ? null : (
          <button type="button" className="ac-stone is-blank" disabled={locked || picked == null} onClick={() => onPick(null)}>
            {picked ?? ""}
          </button>
        )}
      </div>
      {tiles ? (
        <div className="ac-num-tiles">
          {optionsFor(task).map((n) => (
            <button key={n} type="button" className={picked === n ? "ac-stone is-on" : "ac-stone"} disabled={locked} onClick={() => onPick(n)}>
              {task.mode === "grow" ? ruleLabel(n) : n}
            </button>
          ))}
        </div>
      ) : null}
      {tiles && task.mode === "grow" && picked != null ? <p className="ac-tile-note">{ruleLabel(picked)}</p> : null}
      {tiles ? <span className="ac-sr">{show("Put a number on the blank.")}</span> : null}
    </div>
  );
}

export function PatternHands({ task, onAnswer }: { task: PatternTask; onAnswer: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <HandsShell kind="pattern" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(patternMatches(task, picked))}>
      <PatternBench task={task} locked={false} picked={picked} onPick={setPicked} />
    </HandsShell>
  );
}
