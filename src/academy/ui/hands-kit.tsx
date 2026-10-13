import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { squisheeById } from "@/lib/squishees";
import { show } from "../i18n";
import { squisheeUrl } from "../paths";
import { useCast } from "./round-cast";

export function inside(el: HTMLElement | null, x: number, y: number): boolean {
  if (!el) return false;
  const box = el.getBoundingClientRect();
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
}

export function DragGhost({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div className="ac-drag-ghost" style={{ left: x, top: y }} aria-hidden="true">
      {children}
    </div>
  );
}

/** Pointer drag with a tap fallback. Movement under 8px counts as a tap. */
export function useTrayDrag(onPlace: (id: string, point: { x: number; y: number }, tapped: boolean) => void) {
  const placeRef = useRef(onPlace);
  placeRef.current = onPlace;
  const drag = useRef<{ id: string; x: number; y: number; lastX: number; lastY: number; moved: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number } | null>(null);

  function finish(id: string, x: number, y: number, tapped: boolean) {
    const current = drag.current;
    if (!current || current.id !== id) return;
    drag.current = null;
    setGhost(null);
    placeRef.current(id, { x, y }, tapped);
  }

  function pointerProps(id: string) {
    return {
      onPointerDown(event: ReactPointerEvent<HTMLElement>) {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { id, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
        setGhost({ id, x: event.clientX, y: event.clientY });
      },
      onPointerMove(event: ReactPointerEvent<HTMLElement>) {
        const current = drag.current;
        if (!current || current.id !== id) return;
        if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 8) current.moved = true;
        current.lastX = event.clientX;
        current.lastY = event.clientY;
        setGhost({ id, x: event.clientX, y: event.clientY });
      },
      onPointerUp(event: ReactPointerEvent<HTMLElement>) {
        finish(id, event.clientX, event.clientY, !drag.current?.moved);
      },
      onPointerCancel(event: ReactPointerEvent<HTMLElement>) {
        const current = drag.current;
        if (!current || current.id !== id) return;
        const x = event.clientX || current.lastX;
        const y = event.clientY || current.lastY;
        finish(id, x, y, !current.moved);
      },
      onKeyDown(event: KeyboardEvent<HTMLElement>) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        placeRef.current(id, { x: 0, y: 0 }, true);
      },
    };
  }

  return { ghost, pointerProps };
}

export function HandsShell({
  kind,
  fact,
  caption,
  total,
  children,
  onDone,
}: {
  kind: string;
  fact: string;
  caption: string;
  total?: string;
  children: ReactNode;
  onDone: () => void;
}) {
  return (
    <div className="ac-hands" data-hands={kind} data-fact={fact}>
      <p className="ac-hands-cap">{caption}</p>
      {children}
      {total ? (
        <p className="ac-hands-sum" aria-live="polite">
          {total}
        </p>
      ) : null}
      <button type="button" className="ac-go" onClick={onDone}>
        {show("Done")}
      </button>
    </div>
  );
}

export function CastFace({ who = "buddy" }: { who?: "buddy" | "host" }) {
  const cast = useCast();
  const id = who === "host" ? (cast?.hostId ?? "frog") : (cast?.buddyId ?? "peach");
  const squishee = squisheeById(id);
  if (!squishee) return <i className="ac-dot is-pink" />;
  return <img className="ac-token" src={squisheeUrl(squishee.file)} alt="" draggable={false} />;
}

export function RowDots({ n }: { n: number }) {
  return (
    <span className="ac-row-dots" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}

export function BlockPile({ hundreds = 0, tens = 0, ones = 0 }: { hundreds?: number; tens?: number; ones?: number }) {
  return (
    <div className="ac-base" aria-hidden="true">
      {Array.from({ length: hundreds }, (_, i) => (
        <i key={`h${i}`} className="ac-flat" />
      ))}
      {Array.from({ length: tens }, (_, i) => (
        <i key={`t${i}`} className="ac-rod" />
      ))}
      <span className="ac-ones">
        {Array.from({ length: ones }, (_, i) => (
          <i key={`o${i}`} className="ac-dot is-pink" />
        ))}
      </span>
    </div>
  );
}
