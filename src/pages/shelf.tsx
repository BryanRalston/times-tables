import { Check } from "lucide-react";
import { useState } from "react";
import { AppHeader, AppScene, AppTabs, useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { MysteryPresent } from "@/components/mystery-present";
import { PokeToy } from "@/components/poke-toy";
import { squisheePrice } from "@/lib/coins";
import {
  COSMETICS,
  canDressFace,
  cosmeticCompositeSrc,
  cosmeticLabel,
  isCosmeticFace,
  type Cosmetic,
} from "@/lib/cosmetics";
import { COMMON_SQUISHEES, RARE_SQUISHEES, pathHopperId, squisheeSrc, type Squishee } from "@/lib/squishees";
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
  hopperId,
  onBuy,
  onUse,
  blurb,
}: {
  title: string;
  mark: string;
  toys: Squishee[];
  earned: string[];
  coins: number;
  hopperId: string;
  onBuy: (id: string) => boolean | void;
  onUse: (id: string) => void;
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
            <ShopCard
              key={s.id}
              s={s}
              got={earned.includes(s.id)}
              coins={coins}
              hopperId={hopperId}
              onBuy={onBuy}
              onUse={onUse}
            />
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
  const chosen = useProgress((s) => s.hopperId);
  const cosmetics = useProgress((s) => s.cosmetics);
  const equipped = useProgress((s) => s.equippedCosmetic);
  const buySquishee = useProgress((s) => s.buySquishee);
  const buyCosmetic = useProgress((s) => s.buyCosmetic);
  const setHopperId = useProgress((s) => s.setHopperId);
  const equipCosmetic = useProgress((s) => s.equipCosmetic);
  const unequipCosmetic = useProgress((s) => s.unequipCosmetic);
  const ui = useUi();
  const hopperId = pathHopperId(earned, chosen);
  const recent = earned.length ? earned[earned.length - 1] : null;
  const recentToy = [...COMMON_SQUISHEES, ...RARE_SQUISHEES].find((s) => s.id === recent);

  function buy(id: string) {
    const r = buySquishee(id);
    if (r.ok) playTap();
    return r.ok;
  }

  function usePiece(id: string) {
    setHopperId(id);
    playTap();
  }

  return (
    <AppScene scene="shelf" tabs={<AppTabs active="shelf" />}>
      <AppHeader variant="shelf" title={ui.shelf} />
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <section className="shelf-avatar" data-avatar-picker="1">
          <h2 className="shelf-section">
            <span aria-hidden>★</span> {ui.yourPiece}
          </h2>
          <div className="shelf-avatar-row">
            <PokeToy
              id={hopperId}
              cosmetic={equipped}
              size="md"
              className="h-24 w-24"
            />
            <p className="shelf-blurb">{ui.usePiece}</p>
          </div>
        </section>
        {recentToy ? (
          <div className="shelf-recent" data-shelf-recent="1">
            <ShopCard
              s={recentToy}
              got
              coins={coins}
              hopperId={hopperId}
              onBuy={buy}
              onUse={usePiece}
              featured
            />
          </div>
        ) : null}
        <Plank
          title={ui.commons}
          mark="★"
          toys={COMMON_SQUISHEES}
          earned={earned}
          coins={coins}
          hopperId={hopperId}
          onBuy={buy}
          onUse={usePiece}
        />
        <section className="shelf-plank" data-shelf-dress="1">
          <h2 className="shelf-section">
            <span aria-hidden>◇</span> {ui.dressUp}
          </h2>
          <div className="plank-rail">
            <div className="plank-board">
              {COSMETICS.map((item) => (
                <CosmeticCard
                  key={item.id}
                  item={item}
                  got={cosmetics.includes(item.id)}
                  worn={equipped === item.id}
                  coins={coins}
                  previewFace={isCosmeticFace(hopperId) ? hopperId : "peach"}
                  onBuy={() => {
                    const r = buyCosmetic(item.id);
                    if (r.ok) playTap();
                    return r.ok;
                  }}
                  onWear={() => {
                    if (equipCosmetic(item.id)) playTap();
                  }}
                  onUnequip={() => {
                    unequipCosmetic();
                    playTap();
                  }}
                />
              ))}
              <EmptyPad />
            </div>
          </div>
        </section>
        <Plank
          title={ui.rares}
          mark="◇"
          toys={RARE_SQUISHEES}
          earned={earned}
          coins={coins}
          hopperId={hopperId}
          onBuy={buy}
          onUse={usePiece}
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
  hopperId,
  onBuy,
  onUse,
  cheer = false,
  featured = false,
}: {
  s: Squishee;
  got: boolean;
  coins: number;
  hopperId?: string;
  onBuy: (id: string) => boolean | void;
  onUse?: (id: string) => void;
  cheer?: boolean;
  featured?: boolean;
}) {
  const ui = useUi();
  const equipped = useProgress((s) => s.equippedCosmetic);
  const [justBought, setJustBought] = useState(cheer);
  const findOnly = s.rarity === "rare";
  const price = squisheePrice(s.id);
  const canBuy = !got && !findOnly && coins >= price;
  const playCheer = justBought;
  const isHopper = got && hopperId === s.id;
  const dress = isHopper && canDressFace(s.id, equipped) ? equipped : "";

  const toy = got ? (
    <PokeToy
      id={s.id}
      cosmetic={dress}
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

  const useBtn =
    got && onUse ? (
      <button
        type="button"
        className={cn("shelf-use", isHopper && "shelf-use-on")}
        data-use-piece={s.id}
        data-playing-as={isHopper ? "1" : "0"}
        onClick={() => onUse(s.id)}
      >
        {isHopper ? ui.playingAs : ui.usePiece}
      </button>
    ) : null;

  const meta = got ? (
    <>
      <span className="mt-1 text-center text-xs font-bold text-plum">{s.name}</span>
      <span className="owned-pill">
        <Check className="size-3.5" strokeWidth={3} />
        {ui.owned}
      </span>
      {useBtn}
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

function CosmeticCard({
  item,
  got,
  worn,
  coins,
  previewFace,
  onBuy,
  onWear,
  onUnequip,
}: {
  item: Cosmetic;
  got: boolean;
  worn: boolean;
  coins: number;
  previewFace: string;
  onBuy: () => boolean | void;
  onWear: () => void;
  onUnequip: () => void;
}) {
  const ui = useUi();
  const name = cosmeticLabel(item.id, ui);
  const canBuy = !got && coins >= item.price;
  return (
    <div className="shelf-slot" data-cosmetic-card={item.id} data-cosmetic-worn={worn ? "1" : "0"}>
      <MagentaImg
        src={cosmeticCompositeSrc(previewFace, item.id)}
        alt=""
        className="h-20 w-20 object-contain"
      />
      <span className="mt-1 text-center text-xs font-bold text-plum">{name}</span>
      {got ? (
        <button
          type="button"
          className={cn("shelf-use", worn && "shelf-use-on")}
          data-wear={item.id}
          onClick={worn ? onUnequip : onWear}
        >
          {worn ? ui.unequip : ui.wearThis}
        </button>
      ) : (
        <button
          type="button"
          className="shelf-price"
          disabled={!canBuy}
          title={canBuy ? undefined : ui.notEnough}
          data-buy-cosmetic={item.id}
          onClick={() => onBuy()}
          aria-label={`${ui.buy}, ${item.price} ${ui.coins}`}
        >
          <span className="coin-face !h-4 !w-4 text-[0.55rem]" aria-hidden />
          {item.price}
        </button>
      )}
    </div>
  );
}
