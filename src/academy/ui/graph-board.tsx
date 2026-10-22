import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { t, nounIsFeminine, thingName } from "../i18n";
import type { GraphShape } from "../games/boards";
import { graphsMatches, type GraphBenchSpec, type GraphsTask } from "../games/graph-data";
import { DragGhost, HandsShell, inside, useTrayDrag } from "./hands-kit";

interface GraphToken {
  id: string;
  home: number;
  bin: number;
  emoji: string;
  label: string;
}

function englishPlural(name: string): string {
  if (name === "candy") return "candies";
  if (name.endsWith("s")) return name;
  return `${name}s`;
}

function columnCount(spec: GraphBenchSpec): number {
  return spec.mode === "line" ? spec.stacks.length : spec.cats.length;
}

function columnLabel(spec: GraphBenchSpec, index: number): string {
  if (spec.mode === "line") return `${index}/${spec.den}`;
  const cat = spec.cats[index];
  if (!cat) return "";
  return thingName(cat.name, 2, englishPlural(cat.name));
}

function tokensFor(spec: GraphBenchSpec): GraphToken[] {
  const rows: GraphToken[] = [];
  if (spec.mode === "line") {
    spec.stacks.forEach((count, tick) => {
      for (let n = 0; n < count; n += 1) {
        rows.push({ id: `m${tick}-${n}`, home: tick, bin: -1, emoji: "", label: `${tick}/${spec.den}` });
      }
    });
    return mix(rows);
  }
  spec.cats.forEach((cat, index) => {
    const label = thingName(cat.name, 1, cat.name);
    for (let n = 0; n < cat.icons; n += 1) {
      rows.push({ id: `${cat.name}-${n}`, home: index, bin: -1, emoji: cat.emoji, label });
    }
  });
  return mix(rows);
}

function mix(rows: GraphToken[]): GraphToken[] {
  const out = [...rows];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = (i * 7 + out.length) % (i + 1);
    const swap = out[i];
    out[i] = out[j]!;
    out[j] = swap!;
  }
  return out;
}

function countsOf(rows: readonly GraphToken[], bins: number): number[] {
  const counts = Array.from({ length: bins }, () => 0);
  for (const row of rows) {
    if (row.bin >= 0 && row.bin < bins) counts[row.bin] = (counts[row.bin] ?? 0) + 1;
  }
  return counts;
}

function TallyMarks({ n }: { n: number }) {
  const width = Math.max(28, n * 10);
  return (
    <svg className="ac-tally" viewBox={`0 0 ${width} 32`} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const x = 6 + (i % 5) * 8 + Math.floor(i / 5) * 44;
        if (i % 5 === 4) return <line key={i} x1={x - 28} y1={28} x2={x + 2} y2={4} />;
        return <line key={i} x1={x} y1={4} x2={x} y2={28} />;
      })}
    </svg>
  );
}

function ColumnViz({ shape, count, emoji }: { shape: GraphShape; count: number; emoji: string }) {
  switch (shape) {
    case "bar":
      return (
        <div className="ac-graph-plot" aria-hidden="true">
          {count > 0 ? <i className="ac-graph-bar" style={{ height: count * 18 }} /> : null}
        </div>
      );
    case "tally":
      return count > 0 ? <TallyMarks n={count} /> : <span className="ac-graph-empty" />;
    case "bins":
    case "picture":
      return (
        <span className="ac-graph-pics" aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <i key={i}>{emoji}</i>
          ))}
        </span>
      );
    case "line":
      return (
        <span className="ac-graph-dots" aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      );
    default: {
      const neverShape: never = shape;
      return neverShape;
    }
  }
}

export function GraphBench({
  spec,
  locked,
  onChange,
}: {
  spec: GraphBenchSpec;
  locked: boolean;
  onChange?: (counts: number[]) => void;
}) {
  const bins = columnCount(spec);
  const [tokens, setTokens] = useState<GraphToken[]>(() => tokensFor(spec));
  const [selected, setSelected] = useState<string | null>(null);
  const bankRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const target = spec.mode === "line" ? spec.stacks : spec.cats.map((cat) => cat.icons);
  const view = locked ? tokens.map((token) => ({ ...token, bin: token.home })) : tokens;
  const counts = countsOf(view, bins);
  const matched = target.length === counts.length && target.every((count, index) => count === counts[index]);
  const placed = view.filter((token) => token.bin >= 0).length;

  useEffect(() => {
    onChangeRef.current?.(countsOf(tokens, bins));
  }, [bins, tokens]);

  function commit(next: GraphToken[]) {
    setTokens(next);
    setSelected(null);
  }

  function move(id: string, bin: number) {
    if (locked) return;
    commit(tokens.map((token) => (token.id === id ? { ...token, bin } : token)));
  }

  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (locked) return;
    const token = tokens.find((row) => row.id === id);
    if (!token) return;
    if (tapped) {
      if (token.bin < 0) {
        setSelected((current) => (current === id ? null : id));
        return;
      }
      if (selected && selected !== id) move(selected, token.bin);
      else move(id, -1);
      return;
    }
    const col = colRefs.current.findIndex((el) => inside(el, point.x, point.y));
    if (col >= 0) {
      move(id, col);
      return;
    }
    if (inside(bankRef.current, point.x, point.y)) move(id, -1);
  });

  function tokenProps(id: string) {
    const drag = pointerProps(id);
    return {
      ...drag,
      onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
        event.stopPropagation();
        drag.onPointerDown(event);
      },
      onClick(event: ReactMouseEvent<HTMLButtonElement>) {
        event.stopPropagation();
      },
    };
  }

  const ghostToken = ghost ? tokens.find((token) => token.id === ghost.id) : undefined;

  return (
    <div className="ac-data" data-graph={spec.mode} data-ready={matched ? "yes" : "no"}>
      {spec.scale > 1 ? (
        <p className="ac-graph-key">{t(`Each picture is ${spec.scale}`, `Cada dibujo vale ${spec.scale}`, undefined, `Chaque image vaut ${spec.scale}`, `每个图代表${spec.scale}`, `हर चित्र ${spec.scale} है`, `كل صورة تساوي ${spec.scale}`)}</p>
      ) : null}
      <div className={spec.mode === "line" ? "ac-graph-line" : "ac-graph-cols"}>
        {Array.from({ length: bins }, (_, index) => {
          const label = columnLabel(spec, index);
          const here = view.filter((token) => token.bin === index);
          const emoji = spec.cats[index]?.emoji ?? "";
          return (
            <div
              key={label || index}
              ref={(el) => {
                colRefs.current[index] = el;
              }}
              className="ac-data-col"
              role="group"
              aria-label={`${label}, ${here.length}`}
              tabIndex={0}
              onClick={() => {
                if (selected) move(selected, index);
              }}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && selected) {
                  event.preventDefault();
                  move(selected, index);
                }
              }}
            >
              <span className="ac-graph-label">{label}</span>
              {spec.shape === "tally" || spec.shape === "bar" || spec.shape === "line" ? (
                <ColumnViz shape={spec.shape} count={here.length} emoji={emoji} />
              ) : null}
              <span className={spec.shape === "bins" || spec.shape === "picture" ? "ac-graph-pics" : "ac-graph-chips"}>
                {here.map((token) => (
                  <button
                    key={token.id}
                    type="button"
                    className="ac-graph-token is-chip"
                    aria-label={t(
                      `Put ${token.label} back`,
                      token.label.includes("/")
                        ? `Regresa ${token.label}`
                        : `Regresa ${nounIsFeminine(token.label) ? "la" : "el"} ${token.label}`,
                      token.label.includes("/")
                        ? `Devolva ${token.label}`
                        : `Devolva ${nounIsFeminine(token.label) ? "a" : "o"} ${token.label}`,
                    token.label.includes("/") ? `Remets ${token.label}` : `Remets ${nounIsFeminine(token.label) ? "la" : "le"} ${token.label}`, `把${thingName(token.label, 2, token.label)}放回去`, `${token.label} वापस रखो`, token.label.includes("/") ? `أعد ${token.label}` : `أعد ${thingName(token.label, 2, token.label)}`)}
                    disabled={locked}
                    {...tokenProps(token.id)}
                  >
                    {token.emoji || token.label}
                  </button>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      {placed < view.length ? (
        <div ref={bankRef} className="ac-graph-bank" aria-label={t("Pictures to sort", "Dibujos para ordenar")}>
          {view
            .filter((token) => token.bin < 0)
            .map((token) => (
              <button
                key={token.id}
                type="button"
                className={token.id === selected ? "ac-graph-token is-pick" : "ac-graph-token"}
                aria-pressed={token.id === selected}
                aria-label={token.label}
                disabled={locked}
                {...tokenProps(token.id)}
              >
                {token.emoji || token.label}
              </button>
            ))}
        </div>
      ) : (
        <div ref={bankRef} hidden />
      )}
      {!locked && placed === view.length && view.length > 0 && !matched ? (
        <p className="ac-tile-note">{t("Check each group.", "Revisa cada grupo.")}</p>
      ) : null}
      {ghost && ghostToken ? (
        <DragGhost x={ghost.x} y={ghost.y}>
          <span className="ac-graph-token">{ghostToken.emoji || ghostToken.label}</span>
        </DragGhost>
      ) : null}
    </div>
  );
}

export function GraphsHands({ task, onAnswer }: { task: GraphsTask; onAnswer: (ok: boolean) => void }) {
  const bins = task.mode === "line" ? task.stacks.length : task.cats.length;
  const counts = useRef<number[]>(Array.from({ length: bins }, () => 0));
  const spec: GraphBenchSpec = {
    mode: task.mode,
    shape: task.shape,
    cats: task.cats,
    scale: task.scale,
    den: task.den,
    stacks: task.stacks,
  };
  return (
    <HandsShell kind="graphs" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(graphsMatches(task, counts.current))}>
      <GraphBench spec={spec} locked={false} onChange={(next) => { counts.current = next; }} />
    </HandsShell>
  );
}
