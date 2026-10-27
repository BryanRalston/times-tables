import { useState } from "react";
import type { SignMark } from "../games/boards";
import { signHint, signsMatch, type SignsTask } from "../games/signs-data";
import { BlockPile, HandsShell } from "./hands-kit";

const MARKS: SignMark[] = ["<", "=", ">"];

function Dots({ n, tint }: { n: number; tint: "pink" | "teal" }) {
  return (
    <span className="ac-dots" aria-hidden="true">
      {Array.from({ length: Math.max(0, Math.min(n, 10)) }, (_, index) => (
        <i key={index} className={`ac-dot is-${tint}`} />
      ))}
    </span>
  );
}

function PlaceBits({ n }: { n: number }) {
  if (n > 999) return null;
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  if (hundreds + tens + ones === 0) return <Dots n={0} tint="pink" />;
  return <BlockPile hundreds={hundreds} tens={tens} ones={ones} />;
}

export function SignPair({ task }: { task: SignsTask }) {
  return (
    <div className="ac-sign-eq" dir="ltr">
      <div>
        <b>{task.left}</b>
        {task.mode === "to10" ? <Dots n={task.left} tint="pink" /> : <PlaceBits n={task.left} />}
      </div>
      <span className="ac-sign-gap" aria-hidden="true">
        ?
      </span>
      <div>
        <b>{task.right}</b>
        {task.mode === "to10" ? <Dots n={task.right} tint="teal" /> : <PlaceBits n={task.right} />}
      </div>
    </div>
  );
}

export function SignBench({
  task,
  picked,
  locked,
  onPick,
}: {
  task: SignsTask;
  picked: SignMark | null;
  locked: boolean;
  onPick: (mark: SignMark) => void;
}) {
  return (
    <div className="ac-sign-play">
      <SignPair task={task} />
      <div className="ac-num-tiles" dir="ltr">
        {MARKS.map((mark) => (
          <button
            key={mark}
            type="button"
            className={picked === mark ? "ac-stone is-on" : "ac-stone"}
            disabled={locked}
            onClick={() => onPick(mark)}
          >
            {mark}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SignHands({ task, onAnswer }: { task: SignsTask; onAnswer: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<SignMark | null>(null);
  return (
    <HandsShell kind="signs" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(signsMatch(task, picked))}>
      <SignBench task={task} picked={picked} locked={false} onPick={setPicked} />
      <p className="ac-tile-note">{signHint(task.mode)}</p>
    </HandsShell>
  );
}
