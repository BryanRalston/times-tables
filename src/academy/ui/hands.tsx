import { useRef, useState } from "react";
import { COIN_NAME, emptyPile, formatCents, oneCoin, pileCents, type CoinPile } from "../games/money-model";
import {
  clockMatches,
  dragClock,
  payMatches,
  stepClock,
  type ClockTask,
  type PayTask,
} from "../hands";
import { timeTalk } from "../games/time";
import type { CoinKind } from "../games/types";
import { AnalogClock } from "./bits";
import { CoinRow } from "./coins";

export function ClockBoard({ task, onAnswer }: { task: ClockTask; onAnswer: (ok: boolean) => void }) {
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);
  const [hand, setHand] = useState<"hour" | "minute">(task.snap >= 60 ? "hour" : "minute");
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function move(clientX: number, clientY: number) {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;
    const radius = box.width / 2;
    const next = dragClock({
      dx: clientX - (box.left + radius),
      dy: clientY - (box.top + box.height / 2),
      radius,
      snap: task.snap,
      hours,
      minutes,
    });
    setHours(next.hours);
    setMinutes(next.minutes);
    setHand(task.snap >= 60 || Math.hypot(clientX - (box.left + radius), clientY - (box.top + box.height / 2)) <= radius * 0.55 ? "hour" : "minute");
  }

  function nudge(dir: 1 | -1) {
    const next = stepClock(hours, minutes, task.snap, dir, hand);
    setHours(next.hours);
    setMinutes(next.minutes);
  }

  return (
    <div className="ac-hands" data-hands="clock">
      <p className="ac-hands-cap">{task.speech}</p>
      <div
        ref={boxRef}
        className="ac-clock-drag"
        role="group"
        tabIndex={0}
        aria-label={`${timeTalk(hours, minutes)}. Drag the hands. Arrow keys move them.`}
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          move(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          move(event.clientX, event.clientY);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            nudge(1);
          } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            nudge(-1);
          }
        }}
      >
        <AnalogClock hours={hours} minutes={minutes} />
      </div>
      <button type="button" className="ac-go" onClick={() => onAnswer(clockMatches(task, hours, minutes))}>
        Done
      </button>
    </div>
  );
}

export function PayBoard({ task, onAnswer }: { task: PayTask; onAnswer: (ok: boolean) => void }) {
  const [pile, setPile] = useState<CoinPile>(emptyPile);
  const trayRef = useRef<HTMLDivElement>(null);
  const drag = useRef<CoinKind | null>(null);
  const [ghost, setGhost] = useState<{ kind: CoinKind; x: number; y: number } | null>(null);

  function add(kind: CoinKind) {
    setPile((current) => ({ ...current, [kind]: current[kind] + 1 }));
  }

  function remove(kind: CoinKind) {
    setPile((current) => ({ ...current, [kind]: Math.max(0, current[kind] - 1) }));
  }

  function dropAt(x: number, y: number) {
    const kind = drag.current;
    drag.current = null;
    setGhost(null);
    if (!kind) return;
    const tray = trayRef.current?.getBoundingClientRect();
    if (!tray) return;
    const inside = x >= tray.left && x <= tray.right && y >= tray.top && y <= tray.bottom;
    if (inside) add(kind);
  }

  const faces: CoinKind[] = [];
  for (const kind of task.bank) {
    for (let i = 0; i < pile[kind]; i++) faces.push(kind);
  }

  return (
    <div className="ac-hands" data-hands="pay">
      <p className="ac-hands-cap">{task.speech}</p>
      <div className="ac-bank" aria-label="Coins">
        {task.bank.map((kind) => (
          <button
            key={kind}
            type="button"
            className="ac-coin-drag"
            aria-label={`Drag ${COIN_NAME[kind].toLowerCase()}`}
            onPointerDown={(event) => {
              drag.current = kind;
              event.currentTarget.setPointerCapture(event.pointerId);
              setGhost({ kind, x: event.clientX, y: event.clientY });
            }}
            onPointerMove={(event) => {
              if (drag.current !== kind) return;
              setGhost({ kind, x: event.clientX, y: event.clientY });
            }}
            onPointerUp={(event) => dropAt(event.clientX, event.clientY)}
            onPointerCancel={() => {
              drag.current = null;
              setGhost(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                add(kind);
              }
            }}
          >
            <CoinRow pile={oneCoin(kind)} label="" />
          </button>
        ))}
      </div>
      <div ref={trayRef} className="ac-tray" aria-label="Coins to pay">
        {faces.length === 0 ? <span className="ac-tray-empty">Drag coins here</span> : null}
        {faces.map((kind, index) => (
          <button
            key={`${kind}-${index}`}
            type="button"
            className="ac-coin-drag is-in"
            aria-label={`Remove ${COIN_NAME[kind].toLowerCase()}`}
            onClick={() => remove(kind)}
          >
            <CoinRow pile={oneCoin(kind)} label="" />
          </button>
        ))}
      </div>
      <p className="ac-hands-sum" aria-live="polite">
        {formatCents(pileCents(pile))}
      </p>
      {ghost ? (
        <div className="ac-coin-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
          <CoinRow pile={oneCoin(ghost.kind)} label="" />
        </div>
      ) : null}
      <button type="button" className="ac-go" onClick={() => onAnswer(payMatches(task.cents, pile))}>
        Done
      </button>
    </div>
  );
}
