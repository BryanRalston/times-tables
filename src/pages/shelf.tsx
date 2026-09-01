import { useState } from "react";
import { AppHeader, AppTabs, useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { SquashOnPoke } from "@/components/poke-toy";
import { COMMON_SQUISHEES, RARE_SQUISHEES, squisheeSrc } from "@/lib/squishees";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function ShelfPage() {
  const earned = useProgress((s) => s.squishees);
  const [poke, setPoke] = useState<string | null>(null);
  const ui = useUi();
  const haveCommon = COMMON_SQUISHEES.filter((s) => earned.includes(s.id)).length;
  const haveRare = RARE_SQUISHEES.filter((s) => earned.includes(s.id)).length;

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pb-16 pt-4">
      <AppHeader />
      <AppTabs active="shelf" />
      <h2 className="font-display text-2xl">{ui.squisheeShelf}</h2>
      <p className="mb-4 text-sm text-muted">{ui.shelfBlurb(haveCommon, COMMON_SQUISHEES.length)}</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {COMMON_SQUISHEES.map((s) => {
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
              <SquashOnPoke active={poke === s.id} onRest={() => setPoke(null)}>
                <MagentaImg
                  src={squisheeSrc(s.id)}
                  alt=""
                  className={cn("h-20 w-20", !got && "grayscale brightness-0 opacity-50")}
                />
              </SquashOnPoke>
              <span className="mt-1 text-xs font-medium">{got ? s.name : "???"}</span>
            </button>
          );
        })}
      </div>

      <h2 className="mt-8 font-display text-2xl">{ui.rareShelf}</h2>
      <p className="mb-4 text-sm text-muted">
        {ui.rareBlurb} {haveRare} / {RARE_SQUISHEES.length}
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {RARE_SQUISHEES.map((s) => {
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
                "frost flex flex-col items-center rounded-[20px] border p-2",
                got ? "border-star shadow-soft" : "border-line opacity-70",
              )}
              aria-label={got ? `Poke ${s.name}` : ui.rareHint(s.id)}
            >
              <SquashOnPoke
                active={poke === s.id}
                className={got ? "rare-glow" : undefined}
                onRest={() => setPoke(null)}
              >
                <MagentaImg
                  src={squisheeSrc(s.id)}
                  alt=""
                  className={cn("h-20 w-20", !got && "grayscale brightness-0 opacity-40")}
                />
              </SquashOnPoke>
              <span className="mt-1 text-center text-xs font-medium">{got ? s.name : "???"}</span>
              {!got ? <span className="mt-1 text-center text-[10px] leading-tight text-muted">{ui.rareHint(s.id)}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
