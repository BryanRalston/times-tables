import { AppHeader, AppTabs, useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { PokeToy } from "@/components/poke-toy";
import { Button } from "@/components/ui/button";
import { squisheePrice } from "@/lib/coins";
import { COMMON_SQUISHEES, RARE_SQUISHEES, squisheeSrc, type Squishee } from "@/lib/squishees";
import { playTap } from "@/lib/sound";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function ShelfPage() {
  const earned = useProgress((s) => s.squishees);
  const coins = useProgress((s) => s.coins);
  const buySquishee = useProgress((s) => s.buySquishee);
  const ui = useUi();
  const haveCommon = COMMON_SQUISHEES.filter((s) => earned.includes(s.id)).length;
  const haveRare = RARE_SQUISHEES.filter((s) => earned.includes(s.id)).length;

  function buy(id: string) {
    const r = buySquishee(id);
    if (r.ok) playTap();
  }

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pb-16 pt-4">
      <AppHeader />
      <AppTabs active="shelf" />
      <p className="mb-3 text-center text-sm font-medium text-teal">
        {ui.coins}: {coins}
      </p>
      <h2 className="font-display text-2xl">{ui.squisheeShelf}</h2>
      <p className="mb-4 text-sm text-muted">{ui.shelfBlurb(haveCommon, COMMON_SQUISHEES.length)}</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {COMMON_SQUISHEES.map((s) => (
          <ShopCard key={s.id} s={s} got={earned.includes(s.id)} coins={coins} onBuy={buy} />
        ))}
      </div>

      <h2 className="mt-8 font-display text-2xl">{ui.rareShelf}</h2>
      <p className="mb-4 text-sm text-muted">
        {ui.rareBlurb} {haveRare} / {RARE_SQUISHEES.length}
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {RARE_SQUISHEES.map((s) => (
          <ShopCard key={s.id} s={s} got={earned.includes(s.id)} coins={coins} onBuy={buy} />
        ))}
      </div>
    </div>
  );
}

export function ShopCard({
  s,
  got,
  coins,
  onBuy,
}: {
  s: Squishee;
  got: boolean;
  coins: number;
  onBuy: (id: string) => void;
}) {
  const ui = useUi();
  const price = squisheePrice(s.id);
  const canBuy = !got && coins >= price;
  return (
    <div
      className={cn(
        "frost flex flex-col items-center overflow-visible rounded-[20px] border p-2",
        got && s.rarity === "rare" ? "border-star shadow-soft" : "border-line",
        got && "shadow-soft",
      )}
    >
      {got ? (
        <PokeToy
          id={s.id}
          size="sm"
          className={cn("h-20 w-20 overflow-visible", s.rarity === "rare" && "rare-glow")}
        />
      ) : (
        <MagentaImg src={squisheeSrc(s.id)} alt="" className="pointer-events-none h-20 w-20" />
      )}
      <span className="mt-1 text-center text-xs font-medium">{s.name}</span>
      {s.rarity === "rare" ? <span className="text-[10px] font-medium text-star">{ui.rareBadge}</span> : null}
      {got ? null : (
        <Button
          size="sm"
          className="mt-2 h-9 w-full px-1 text-xs"
          disabled={!canBuy}
          title={canBuy ? undefined : ui.notEnough}
          onClick={() => onBuy(s.id)}
          aria-label={`${ui.buy}, ${price} ${ui.coins}`}
        >
          {ui.buy} · {price}
        </Button>
      )}
    </div>
  );
}
