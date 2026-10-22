import { useRef, useState } from "react";
import { show, t } from "../i18n";
import type { LetterTask, PhonicsTask, SightTask } from "../hands-build";
import { lettersMatch, phonicsMatches, sightMatches } from "../hands-build";
import { cx } from "./bits";
import { DragGhost, HandsShell, inside, useTrayDrag } from "./hands-kit";

function labelOf(tiles: { id: string; label: string }[], id: string): string {
  return tiles.find((tile) => tile.id === id)?.label ?? "";
}

export function LetterBoard({ task, onAnswer }: { task: LetterTask; onAnswer: (ok: boolean) => void }) {
  const [placed, setPlaced] = useState<string[]>([]);
  const slotRef = useRef<HTMLDivElement>(null);
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(slotRef.current, point.x, point.y)) return;
    setPlaced((current) => (current.includes(id) || current.length >= task.word.length ? current : [...current, id]));
  });
  const pool = task.tiles.filter((tile) => !placed.includes(tile.id));
  const built = placed.map((id) => labelOf(task.tiles, id));
  return (
    <HandsShell kind="letters" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(lettersMatch(task, built))}>
      {task.showSentence ? <p className="ac-fill-sentence">{task.sentence}</p> : null}
      <div ref={slotRef} className="ac-slots" aria-label={show("Letter spots")}>
        {Array.from({ length: task.word.length }, (_, index) => {
          const id = placed[index];
          const letter = id ? labelOf(task.tiles, id) : "";
          return (
            <button
              key={id ?? `empty-${index}`}
              type="button"
              className={cx("ac-slot", !id && "is-empty", id && "ac-placed")}
              disabled={!id}
              aria-label={id ? t(`Remove ${letter}`, `Quita ${letter}`, `Tire ${letter}`, `Enlève ${letter}`, `拿走${letter}`, `${letter} हटाओ`) : show("Empty spot")}
              onClick={() => id && setPlaced((current) => current.filter((item) => item !== id))}
            >
              {id ? labelOf(task.tiles, id) : ""}
            </button>
          );
        })}
      </div>
      <div className="ac-tiles" aria-label={show("Letters")}>
        {pool.map((tile) => (
          <button key={tile.id} type="button" className="ac-tile" data-piece={tile.label} aria-label={t(`Letter ${tile.label}`, `Letra ${tile.label}`, `Letra ${tile.label}`, `Lettre ${tile.label}`, `字母${tile.label}`, `अक्षर ${tile.label}`)} {...pointerProps(tile.id)}>
            {tile.label}
          </button>
        ))}
      </div>
      {ghost ? <DragGhost x={ghost.x} y={ghost.y}><span className="ac-tile">{labelOf(task.tiles, ghost.id)}</span></DragGhost> : null}
    </HandsShell>
  );
}

export function SightBoard({ task, onAnswer }: { task: SightTask; onAnswer: (ok: boolean) => void }) {
  const [placed, setPlaced] = useState<string | null>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(wellRef.current, point.x, point.y)) return;
    setPlaced(id);
  });
  return (
    <HandsShell kind="sight" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(sightMatches(task, placed))}>
      {task.mode === "picture" ? <p className="ac-sight-emoji" aria-hidden="true">{task.emoji}</p> : <p className="ac-fill-sentence">{task.sentence}</p>}
      <div ref={wellRef} className="ac-tray ac-word-well" aria-label={show("Drop the word")}>
        {placed ? (
          <button type="button" className="ac-tile is-in ac-placed" aria-label={t(`Remove ${placed}`, `Quita ${placed}`, `Tire ${placed}`, `Enlève ${placed}`, `拿走${placed}`, `${placed} हटाओ`)} onClick={() => setPlaced(null)}>
            {placed}
          </button>
        ) : (
          <span className="ac-tray-empty">{show("Drag the word")}</span>
        )}
      </div>
      <div className="ac-tiles" aria-label={show("Words")}>
        {task.choices.filter((word) => word !== placed).map((word) => (
          <button key={word} type="button" className="ac-tile ac-word-tile" data-piece={word} aria-label={word} {...pointerProps(word)}>
            {word}
          </button>
        ))}
      </div>
      {ghost ? <DragGhost x={ghost.x} y={ghost.y}><span className="ac-tile ac-word-tile">{ghost.id}</span></DragGhost> : null}
    </HandsShell>
  );
}

export function PhonicsBoard({ task, onAnswer }: { task: PhonicsTask; onAnswer: (ok: boolean) => void }) {
  const blend = task.mode === "blend";
  const [placed, setPlaced] = useState<string[]>([]);
  const slotRef = useRef<HTMLDivElement>(null);
  const limit = blend ? task.answer.length : 1;
  const { ghost, pointerProps } = useTrayDrag((id, point, tapped) => {
    if (!tapped && !inside(slotRef.current, point.x, point.y)) return;
    setPlaced((current) => (current.includes(id) || current.length >= limit ? current : [...current, id]));
  });
  const labels = placed.map((id) => labelOf(task.tiles, id));
  const pool = task.tiles.filter((tile) => !placed.includes(tile.id));
  return (
    <HandsShell kind="phonics" fact={task.factKey} caption={task.speech} onDone={() => onAnswer(phonicsMatches(task, labels))}>
      {task.mode === "letter" ? <p className="ac-sight-emoji" aria-hidden="true">{task.prompt}</p> : null}
      {task.mode === "rhyme" ? <p className="ac-sight-word">{task.prompt}</p> : null}
      <div ref={slotRef} className="ac-slots" aria-label={blend ? show("Build the word") : show("Drop the tile")}>
        {task.mode === "end"
          ? task.prompt.split("").map((letter, index) => (
              <span key={`${letter}-${index}`} className="ac-slot is-lock">
                {letter}
              </span>
            ))
          : null}
        {Array.from({ length: limit }, (_, index) => {
          const id = placed[index];
          const label = id ? labelOf(task.tiles, id) : "";
          return (
            <button
              key={id ?? `empty-${index}`}
              type="button"
              className={cx("ac-slot", !id && "is-empty", id && "ac-placed")}
              disabled={!id}
              aria-label={id ? t(`Remove ${label}`, `Quita ${label}`, `Tire ${label}`, `Enlève ${label}`, `拿走${label}`, `${label} हटाओ`) : show("Empty spot")}
              onClick={() => id && setPlaced((current) => current.filter((item) => item !== id))}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="ac-tiles">
        {pool.map((tile) => (
          <button key={tile.id} type="button" className="ac-tile" data-piece={tile.label} aria-label={tile.label} {...pointerProps(tile.id)}>
            {tile.label}
          </button>
        ))}
      </div>
      {ghost ? <DragGhost x={ghost.x} y={ghost.y}><span className="ac-tile">{labelOf(task.tiles, ghost.id)}</span></DragGhost> : null}
    </HandsShell>
  );
}
