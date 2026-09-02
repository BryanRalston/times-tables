import { useUi } from "@/components/chrome";
import { PokeToy } from "@/components/poke-toy";
import { Button } from "@/components/ui/button";
import { MISSING_ADDEND_PRICE } from "@/lib/coins";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function PathPage() {
  const ui = useUi();
  const coins = useProgress((s) => s.coins);
  const loud = coins >= MISSING_ADDEND_PRICE;

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8" data-leftover-path="1">
      <p className="text-center text-xs font-medium uppercase tracking-wide text-muted">{ui.grade3}</p>
      <h1 className="text-center font-display text-3xl">{ui.path}</h1>
      <p className="mt-6 text-center text-sm text-muted">
        {ui.coins}: {coins}
      </p>

      <button
        type="button"
        className="mt-8 w-full rounded-[20px] border border-line px-4 py-3 text-left text-muted"
        onClick={() => navigate({ id: "play", kind: "activity", activityId: "u1-leftover" })}
      >
        <span className="block text-xs font-medium uppercase tracking-wide">{ui.replay}</span>
        <span className="font-display text-xl text-ink">{ui.numberSense}</span>
      </button>

      <Button
        className={cn("mt-4 w-full", !loud && "opacity-90")}
        size="lg"
        onClick={() => navigate({ id: "play", kind: "activity", activityId: "u1-friends" })}
      >
        <span className="flex w-full items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <PokeToy id="cat" size="sm" className="h-14 w-14" />
            <span className="font-display text-2xl">{ui.missingAddend}</span>
          </span>
          <span className="font-display text-4xl tabular-nums">{MISSING_ADDEND_PRICE}</span>
        </span>
      </Button>

      <p className="mt-10 text-center text-xs text-faint">
        <button type="button" className="text-muted" onClick={() => navigate({ id: "home" })}>
          {ui.home}
        </button>
      </p>
    </div>
  );
}
