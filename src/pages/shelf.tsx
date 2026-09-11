import { Check } from "lucide-react";
import { useState } from "react";
import { AppHeader, AppScene, AppTabs, useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { MysteryPresent } from "@/components/mystery-present";
import { PokeToy } from "@/components/poke-toy";
import { squisheePrice } from "@/lib/coins";
import { COMMON_SQUISHEES, RARE_SQUISHEES, squisheeSrc, type Squishee } from "@/lib/squishees";
import { playTap } from "@/lib/sound";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

function EmptyPad() {
  return <span className="shelf-slot shelf-empty" data-shelf-empty="1" aria-hidden />;
}

function Plank({
  title,
  mark,
  toys,
  earned,
  coins,
  onBuy,
  blurb,
}: {
  title: string;
  mark: string;
  toys: Squishee[];
  earned: string[];
  coins: number;
  onBuy: (id: string) => boolean | void;
  blurb?: string;
}) {
  return (
    <section className="shelf-plank" data-shelf-plank="1">
      <h2 className="shelf-section">
        <span aria-hidden>{mark}</span> {title}
      </h2>
      {blurb ? <p className="shelf-blurb">{blurb}</p> : null}
      <div className="plank-rail">
        <div className="plank-board">
          {toys.map((s) => (
            <ShopCard key={s.id} s={s} got={earned.includes(s.id)} coins={coins} onBuy={onBuy} />
          ))}
          <EmptyPad />
          <EmptyPad />
        </div>
      </div>
    </section>
  );
}

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
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {recentToy ? (
          <div className="shelf-recent" data-shelf-recent="1">
            <ShopCard s={recentToy} got coins={coins} onBuy={buy} featured />
          </div>
        ) : null}
        <Plank title={ui.commons} mark="★" toys={COMMON_SQUISHEES} earned={earned} coins={coins} onBuy={buy} />
        <Plank
          title={ui.rares}
          mark="◇"
          toys={RARE_SQUISHEES}
          earned={earned}
          coins={coins}
          onBuy={buy}
          blurb={ui.rareBlurb}
        />
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
  const findOnly = s.rarity === "rare";
  const price = squisheePrice(s.id);
  const canBuy = !got && !findOnly && coins >= price;
  const playCheer = justBought;

  const toy = got ? (
    <PokeToy
      id={s.id}
      size="sm"
      cheer={playCheer}
      onCheerEnd={() => setJustBought(false)}
      className={cn("h-20 w-20 overflow-visible", s.rarity === "rare" && "rare-glow")}
    />
  ) : findOnly ? (
    <span data-rare-find="1" className="grid h-20 w-20 place-items-center" aria-hidden>
      <MysteryPresent size="shelf" />
    </span>
  ) : (
    <span data-silhouette="1" className="grid h-20 w-20 place-items-center" aria-hidden>
      <MagentaImg src={squisheeSrc(s.id)} alt="" className="squishee-silhouette pointer-events-none h-20 w-20" />
    </span>
  );

  const meta = got ? (
    <>
      <span className="mt-1 text-center text-xs font-bold text-plum">{s.name}</span>
      <span className="owned-pill">
        <Check className="size-3.5" strokeWidth={3} />
        {ui.owned}
      </span>
    </>
  ) : findOnly ? (
    <>
      <span className="mt-1 text-center text-xs font-bold text-plum">{ui.mystery}</span>
      <span className="shelf-find">{ui.findOnMap}</span>
    </>
  ) : (
    <>
      <span className="mt-1 text-center text-xs font-bold text-plum">{ui.mystery}</span>
      <span className="shelf-price">
        <span className="coin-face !h-4 !w-4 text-[0.55rem]" aria-hidden />
        {price}
      </span>
    </>
  );

  if (got || findOnly) {
    return (
      <div
        className={cn("shelf-slot", featured && "shelf-slot-featured", got && s.rarity === "rare" && "rare-glow")}
        data-rare-locked={findOnly && !got ? "1" : undefined}
      >
        {toy}
        {meta}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn("shelf-slot", featured && "shelf-slot-featured")}
      disabled={!canBuy}
      title={canBuy ? undefined : ui.notEnough}
      onClick={() => {
        if (onBuy(s.id)) setJustBought(true);
      }}
      aria-label={`${ui.buy}, ${price} ${ui.coins}`}
    >
      {toy}
      {meta}
    </button>
  );
}
