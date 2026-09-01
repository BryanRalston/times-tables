import { useState } from "react";
import { AppHeader, AppTabs, useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { SQUISHEES, squisheeSrc } from "@/lib/squishees";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function ShelfPage() {
  const earned = useProgress((s) => s.squishees);
  const [poke, setPoke] = useState<string | null>(null);
  const ui = useUi();

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pb-16 pt-4">
      <AppHeader />
      <AppTabs active="shelf" />
      <h2 className="font-display text-2xl">{ui.squisheeShelf}</h2>
      <p className="mb-4 text-sm text-muted">{ui.shelfBlurb(earned.length, SQUISHEES.length)}</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {SQUISHEES.map((s) => {
          const got = earned.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              disabled={!got}
              onClick={() => {
                if (!got) return;
                setPoke(s.id);
              }}
              className={cn(
                "frost flex flex-col items-center rounded-[20px] border border-line p-2",
                got ? "shadow-soft" : "opacity-60",
              )}
              aria-label={got ? `Poke ${s.name}` : `${s.name}, locked`}
            >
              <span className={cn("block", poke === s.id && "squash")} onAnimationEnd={() => setPoke(null)}>
                <MagentaImg
                  src={squisheeSrc(s.id)}
                  alt=""
                  className={cn("h-20 w-20", !got && "grayscale brightness-0 opacity-50")}
                />
              </span>
              <span className="mt-1 text-xs font-medium">{got ? s.name : "???"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
