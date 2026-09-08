import { Check } from "lucide-react";
import { useState } from "react";
import { AppHeader, AppScene, AppTabs, useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { PokeToy } from "@/components/poke-toy";
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
  const recent = earned.length ? earned[earned.length - 1] : null;
  const recentToy = [...COMMON_SQUISHEES, ...RARE_SQUISHEES].find((s) => s.id === recent);

  function buy(id: string) {
    const r = buySquishee(id);
    if (r.ok) playTap();
    return r.ok;
  }

  return (
    <AppScene scene="shelf" tabs={<AppTabs active="shelf" />}>
      <AppHeader variant="shelf" title={ui.shelf} />
      <div className="flex-1 overflow-y-auto px-4 pb-3">
        {recentToy ? (
          <div className="mb-2 flex justify-center">
            <ShopCard s={recentToy} got coins={coins} onBuy={buy} featured />
          </div>
        ) : null}
        <h2 className="shelf-section">
          <span aria-hidden>★</span> {ui.commons}
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {COMMON_SQUISHEES.map((s) => (
            <ShopCard key={s.id} s={s} got={earned.includes(s.id)} coins={coins} onBuy={buy} />
          ))}
        </div>
        <h2 className="shelf-section">
          <span aria-hidden>◇</span> {ui.rares}
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {RARE_SQUISHEES.map((s) => (
            <ShopCard key={s.id} s={s} got={earned.includes(s.id)} coins={coins} onBuy={buy} />
          ))}
        </div>
      </div>
    </AppScene>
  );
}

export function ShopCard({
  s,
  got,
  coins,
  onBuy,
  cheer = false,
  featured = false,
}: {
  s: Squishee;
  got: boolean;
  coins: number;
  onBuy: (id: string) => boolean | void;
  cheer?: boolean;
  featured?: boolean;
}) {
  const ui = useUi();
  const [justBought, setJustBought] = useState(cheer);
  const price = squisheePrice(s.id);
  const canBuy = !got && coins >= price;
  const playCheer = justBought;
  return (
    <div className={cn("shelf-card", featured && "w-40", got && s.rarity === "rare" && "rare-glow")}>
      {got ? (
        <PokeToy
          id={s.id}
          size="sm"
          cheer={playCheer}
          onCheerEnd={() => setJustBought(false)}
          className={cn("h-20 w-20 overflow-visible", s.rarity === "rare" && "rare-glow")}
        />
      ) : (
        <span data-silhouette="1" className="grid h-20 w-20 place-items-center" aria-hidden>
          <MagentaImg src={squisheeSrc(s.id)} alt="" className="squishee-silhouette pointer-events-none h-20 w-20" />
        </span>
      )}
      <span className="mt-1 text-center text-xs font-bold text-plum">{got ? s.name : ui.mystery}</span>
      {got ? (
        <span className="owned-pill">
          <Check className="size-3.5" strokeWidth={3} />
          {ui.owned}
        </span>
      ) : (
        <button
          type="button"
          className="shelf-price"
          disabled={!canBuy}
          title={canBuy ? undefined : ui.notEnough}
          onClick={() => {
            if (onBuy(s.id)) setJustBought(true);
          }}
          aria-label={`${ui.buy}, ${price} ${ui.coins}`}
        >
          <span className="coin-face !h-4 !w-4 text-[0.55rem]" aria-hidden />
          {price}
        </button>
      )}
    </div>
  );
}
