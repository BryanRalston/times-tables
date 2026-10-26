import { useState } from "react";
import { show } from "../i18n";
import type { ShareTask } from "../games/share-data";
import { shareMatches } from "../games/share-data";
import { HandsShell } from "./hands-kit";

export function ShareBench({
  task,
  locked,
  onChange,
}: {
  task: ShareTask;
  locked: boolean;
  onChange: (counts: number[], bank: number) => void;
}) {
  const [counts, setCounts] = useState<number[]>(() => (task.mode === "groups" ? [0] : Array.from({ length: task.plates }, () => 0)));
  const [bank, setBank] = useState(task.total);

  function publish(nextCounts: number[], nextBank: number) {
    setCounts(nextCounts);
    setBank(nextBank);
    onChange(nextCounts, nextBank);
  }

  function deal() {
    if (locked || bank <= 0) return;
    if (task.mode === "groups") {
      const open = counts.findIndex((count) => count < task.each);
      if (open >= 0) {
        const next = [...counts];
        next[open] = (next[open] ?? 0) + 1;
        publish(next, bank - 1);
        return;
      }
      if (counts.length < task.plates) publish([...counts, 1], bank - 1);
      return;
    }
    let open = 0;
    let least = counts[0] ?? 0;
    counts.forEach((count, index) => {
      if (count < least) {
        least = count;
        open = index;
      }
    });
    const next = [...counts];
    next[open] = (next[open] ?? 0) + 1;
    publish(next, bank - 1);
  }

  function undo(index: number) {
    if (locked || (counts[index] ?? 0) <= 0) return;
    const next = [...counts];
    next[index] = (next[index] ?? 0) - 1;
    while (task.mode === "groups" && next.length > 1 && next[next.length - 1] === 0) next.pop();
    publish(next, bank + 1);
  }

  function placeOn(index: number) {
    if (locked) return;
    if (bank <= 0) {
      undo(index);
      return;
    }
    if (task.mode === "groups") {
      if ((counts[index] ?? 0) < task.each) {
        const next = [...counts];
        next[index] = (next[index] ?? 0) + 1;
        publish(next, bank - 1);
        return;
      }
      if (counts.length < task.plates) publish([...counts, 1], bank - 1);
      return;
    }
    const next = [...counts];
    next[index] = (next[index] ?? 0) + 1;
    publish(next, bank - 1);
  }

  function reset() {
    if (locked) return;
    publish(task.mode === "groups" ? [0] : Array.from({ length: task.plates }, () => 0), task.total);
  }

  const placed = counts.reduce((sum, count) => sum + count, 0);

  return (
    <div className="ac-share-play">
      <button type="button" className="ac-cookie-bank" onClick={deal} disabled={locked || bank <= 0}>
        <span className="ac-cookie" aria-hidden="true" />
        <span>
          {show("Cookies to share")} {bank}
        </span>
      </button>
      <div className="ac-plates">
        {counts.map((count, index) => (
          <button key={index} type="button" className="ac-plate" onClick={() => placeOn(index)} disabled={locked || (count <= 0 && bank <= 0)} aria-label={show("Plate")}>
            {Array.from({ length: count }, (_, cookie) => (
              <i key={cookie} className="ac-cookie" />
            ))}
          </button>
        ))}
      </div>
      {placed > 0 ? (
        <button type="button" className="ac-quiet" onClick={reset} disabled={locked}>
          {show("Start over")}
        </button>
      ) : null}
    </div>
  );
}

export function ShareHands({ task, onAnswer }: { task: ShareTask; onAnswer: (ok: boolean) => void }) {
  const [counts, setCounts] = useState<number[]>(() => (task.mode === "groups" ? [0] : Array.from({ length: task.plates }, () => 0)));
  const [bank, setBank] = useState(task.total);
  return (
    <HandsShell kind="share" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(shareMatches(task, counts, bank))}>
      <ShareBench task={task} locked={false} onChange={(nextCounts, nextBank) => { setCounts(nextCounts); setBank(nextBank); }} />
    </HandsShell>
  );
}
