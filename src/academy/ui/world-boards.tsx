import { useRef, useState } from "react";
import { partPhrase, shapeWord, show, t } from "../i18n";
import type { ShapeName, VariableBoard } from "../games/boards";
import { GeoMark, ShapeFig } from "../games/scene-ui";
import { VariableEquation } from "../games/variables";
import type { BlankTask, MeasureTask, ShapeTask, StoryTask } from "../hands-build";
import { blankMatches, measureMatches, shapeMatches, storyMatches } from "../hands-build";
import { CastFace, DragGhost, HandsShell, inside, useTrayDrag } from "./hands-kit";

const SHAPE_NAMES: readonly ShapeName[] = [
  "circle",
  "triangle",
  "square",
  "rectangle",
  "pentagon",
  "hexagon",
  "cube",
  "sphere",
  "cone",
  "cylinder",
];

function isShapeName(value: string): value is ShapeName {
  return (SHAPE_NAMES as readonly string[]).includes(value);
}

function pieceLabel(name: string): string {
  const shape = shapeWord(name);
  if (shape !== name) return shape;
  const part = partPhrase(name);
  if (part !== name) return part;
  return name;
}

function Units({ n, emoji }: { n: number; emoji?: string }) {
  return (
    <span className="ac-unit-row" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className="ac-inch">
          {emoji ?? ""}
        </i>
      ))}
    </span>
  );
}

function PartTile({ name }: { name: string }) {
  if (name === "thirds") {
    return (
      <svg className="ac-part" viewBox="0 0 80 48" aria-hidden="true">
        <rect x="1" y="1" width="24" height="46" />
        <rect x="28" y="1" width="24" height="46" />
        <rect x="55" y="1" width="24" height="46" />
      </svg>
    );
  }
  if (name === "fourths") {
    return (
      <svg className="ac-part" viewBox="0 0 80 48" aria-hidden="true">
        <rect x="1" y="1" width="38" height="22" />
        <rect x="41" y="1" width="38" height="22" />
        <rect x="1" y="25" width="38" height="22" />
        <rect x="41" y="25" width="38" height="22" />
      </svg>
    );
  }
  if (name === "unequal") {
    return (
      <svg className="ac-part" viewBox="0 0 80 48" aria-hidden="true">
        <rect x="1" y="1" width="22" height="46" />
        <rect x="25" y="1" width="54" height="46" className="is-soft" />
      </svg>
    );
  }
  return (
    <svg className="ac-part" viewBox="0 0 80 48" aria-hidden="true">
      <rect x="1" y="1" width="38" height="46" />
      <rect x="41" y="1" width="38" height="46" />
    </svg>
  );
}

function pieceCode(name: string): string | null {
  if (name === "tri-a" || name === "tri-b") return "geo:piece:triangle";
  if (name === "half-a" || name === "half-b") return "geo:piece:half";
  if (name.startsWith("geo:")) return name;
  return null;
}

function ShapeTile({ name, part }: { name: string; part: boolean }) {
  if (part && !name.includes("/")) return <PartTile name={name} />;
  const code = pieceCode(name);
  if (code) return <GeoMark code={code} />;
  if (name === "rhombus" || name === "trapezoid") return <GeoMark code={`geo:quad:${name}`} />;
  if (isShapeName(name)) return <ShapeFig name={name} />;
  if (name.startsWith("geo:quad:")) return <GeoMark code={name} />;
  if (name.startsWith("geo:fold:") || name.includes(":yes") || name.includes(":no")) {
    return <GeoMark code={name.startsWith("geo:") ? name : `geo:fold:${name}`} />;
  }
  if (name === "above" || name === "below" || name === "beside" || name === "behind") {
    return <GeoMark code={`geo:pos:${name}`} />;
  }
  return <span className="ac-num-tile">{name}</span>;
}

export function MeasureBoard({ task, onAnswer }: { task: MeasureTask; onAnswer: (ok: boolean) => void }) {
  const [placed, setPlaced] = useState<number | null>(task.mode === "compare" ? null : 0);
  const trayRef = useRef<HTMLDivElement>(null);
  const count = task.mode === "compare" ? (placed ?? 0) : (placed ?? 0);
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(trayRef.current, point.x, point.y)) return;
    if (task.mode === "compare") {
      setPlaced(Number(id));
      return;
    }
    setPlaced((current) => Math.min(8, (current ?? 0) + 1));
  });
  const emoji = task.emoji;
  return (
    <HandsShell
      kind="measure"
      fact={task.factKey}
      caption={task.speech}
      total={task.mode === "compare" ? (placed == null ? show("Choose one") : `${placed}`) : String(count)}
      onDone={() => onAnswer(measureMatches(task, task.mode === "compare" ? (placed ?? -1) : count))}
    >
      {task.mode === "ruler" ? <div className="ac-ribbon" style={{ width: task.target * 32 }} aria-hidden="true" /> : null}
      {task.mode === "more" ? (
        <div className="ac-compare-pair" aria-hidden="true">
          <Units n={task.bars[0] ?? 0} emoji={emoji || "●"} />
          <Units n={task.bars[1] ?? 0} emoji={emoji || "●"} />
        </div>
      ) : null}
      <div ref={trayRef} className="ac-tray" aria-label={show("Your measure")}>
        {task.mode === "compare" ? (
          placed == null ? (
            <span className="ac-tray-empty">{show("Drag one here")}</span>
          ) : (
            <button type="button" className="ac-measure-drag is-in ac-placed" aria-label={show("Put back")} onClick={() => setPlaced(null)}>
              <Units n={placed} />
            </button>
          )
        ) : count === 0 ? (
          <span className="ac-tray-empty">{task.mode === "ruler" ? show("Drag the inches") : show("Drag them here")}</span>
        ) : (
          <button type="button" className="ac-placed" aria-label={show("Remove one")} onClick={() => setPlaced((n) => Math.max(0, (n ?? 0) - 1))}>
            <Units n={count} emoji={task.mode === "graph" ? emoji || "▮" : emoji || undefined} />
          </button>
        )}
      </div>
      {task.mode === "ruler" ? <div className="ac-ruler-read" aria-hidden="true">0 1 2 3 4 5 6</div> : null}
      <div className="ac-bank">
        {task.mode === "compare" ? (
          task.bars.map((length, index) => (
            <button
              key={`${length}-${index}`}
              type="button"
              className="ac-measure-drag"
              data-piece={String(length)}
              aria-label={`${length} units`}
              {...pointerProps(String(length))}
            >
              <Units n={length} />
            </button>
          ))
        ) : (
          <button type="button" className="ac-block-drag" data-piece="unit" aria-label={task.mode === "ruler" ? show("Drag an inch") : show("Drag one")} {...pointerProps("unit")}>
            <Units n={1} emoji={emoji || (task.mode === "graph" ? "▮" : undefined)} />
          </button>
        )}
      </div>
      {ghost ? (
        <DragGhost x={ghost.x} y={ghost.y}>
          <Units n={task.mode === "compare" ? Number(ghost.id) : 1} emoji={emoji || undefined} />
        </DragGhost>
      ) : null}
    </HandsShell>
  );
}

export function ShapeBoard({ task, onAnswer }: { task: ShapeTask; onAnswer: (ok: boolean) => void }) {
  if (task.mode === "join") return <JoinShapes task={task} onAnswer={onAnswer} />;
  if (task.mode === "grid") return <GridCount task={task} onAnswer={onAnswer} />;
  return <PickShape task={task} onAnswer={onAnswer} />;
}

function PickShape({ task, onAnswer }: { task: ShapeTask; onAnswer: (ok: boolean) => void }) {
  const [placed, setPlaced] = useState<string | null>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const part = task.mode === "parts";
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(wellRef.current, point.x, point.y)) return;
    setPlaced(id);
  });
  return (
    <HandsShell kind="shapes" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(shapeMatches(task, placed))}>
      <div ref={wellRef} className="ac-tray ac-shape-well" aria-label={task.speech}>
        {task.prompt.startsWith("geo:") ? <GeoMark code={task.prompt} /> : task.prompt ? <p className="ac-shape-prompt">{task.prompt}</p> : null}
        {placed ? (
          <button type="button" className="ac-shape-drag is-in ac-placed" aria-label={t(`Remove ${placed}`, `Quita ${placed}`, `Tire ${placed}`, `Enlève ${placed}`, `拿走${placed}`, `${pieceLabel(placed)} हटाओ`, `أزل ${pieceLabel(placed)}`)} onClick={() => setPlaced(null)}>
            <span className="ac-mini-shape">
              <ShapeTile name={placed} part={part} />
            </span>
          </button>
        ) : (
          <span className="ac-tray-empty">{show("Drag the shape")}</span>
        )}
      </div>
      <div className="ac-bank" aria-label={show("Shapes")}>
        {task.options
          .filter((name) => name !== placed)
          .map((name) => (
            <button key={name} type="button" className="ac-shape-drag" data-piece={name} aria-label={pieceLabel(name)} {...pointerProps(name)}>
              <span className="ac-mini-shape">
                <ShapeTile name={name} part={part} />
              </span>
            </button>
          ))}
      </div>
      {ghost ? (
        <DragGhost x={ghost.x} y={ghost.y}>
          <span className="ac-mini-shape">
            <ShapeTile name={ghost.id} part={part} />
          </span>
        </DragGhost>
      ) : null}
    </HandsShell>
  );
}

function JoinShapes({ task, onAnswer }: { task: ShapeTask; onAnswer: (ok: boolean) => void }) {
  const [placed, setPlaced] = useState<string[]>([]);
  const wellRef = useRef<HTMLDivElement>(null);
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(wellRef.current, point.x, point.y)) return;
    setPlaced((current) => (current.includes(id) ? current : [...current, id]));
  });
  const built = [...placed].sort().join("+");
  return (
    <HandsShell kind="shapes" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(shapeMatches(task, built))}>
      {task.prompt.startsWith("geo:") ? <GeoMark code={task.prompt} /> : null}
      <div ref={wellRef} className="ac-tray ac-shape-well" aria-label={show("Drag the shape")}>
        {placed.length === 0 ? <span className="ac-tray-empty">{show("Drag the shape")}</span> : null}
        {placed.map((name) => (
          <button key={name} type="button" className="ac-shape-drag is-in ac-placed" aria-label={t(`Remove ${name}`, `Quita ${name}`, `Tire ${name}`, `Enlève ${name}`, `拿走${name}`, `${pieceLabel(name)} हटाओ`, `أزل ${pieceLabel(name)}`)} onClick={() => setPlaced((current) => current.filter((item) => item !== name))}>
            <span className="ac-mini-shape">
              <ShapeTile name={name} part={false} />
            </span>
          </button>
        ))}
      </div>
      <div className="ac-bank" aria-label={show("Shapes")}>
        {task.options
          .filter((name) => !placed.includes(name))
          .map((name) => (
            <button key={name} type="button" className="ac-shape-drag" data-piece={name} aria-label={pieceLabel(name)} {...pointerProps(name)}>
              <span className="ac-mini-shape">
                <ShapeTile name={name} part={false} />
              </span>
            </button>
          ))}
      </div>
      {ghost ? (
        <DragGhost x={ghost.x} y={ghost.y}>
          <span className="ac-mini-shape">
            <ShapeTile name={ghost.id} part={false} />
          </span>
        </DragGhost>
      ) : null}
    </HandsShell>
  );
}

function GridCount({ task, onAnswer }: { task: ShapeTask; onAnswer: (ok: boolean) => void }) {
  const [placed, setPlaced] = useState<string | null>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(wellRef.current, point.x, point.y)) return;
    setPlaced(id);
  });
  return (
    <HandsShell kind="shapes" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(shapeMatches(task, placed))}>
      {task.prompt.startsWith("geo:") ? <GeoMark code={task.prompt} /> : null}
      <div ref={wellRef} className="ac-tray ac-shape-well" aria-label={task.speech}>
        {placed ? (
          <button type="button" className="ac-shape-drag is-in ac-placed" aria-label={show("Put back")} onClick={() => setPlaced(null)}>
            <span className="ac-num-tile">{placed}</span>
          </button>
        ) : (
          <span className="ac-tray-empty">{show("Drag the shape")}</span>
        )}
      </div>
      <div className="ac-bank" aria-label={show("Shapes")}>
        {task.options
          .filter((name) => name !== placed)
          .map((name) => (
            <button key={name} type="button" className="ac-shape-drag" data-piece={name} aria-label={pieceLabel(name)} {...pointerProps(name)}>
              <span className="ac-num-tile">{name}</span>
            </button>
          ))}
      </div>
      {ghost ? (
        <DragGhost x={ghost.x} y={ghost.y}>
          <span className="ac-num-tile">{ghost.id}</span>
        </DragGhost>
      ) : null}
    </HandsShell>
  );
}

function Faces({ n, who }: { n: number; who: "buddy" | "host" }) {
  return (
    <span className="ac-chip-faces">
      {Array.from({ length: n }, (_, i) => (
        <CastFace key={i} who={who} />
      ))}
    </span>
  );
}

export function StoryBoard({ task, onAnswer }: { task: StoryTask; onAnswer: (ok: boolean) => void }) {
  if (task.mode === "join") return <JoinStory task={task} onAnswer={onAnswer} />;
  if (task.mode === "take") return <TakeStory task={task} onAnswer={onAnswer} />;
  if (task.mode === "share") return <ShareStory task={task} onAnswer={onAnswer} />;
  return <GroupStory task={task} onAnswer={onAnswer} />;
}

function JoinStory({ task, onAnswer }: { task: StoryTask; onAnswer: (ok: boolean) => void }) {
  const [placed, setPlaced] = useState<string[]>([]);
  const trayRef = useRef<HTMLDivElement>(null);
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(trayRef.current, point.x, point.y)) return;
    setPlaced((current) => (current.includes(id) ? current : [...current, id]));
  });
  const groups = placed.map((id) => task.pieces.find((piece) => piece.id === id)?.size ?? 0);
  const pool = task.pieces.filter((piece) => !placed.includes(piece.id));
  return (
    <HandsShell
      kind="story"
      fact={task.factKey}
      caption={task.speech}
      onDone={() => onAnswer(storyMatches(task, { groups, away: 0, bins: [] }))}
    >
      <div ref={trayRef} className="ac-tray ac-scene" aria-label={show("In the story")}>
        {placed.length === 0 ? <span className="ac-tray-empty">{show("Drag the groups")}</span> : null}
        {placed.map((id) => {
          const size = task.pieces.find((piece) => piece.id === id)?.size ?? 0;
          return (
            <button key={id} type="button" className="ac-group-chip is-in ac-placed" aria-label={show("Take the group out")} onClick={() => setPlaced((current) => current.filter((item) => item !== id))}>
              <Faces n={size} who={id === "g2" ? "host" : "buddy"} />
            </button>
          );
        })}
      </div>
      <div className="ac-bank">
        {pool.map((piece) => (
          <button key={piece.id} type="button" className="ac-group-chip" data-piece={String(piece.size)} aria-label={`Group of ${piece.size}`} {...pointerProps(piece.id)}>
            <Faces n={piece.size} who={piece.id === "g2" ? "host" : "buddy"} />
          </button>
        ))}
      </div>
      {ghost ? (
        <DragGhost x={ghost.x} y={ghost.y}>
          <Faces n={task.pieces.find((piece) => piece.id === ghost.id)?.size ?? 1} who={ghost.id === "g2" ? "host" : "buddy"} />
        </DragGhost>
      ) : null}
    </HandsShell>
  );
}

function GroupStory({ task, onAnswer }: { task: StoryTask; onAnswer: (ok: boolean) => void }) {
  const [groups, setGroups] = useState<number[]>([]);
  const trayRef = useRef<HTMLDivElement>(null);
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(trayRef.current, point.x, point.y)) return;
    const size = Number(id);
    setGroups((current) => (current.length >= 8 ? current : [...current, size]));
  });
  return (
    <HandsShell
      kind="story"
      fact={task.factKey}
      caption={task.speech}
      onDone={() => onAnswer(storyMatches(task, { groups, away: 0, bins: [] }))}
    >
      <div ref={trayRef} className="ac-tray ac-scene" aria-label={show("In the story")}>
        {groups.length === 0 ? <span className="ac-tray-empty">{show("Drag the groups")}</span> : null}
        {groups.map((size, index) => (
          <button
            key={`${size}-${index}`}
            type="button"
            className="ac-group-chip is-in ac-placed"
            aria-label={show("Take the group out")}
            onClick={() => setGroups((current) => current.filter((_, i) => i !== index))}
          >
            <Faces n={size} who="buddy" />
          </button>
        ))}
      </div>
      <div className="ac-bank">
        {[task.b, task.decoy].map((size) => (
          <button key={size} type="button" className="ac-group-chip" data-piece={String(size)} aria-label={`Group of ${size}`} {...pointerProps(String(size))}>
            <Faces n={size} who={size === task.b ? "buddy" : "host"} />
          </button>
        ))}
      </div>
      {ghost ? (
        <DragGhost x={ghost.x} y={ghost.y}>
          <Faces n={Number(ghost.id)} who="buddy" />
        </DragGhost>
      ) : null}
    </HandsShell>
  );
}

function TakeStory({ task, onAnswer }: { task: StoryTask; onAnswer: (ok: boolean) => void }) {
  const [away, setAway] = useState(0);
  const awayRef = useRef<HTMLDivElement>(null);
  const { ghost, pointerProps } = useTrayDrag((_id, point, tapped) => {
    if (!tapped && !inside(awayRef.current, point.x, point.y)) return;
    setAway((n) => Math.min(task.a, n + 1));
  });
  const left = task.a - away;
  return (
    <HandsShell
      kind="story"
      fact={task.factKey}
      caption={task.speech}
      total={`${left} left`}
      onDone={() => onAnswer(storyMatches(task, { groups: [], away, bins: [] }))}
    >
      <div className="ac-scene ac-face-row" aria-label={show("Still in the story")}>
        {Array.from({ length: left }, (_, i) => (
          <span key={i} className="ac-face-slot">
            <CastFace />
          </span>
        ))}
        {left > 0 ? (
          <button type="button" className="ac-coin-drag" data-piece="counter" aria-label={show("Drag one out")} {...pointerProps("out")}>
            <CastFace />
          </button>
        ) : null}
      </div>
      <div ref={awayRef} className="ac-tray" aria-label={show("Given away")}>
        {away === 0 ? <span className="ac-tray-empty">{show("Drag them out")}</span> : null}
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

function ShareStory({ task, onAnswer }: { task: StoryTask; onAnswer: (ok: boolean) => void }) {
  const [bins, setBins] = useState<number[][]>(() => Array.from({ length: task.b }, () => []));
  const binRefs = useRef<Array<HTMLDivElement | null>>([]);
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    const token = Number(id);
    setBins((current) => {
      if (current.some((row) => row.includes(token))) return current;
      let bin = 0;
      if (tapped) {
        const smallest = Math.min(...current.map((row) => row.length));
        bin = current.findIndex((row) => row.length === smallest);
      } else {
        const hit = binRefs.current.findIndex((el) => inside(el, point.x, point.y));
        if (hit < 0) return current;
        bin = hit;
      }
      return current.map((row, index) => (index === bin ? [...row, token] : row));
    });
  });
  const used = new Set(bins.flat());
  const bank = Array.from({ length: task.a }, (_, i) => i).filter((i) => !used.has(i));
  return (
    <HandsShell
      kind="story"
      fact={task.factKey}
      caption={task.speech}
      onDone={() => onAnswer(storyMatches(task, { groups: [], away: 0, bins }))}
    >
      <div className="ac-share" aria-label={show("Equal groups")}>
        {bins.map((row, index) => (
          <div
            key={index}
            ref={(el) => {
              binRefs.current[index] = el;
            }}
            className="ac-tray ac-share-bin"
            aria-label={`Group ${index + 1}`}
          >
            {row.length === 0 ? <span className="ac-tray-empty">{index + 1}</span> : null}
            {row.map((token) => (
              <button
                key={token}
                type="button"
                className="ac-coin-drag is-in ac-placed"
                aria-label={show("Take back")}
                onClick={() => setBins((current) => current.map((bin) => bin.filter((item) => item !== token)))}
              >
                <CastFace />
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="ac-bank">
        {bank.map((token) => (
          <button key={token} type="button" className="ac-coin-drag" data-piece="counter" aria-label={show("Drag into a group")} {...pointerProps(String(token))}>
            <CastFace />
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

function blankBoard(task: BlankTask): VariableBoard {
  const total =
    task.mode === "steps"
      ? task.extraOp === "+"
        ? task.a * task.b + task.c
        : task.a * task.b - task.c
      : task.op === "+"
        ? task.a + task.b
        : task.op === "-"
          ? task.a - task.b
          : task.op === "×"
            ? task.a * task.b
            : task.b === 0
              ? 0
              : task.a / task.b;
  return {
    game: "variables",
    mode: task.mode,
    op: task.op,
    extraOp: task.extraOp,
    a: task.a,
    b: task.b,
    c: task.c,
    box: task.box,
    left: task.box === "left" ? null : task.a,
    right: task.box === "right" ? null : task.b,
    result: task.box === "result" ? null : total,
    extra: task.mode === "steps" ? (task.box === "extra" ? null : task.c) : null,
  };
}

/** Drag one number into the empty box. A tap drops it too. */
export function BlankBoard({ task, onAnswer }: { task: BlankTask; onAnswer: (ok: boolean) => void }) {
  const [placed, setPlaced] = useState<number | null>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(wellRef.current, point.x, point.y)) return;
    setPlaced(Number(id));
  });
  const board = blankBoard(task);
  return (
    <HandsShell kind="blank" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(blankMatches(task, placed))}>
      <div ref={wellRef} className="ac-blank-well">
        <VariableEquation board={board} blankText={placed == null ? "" : String(placed)} />
        {placed == null ? null : (
          <button type="button" className="ac-num-clear" onClick={() => setPlaced(null)}>
            {show("Put back")}
          </button>
        )}
      </div>
      <div className="ac-num-bank" aria-label={show("Numbers")}>
        {task.tiles
          .filter((tile) => tile !== placed)
          .map((tile) => (
            <button key={tile} type="button" className="ac-num-drag" data-piece={String(tile)} aria-label={String(tile)} {...pointerProps(String(tile))}>
              {tile}
            </button>
          ))}
      </div>
      {ghost ? (
        <DragGhost x={ghost.x} y={ghost.y}>
          <span className="ac-num-drag is-ghost">{ghost.id}</span>
        </DragGhost>
      ) : null}
    </HandsShell>
  );
}
