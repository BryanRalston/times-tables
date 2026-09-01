import { useUi } from "@/components/chrome";
import { Mascot } from "@/components/mascot";
import { ART } from "@/lib/art";
import { QUARTERS, UNITS, unitWindowLabel } from "@/lib/curriculum";
import { unitStatus } from "@/lib/path";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function YearPath({ suggestedId, onOpen }: { suggestedId: string; onOpen: (id: string) => void }) {
  const sessions = useProgress((s) => s.sessions);
  const ui = useUi();
  const qName = [ui.q1, ui.q2, ui.q3, ui.q4];
  let lastQuarter = 0;

  return (
    <ol className="relative mx-auto max-w-lg overflow-x-hidden pb-8">
      <div className="absolute bottom-10 left-1/2 top-6 w-1.5 -translate-x-1/2 rounded-full bg-line" aria-hidden />
      {UNITS.map((u, i) => {
        const st = unitStatus(u, suggestedId);
        const done = Object.values(sessions).some((s) => s.unitId === u.id && s.completed);
        const q = QUARTERS.find((x) => x.id === u.quarter);
        const showQ = u.quarter !== lastQuarter;
        lastQuarter = u.quarter;
        const leftLabel = i % 2 === 1;
        return (
          <li key={u.id}>
            {showQ && q ? (
              <p className="relative z-10 mb-2 mt-6 text-center text-xs font-medium uppercase tracking-wide text-muted">
                {qName[q.id - 1] ?? q.name} · {q.span}
              </p>
            ) : null}
            <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-3">
              <div className={cn("text-right", !leftLabel && "invisible")}>
                <p className="font-display text-base leading-tight sm:text-lg">{u.short}</p>
                <p className="text-[11px] text-muted">{unitWindowLabel(u.id)}</p>
                {st === "now" ? <p className="text-xs font-medium text-teal">{ui.now}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => onOpen(u.id)}
                className={cn("relative grid place-items-center", st === "now" && "node-today")}
                aria-label={`${u.short}${st === "now" ? `, ${ui.now}` : ""}`}
              >
                <img src={ART.nodeOpen} alt="" draggable={false} className="h-[4.5rem] w-[4.5rem] object-contain sm:h-20 sm:w-20" />
                {done ? (
                  <span className="absolute -right-1 -top-1 text-lg text-star" aria-hidden>
                    ★
                  </span>
                ) : null}
                {st === "now" ? (
                  <Mascot pose="wave" size="sm" className="absolute -left-16 top-1/2 h-16 w-16 -translate-y-1/2 sm:-left-20 sm:h-20 sm:w-20" />
                ) : null}
              </button>
              <div className={cn("text-left", leftLabel && "invisible")}>
                <p className="font-display text-base leading-tight sm:text-lg">{u.short}</p>
                <p className="text-[11px] text-muted">{unitWindowLabel(u.id)}</p>
                {st === "now" ? <p className="text-xs font-medium text-teal">{ui.now}</p> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
