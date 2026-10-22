import { useRef, useState } from "react";
import { show, t } from "../i18n";
import type { ArrayTask, BlocksTask, CountTask, FrameTask, ShadeTask } from "../hands-build";
import { arrayMatches, blocksMatches, countMatches, frameMatches, shadeMatches } from "../hands-build";
import { cx } from "./bits";
import { BlockPile, CastFace, DragGhost, HandsShell, RowDots, inside, useTrayDrag } from "./hands-kit";

export function ArrayBoard({ task, onAnswer }: { task: ArrayTask; onAnswer: (ok: boolean) => void }) {
  const [rows, setRows] = useState<number[]>([]);
  const trayRef = useRef<HTMLDivElement>(null);
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(trayRef.current, point.x, point.y)) return;
    const width = Number(id);
    setRows((current) => (current.length >= 12 ? current : [...current, width]));
  });

  function face(width: number) {
    return <RowDots n={width} />;
  }

  return (
    <HandsShell
      kind="array"
      fact={task.factKey}
      caption={task.speech}
      total={t(`${rows.length} ${rows.length === 1 ? "row" : "rows"}`, `${rows.length} ${rows.length === 1 ? "fila" : "filas"}`, `${rows.length} ${rows.length === 1 ? "linha" : "linhas"}`, `${rows.length} ${rows.length === 1 ? "ligne" : "lignes"}`)}
      onDone={() => onAnswer(arrayMatches(task, rows))}
    >
      <div ref={trayRef} className="ac-tray ac-array-tray" aria-label={show("Rows in the array")}>
        {rows.length === 0 ? <span className="ac-tray-empty">{show("Drag rows here")}</span> : null}
        {rows.map((width, index) => (
          <button
            key={`${width}-${index}`}
            type="button"
            className="ac-row-chip is-in ac-placed"
            aria-label={t(`Remove a row of ${width}`, `Quita una fila de ${width}`, `Tire uma linha de ${width}`, `Enlève une ligne de ${width}`)}
            onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
          >
            {face(width)}
          </button>
        ))}
      </div>
      <div className="ac-bank" aria-label={show("Row tiles")}>
        {[task.cols, task.decoy].map((width) => (
          <button
            key={width}
            type="button"
            className="ac-row-chip"
            data-piece={String(width)}
            aria-label={t(`Row of ${width}`, `Fila de ${width}`, `Linha de ${width}`, `Ligne de ${width}`)}
            {...pointerProps(String(width))}
          >
            {face(width)}
          </button>
        ))}
      </div>
      {ghost ? <DragGhost x={ghost.x} y={ghost.y}>{face(Number(ghost.id))}</DragGhost> : null}
    </HandsShell>
  );
}

function TenGrid({
  cells,
  filled,
  locked,
  onRemove,
}: {
  cells: number;
  filled: number;
  locked: number;
  onRemove?: () => void;
}) {
  const frames = cells > 10 ? [0, 1] : [0];
  return (
    <div className="ac-ten-stack">
      {frames.map((frame) => (
        <div key={frame} className="ac-ten-drag" aria-hidden="true">
          {Array.from({ length: Math.min(10, cells - frame * 10) }, (_, i) => {
            const index = frame * 10 + i;
            const has = index < filled;
            const fixed = index < locked;
            if (!has) return <i key={index} />;
            if (fixed || !onRemove) {
              return (
                <span key={index} className="is-lock">
                  <CastFace />
                </span>
              );
            }
            return (
              <button key={index} type="button" aria-label={show("Take one off")} onClick={onRemove}>
                <CastFace />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function FillFrame({ task, onAnswer }: { task: FrameTask; onAnswer: (ok: boolean) => void }) {
  const [extra, setExtra] = useState(0);
  const trayRef = useRef<HTMLDivElement>(null);
  const room = Math.max(0, task.cells - task.start);
  const { ghost, pointerProps } = useTrayDrag((_id, point, tapped) => {
    if (!tapped && !inside(trayRef.current, point.x, point.y)) return;
    setExtra((n) => Math.min(room, n + 1));
  });
  return (
    <HandsShell
      kind="frame"
      fact={task.factKey}
      caption={task.speech}
      total={String(task.start + extra)}
      onDone={() => onAnswer(frameMatches(task, extra))}
    >
      <div ref={trayRef}>
        <TenGrid
          cells={task.cells}
          filled={task.start + extra}
          locked={task.start}
          onRemove={() => setExtra((n) => Math.max(0, n - 1))}
        />
      </div>
      <div className="ac-bank">
        <button type="button" className="ac-coin-drag" data-piece="counter" aria-label={show("Drag a counter")} {...pointerProps("counter")}>
          <CastFace />
        </button>
      </div>
      {ghost ? (
        <DragGhost x={ghost.x} y={ghost.y}>
          <CastFace />
        </DragGhost>
      ) : null}
    </HandsShell>
  );
}

function TakeFrame({ task, onAnswer }: { task: FrameTask; onAnswer: (ok: boolean) => void }) {
  const [away, setAway] = useState(0);
  const awayRef = useRef<HTMLDivElement>(null);
  const { ghost, pointerProps } = useTrayDrag((_id, point, tapped) => {
    if (!tapped && !inside(awayRef.current, point.x, point.y)) return;
    setAway((n) => Math.min(task.start, n + 1));
  });
  const left = task.start - away;
  return (
    <HandsShell
      kind="frame"
      fact={task.factKey}
      caption={task.speech}
      total={t(`${away} away`, `${away} afuera`, `${away} para fora`, `${away} dehors`)}
      onDone={() => onAnswer(frameMatches(task, away))}
    >
      <div className="ac-ten-stack" aria-label={show("Counters still here")}>
        <TenGrid cells={task.cells} filled={left} locked={0} />
        {left > 0 ? (
          <button type="button" className="ac-coin-drag" data-piece="counter" aria-label={show("Drag a counter away")} {...pointerProps("stay")}>
            <CastFace />
          </button>
        ) : null}
      </div>
      <div ref={awayRef} className="ac-tray" aria-label={show("Taken away")}>
        {away === 0 ? <span className="ac-tray-empty">{show("Drag away")}</span> : null}
        {Array.from({ length: away }, (_, i) => (
          <button key={i} type="button" className="ac-coin-drag is-in ac-placed" aria-label={show("Put back")} onClick={() => setAway((n) => Math.max(0, n - 1))}>
            <CastFace who="host" />
          </button>
        ))}
      </div>
      {ghost ? (
        <DragGhost x={ghost.x} y={ghost.y}>
          <CastFace />
        </DragGhost>
      ) : null}
    </HandsShell>
  );
}

function pieceFace(kind: "hundred" | "ten" | "one") {
  if (kind === "hundred") return <span className="ac-hundred">100</span>;
  if (kind === "ten") return <i className="ac-rod" />;
  return <i className="ac-dot is-pink" />;
}

function RodMath({ task, onAnswer }: { task: FrameTask; onAnswer: (ok: boolean) => void }) {
  const adding = task.op === "+";
  const unit: 10 | 1 = task.change % 10 === 0 ? 10 : 1;
  const [moved, setMoved] = useState(0);
  const trayRef = useRef<HTMLDivElement>(null);
  const kind = unit === 10 ? "ten" : "one";
  const { ghost, pointerProps } = useTrayDrag((_id, point, tapped) => {
    if (!tapped && !inside(trayRef.current, point.x, point.y)) return;
    const cap = adding ? task.change + unit * 3 : task.start;
    setMoved((n) => Math.min(cap, n + unit));
  });
  const count = moved / unit;
  return (
    <HandsShell
      kind="frame"
      fact={task.factKey}
      caption={task.speech}
      total={adding ? String(task.start + moved) : t(`${moved} away`, `${moved} afuera`, `${moved} para fora`, `${moved} dehors`)}
      onDone={() => onAnswer(frameMatches(task, moved))}
    >
      <BlockPile tens={Math.floor(task.start / 10)} ones={task.start % 10} />
      <div ref={trayRef} className="ac-tray" aria-label={adding ? show("Blocks to add") : show("Blocks to take away")}>
        {count === 0 ? <span className="ac-tray-empty">{adding ? show("Drag blocks here") : show("Drag away")}</span> : null}
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            className="ac-block-drag is-in ac-placed"
            aria-label={show("Put back")}
            onClick={() => setMoved((n) => Math.max(0, n - unit))}
          >
            {pieceFace(kind)}
          </button>
        ))}
      </div>
      <div className="ac-bank">
        <button type="button" className="ac-block-drag" data-piece={kind} aria-label={kind === "ten" ? show("Drag a ten") : show("Drag a one")} {...pointerProps(kind)}>
          {pieceFace(kind)}
        </button>
      </div>
      {ghost ? <DragGhost x={ghost.x} y={ghost.y}>{pieceFace(kind)}</DragGhost> : null}
    </HandsShell>
  );
}

export function FrameBoard({ task, onAnswer }: { task: FrameTask; onAnswer: (ok: boolean) => void }) {
  if (task.model === "blocks") return <RodMath task={task} onAnswer={onAnswer} />;
  if (task.op === "-") return <TakeFrame task={task} onAnswer={onAnswer} />;
  return <FillFrame task={task} onAnswer={onAnswer} />;
}

export function CountBoard({ task, onAnswer }: { task: CountTask; onAnswer: (ok: boolean) => void }) {
  const [placed, setPlaced] = useState(0);
  const trayRef = useRef<HTMLDivElement>(null);
  const cap = task.mode === "teen" ? 12 : task.mode === "ten" ? (task.target <= 10 ? 10 : 20) : 12;
  const { ghost, pointerProps } = useTrayDrag((_id, point, tapped) => {
    if (!tapped && !inside(trayRef.current, point.x, point.y)) return;
    setPlaced((n) => Math.min(cap, n + 1));
  });
  const cells = task.mode === "ten" ? (task.target <= 10 ? 10 : 20) : 0;
  const total = task.mode === "teen" ? 10 + placed : placed;
  return (
    <HandsShell
      kind="count"
      fact={task.factKey}
      caption={task.speech}
      total={String(total)}
      onDone={() => onAnswer(countMatches(task, placed))}
    >
      {task.mode === "teen" ? (
        <div className="ac-teen-ten" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} className="ac-dot is-pink" />
          ))}
        </div>
      ) : null}
      <div ref={trayRef} className={task.mode === "ten" ? "" : "ac-tray"} aria-label={show("Counters")}>
        {task.mode === "ten" ? (
          <TenGrid cells={cells} filled={placed} locked={0} onRemove={() => setPlaced((n) => Math.max(0, n - 1))} />
        ) : placed === 0 ? (
          <span className="ac-tray-empty">{show("Drag counters here")}</span>
        ) : (
          Array.from({ length: placed }, (_, i) => (
            <button key={i} type="button" className="ac-coin-drag is-in ac-placed" aria-label={show("Remove a counter")} onClick={() => setPlaced((n) => Math.max(0, n - 1))}>
              <CastFace />
            </button>
          ))
        )}
      </div>
      <div className="ac-bank">
        <button type="button" className="ac-coin-drag" data-piece="counter" aria-label={show("Drag a counter")} {...pointerProps("counter")}>
          <CastFace />
        </button>
      </div>
      {ghost ? (
        <DragGhost x={ghost.x} y={ghost.y}>
          <CastFace />
        </DragGhost>
      ) : null}
    </HandsShell>
  );
}

export function BlocksBoard({ task, onAnswer }: { task: BlocksTask; onAnswer: (ok: boolean) => void }) {
  const [built, setBuilt] = useState({ hundreds: 0, tens: 0, ones: 0 });
  const trayRef = useRef<HTMLDivElement>(null);
  const kinds: Array<"hundred" | "ten" | "one"> = task.hundreds > 0 ? ["hundred", "ten"] : ["ten", "one"];
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(trayRef.current, point.x, point.y)) return;
    const key = id === "hundred" ? "hundreds" : id === "ten" ? "tens" : "ones";
    setBuilt((current) => ({ ...current, [key]: Math.min(12, current[key] + 1) }));
  });
  const value = built.hundreds * 100 + built.tens * 10 + built.ones;
  function remove(key: "hundreds" | "tens" | "ones") {
    setBuilt((current) => ({ ...current, [key]: Math.max(0, current[key] - 1) }));
  }
  return (
    <HandsShell kind="blocks" fact={task.factKey} caption={task.speech} total={String(value)} onDone={() => onAnswer(blocksMatches(task, built))}>
      <div ref={trayRef} className="ac-tray ac-block-tray" aria-label={show("Blocks you built")}>
        {value === 0 ? <span className="ac-tray-empty">{show("Drag blocks here")}</span> : null}
        {Array.from({ length: built.hundreds }, (_, i) => (
          <button key={`h${i}`} type="button" className="ac-block-drag is-in ac-placed" aria-label={show("Remove a hundred")} onClick={() => remove("hundreds")}>
            {pieceFace("hundred")}
          </button>
        ))}
        {Array.from({ length: built.tens }, (_, i) => (
          <button key={`t${i}`} type="button" className="ac-block-drag is-in ac-placed" aria-label={show("Remove a ten")} onClick={() => remove("tens")}>
            {pieceFace("ten")}
          </button>
        ))}
        {Array.from({ length: built.ones }, (_, i) => (
          <button key={`o${i}`} type="button" className="ac-block-drag is-in ac-placed" aria-label={show("Remove a one")} onClick={() => remove("ones")}>
            {pieceFace("one")}
          </button>
        ))}
      </div>
      <div className="ac-bank" aria-label={show("Base ten blocks")}>
        {kinds.map((kind) => (
          <button
            key={kind}
            type="button"
            className="ac-block-drag"
            data-piece={kind}
            aria-label={kind === "hundred" ? show("Drag a hundred") : kind === "ten" ? show("Drag a ten") : show("Drag a one")}
            {...pointerProps(kind)}
          >
            {pieceFace(kind)}
          </button>
        ))}
      </div>
      {ghost ? <DragGhost x={ghost.x} y={ghost.y}>{pieceFace(ghost.id === "hundred" || ghost.id === "ten" || ghost.id === "one" ? ghost.id : "one")}</DragGhost> : null}
    </HandsShell>
  );
}

export function ShadeBoard({ task, onAnswer }: { task: ShadeTask; onAnswer: (ok: boolean) => void }) {
  const [on, setOn] = useState<boolean[]>(() => Array.from({ length: task.den }, () => false));
  const boxRef = useRef<HTMLDivElement>(null);
  const paint = useRef<boolean | null>(null);

  function setAt(index: number, value: boolean) {
    if (index < 0) return;
    setOn((current) => {
      if (current[index] === value) return current;
      const next = current.slice();
      next[index] = value;
      return next;
    });
  }

  function indexAt(x: number, y: number): number {
    const kids = boxRef.current?.querySelectorAll("button");
    if (!kids) return -1;
    return [...kids].findIndex((kid) => inside(kid, x, y));
  }

  const shaded = on.filter(Boolean).length;
  return (
    <HandsShell
      kind="shade"
      fact={task.factKey}
      caption={task.speech}
      total={t(`${shaded} shaded`, `${shaded} pintadas`, `${shaded} pintadas`, `${shaded} coloriées`)}
      onDone={() => onAnswer(shadeMatches(task, on))}
    >
      <div
        ref={boxRef}
        className={cx("ac-frac", "ac-shade")}
        role="group"
        aria-label={show("Shade the parts")}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          const index = indexAt(event.clientX, event.clientY);
          if (index < 0) return;
          const next = !on[index];
          paint.current = next;
          setAt(index, next);
        }}
        onPointerMove={(event) => {
          if (paint.current == null) return;
          setAt(indexAt(event.clientX, event.clientY), paint.current);
        }}
        onPointerUp={() => {
          paint.current = null;
        }}
        onPointerCancel={() => {
          paint.current = null;
        }}
      >
        {on.map((filled, index) => (
          <button
            key={index}
            type="button"
            className={cx("ac-frac-btn", filled && "is-on")}
            aria-pressed={filled}
            data-piece={String(index)}
            aria-label={filled ? show("Shaded part") : show("Empty part")}
          />
        ))}
      </div>
    </HandsShell>
  );
}
