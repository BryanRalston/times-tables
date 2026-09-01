import { useState } from "react";
import { AppHeader, AppTabs } from "@/components/chrome";
import { SQUISHEES, squisheeSrc } from "@/lib/squishees";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function ShelfPage() {
  const earned = useProgress((s) => s.squishees);
  const [poke, setPoke] = useState<string | null>(null);

  return (
    <div className="paper-grid mx-auto min-h-dvh max-w-xl px-4 pb-16 pt-4">
      <AppHeader />
      <AppTabs active="shelf" />
      <h2 className="font-display text-2xl">Squishee shelf</h2>
      <p className="mb-4 text-sm text-muted">
        Finish a walk or a lesson to earn a toy. Poke the ones you have — {earned.length} of {SQUISHEES.length}.
      </p>
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
                "flex flex-col items-center rounded-[20px] border border-line bg-surface p-2",
                got ? "shadow-soft" : "opacity-60",
              )}
              aria-label={got ? `Poke ${s.name}` : `${s.name}, locked`}
            >
              <img
                src={squisheeSrc(s.id)}
                alt=""
                className={cn(
                  "h-20 w-20 object-contain",
                  !got && "grayscale brightness-0 opacity-50",
                  poke === s.id && "squash",
                )}
                onAnimationEnd={() => setPoke(null)}
              />
              <span className="mt-1 text-xs font-medium">{got ? s.name : "???"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
