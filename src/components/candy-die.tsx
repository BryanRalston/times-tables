import { cn } from "@/lib/utils";
import type { DieFace } from "@/lib/radial-web";

export function diePips(face: DieFace): { x: number; y: number }[] {
  switch (face) {
    case 1:
      return [{ x: 50, y: 50 }];
    case 2:
      return [
        { x: 30, y: 30 },
        { x: 70, y: 70 },
      ];
    case 3:
      return [
        { x: 28, y: 28 },
        { x: 50, y: 50 },
        { x: 72, y: 72 },
      ];
    default: {
      const _never: never = face;
      return _never;
    }
  }
}

export function KidDie({
  face,
  tumbling = false,
  empty = false,
  dock = false,
  onRoll,
  label,
}: {
  face: DieFace;
  tumbling?: boolean;
  empty?: boolean;
  dock?: boolean;
  onRoll?: () => void;
  label?: string;
}) {
  const pips = empty ? [] : diePips(face);
  const body = (
    <>
      {pips.map((p, i) => (
        <span key={i} className="candy-die-pip" style={{ left: `${p.x}%`, top: `${p.y}%` }} />
      ))}
    </>
  );
  const cls = cn(
    "candy-die",
    dock && "candy-die-dock",
    tumbling && (dock ? "candy-die-dock-tumble" : "candy-die-tumble"),
    empty && "candy-die-empty",
  );
  if (onRoll) {
    return (
      <button
        type="button"
        className={cls}
        data-path-die="1"
        data-dock-die="1"
        data-die-face={empty ? "0" : String(face)}
        data-die-tumble={tumbling ? "1" : "0"}
        data-die-empty={empty ? "1" : "0"}
        aria-label={label}
        disabled={empty}
        onClick={onRoll}
      >
        {body}
      </button>
    );
  }
  return (
    <div
      className={cls}
      data-path-die="1"
      data-die-face={empty ? "0" : String(face)}
      data-die-tumble={tumbling ? "1" : "0"}
      aria-hidden
    >
      {body}
    </div>
  );
}

export function DiePocket({ filled, max = 3 }: { filled: number; max?: number }) {
  const n = Math.max(0, Math.min(max, filled));
  return (
    <div className="candy-die-pocket" data-die-pocket={String(n)} aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={cn("candy-die-mini", i < n && "candy-die-mini-on")} data-die-mini={i < n ? "1" : "0"} />
      ))}
    </div>
  );
}
