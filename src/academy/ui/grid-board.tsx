import { useState } from "react";
import { show } from "../i18n";
import type { GridEdge } from "../games/grid-data";
import { exposedEdges, gridMatches } from "../games/grid-data";
import type { GridTask } from "../games/grid-data";
import { HandsShell } from "./hands-kit";

function Shape({
  task,
  picked,
  locked,
  onToggle,
}: {
  task: GridTask;
  picked: readonly string[];
  locked: boolean;
  onToggle: (key: string) => void;
}) {
  const edges = task.mode === "fence" ? exposedEdges(task.cells) : [];
  return (
    <div
      className="ac-grid-shape"
      style={{ gridTemplateColumns: `repeat(${Math.max(1, task.cols)}, 52px)`, gridTemplateRows: `repeat(${Math.max(1, task.rows)}, 52px)` }}
    >
      {task.cells.map(([x, y]) => {
        const key = `${x},${y}`;
        if (task.mode === "tiles") {
          const on = picked.includes(key);
          return (
            <button
              key={key}
              type="button"
              className={on ? "ac-plot is-on" : "ac-plot"}
              style={{ gridColumn: x + 1, gridRow: y + 1 }}
              disabled={locked}
              aria-label={show("Square")}
              onClick={() => onToggle(key)}
            />
          );
        }
        return <div key={key} className="ac-plot" style={{ gridColumn: x + 1, gridRow: y + 1 }} />;
      })}
      {edges.map((edge) => (
        <EdgeButton key={`${edge.x},${edge.y},${edge.side}`} edge={edge} on={picked.includes(`${edge.x},${edge.y},${edge.side}`)} locked={locked} onToggle={onToggle} />
      ))}
    </div>
  );
}

function EdgeButton({
  edge,
  on,
  locked,
  onToggle,
}: {
  edge: GridEdge;
  on: boolean;
  locked: boolean;
  onToggle: (key: string) => void;
}) {
  const key = `${edge.x},${edge.y},${edge.side}`;
  return (
    <button
      type="button"
      className={on ? `ac-edge-hit is-${edge.side} is-on` : `ac-edge-hit is-${edge.side}`}
      style={{ gridColumn: edge.x + 1, gridRow: edge.y + 1 }}
      disabled={locked}
      aria-label={show("Edge")}
      onClick={() => onToggle(key)}
    />
  );
}

export function GridBench({
  task,
  locked,
  onChange,
}: {
  task: GridTask;
  locked: boolean;
  onChange: (picked: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);

  function toggle(key: string) {
    if (locked) return;
    const next = picked.includes(key) ? picked.filter((item) => item !== key) : [...picked, key];
    setPicked(next);
    onChange(next);
  }

  if (task.mode === "side") {
    return (
      <div className="ac-grid-play">
        <div className="ac-side-row" aria-hidden="true">
          {Array.from({ length: task.known }, (_, index) => (
            <i key={index} className="ac-plot" />
          ))}
          <b>?</b>
        </div>
      </div>
    );
  }

  return (
    <div className="ac-grid-play">
      <Shape task={task} picked={picked} locked={locked} onToggle={toggle} />
    </div>
  );
}

export function GridHands({ task, onAnswer }: { task: GridTask; onAnswer: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const choices = task.mode === "side" ? numberChoices(task.missing) : [];
  return (
    <HandsShell kind="grid" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(gridMatches(task, picked))}>
      {task.mode === "side" ? (
        <div className="ac-grid-play">
          <div className="ac-side-row" aria-hidden="true">
            {Array.from({ length: task.known }, (_, index) => (
              <i key={index} className="ac-plot" />
            ))}
            <b>?</b>
          </div>
          <div className="ac-num-tiles">
            {choices.map((n) => (
              <button key={n} type="button" className={picked[0] === String(n) ? "ac-stone is-on" : "ac-stone"} onClick={() => setPicked([String(n)])}>
                {n}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <GridBench task={task} locked={false} onChange={setPicked} />
      )}
    </HandsShell>
  );
}

function numberChoices(answer: number): number[] {
  const pool = [answer, answer + 1, Math.max(1, answer - 1), answer + 2].filter((n, index, all) => all.indexOf(n) === index);
  while (pool.length < 4) pool.push((pool[pool.length - 1] ?? answer) + 3);
  return pool.slice(0, 4);
}
