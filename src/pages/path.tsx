import { AppHeader, AppScene, AppTabs, WalkMark, useUi } from "@/components/chrome";
import { MISSING_ADDEND_PRICE } from "@/lib/coins";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function PathPage() {
  const ui = useUi();
  const coins = useProgress((s) => s.coins);
  const loud = coins >= MISSING_ADDEND_PRICE;

  return (
    <AppScene scene="hills" tabs={<AppTabs active="home" />}>
      <AppHeader />
      <div className="px-4 pt-2" data-leftover-path="1">
        <button
          type="button"
          className="ghost-replay"
          onClick={() => navigate({ id: "play", kind: "activity", activityId: "u1-leftover" })}
        >
          {ui.replay} · {ui.numberSense}
        </button>
      </div>
      <section className="continue-card">
        <WalkMark />
        <h2 className="font-display text-[1.65rem] font-semibold leading-tight text-ink">{ui.missingAddend}</h2>
        <p className="mt-1 text-sm font-semibold text-muted">
          {ui.coins} · {MISSING_ADDEND_PRICE}
        </p>
        <button
          type="button"
          className={cn("start-loud", !loud && "opacity-90")}
          onClick={() => navigate({ id: "play", kind: "activity", activityId: "u1-friends" })}
        >
          {ui.start}
        </button>
      </section>
      <button type="button" className="all-units" onClick={() => navigate({ id: "lessons" })}>
        {ui.allUnits}
      </button>
    </AppScene>
  );
}
