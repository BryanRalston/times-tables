import { Check } from "lucide-react";
import { useState } from "react";
import { AppHeader, AppScene, AppTabs, useUi } from "@/components/chrome";
import type { Ui } from "@/lib/i18n";
import { DressedSquishee } from "@/components/dressed-squishee";
import { MagentaImg } from "@/components/magenta-video";
import { MysteryPresent } from "@/components/mystery-present";
import { PokeToy } from "@/components/poke-toy";
import { squisheePrice } from "@/lib/coins";
import { COSMETICS, cosmeticById, cosmeticSrc, type Cosmetic } from "@/lib/cosmetics";
import { playTap } from "@/lib/sound";
import { useProgress } from "@/lib/progress";
import { avatarOf, COMMON_SQUISHEES, RARE_SQUISHEES, squisheeById, squisheeSrc, STARTER_AVATAR, type Squishee } from "@/lib/squishees";
import { cn } from "@/lib/utils";

function EmptyPad() {
  return <span className="shelf-slot shelf-empty" data-shelf-empty="1" aria-hidden />;
}

function cosmeticLabel(ui: Ui, id: string): string {
  switch (id) {
    case "hat-party":
      return ui.partyHat;
    case "beanie":
      return ui.beanie;
    case "bow":
      return ui.bow;
    case "scarf":
      return ui.scarf;
    case "glasses":
      return ui.glasses;
    default:
      return cosmeticById(id)?.name ?? id;
  }
}

function Plank({
  title,
  mark,
  toys,
  earned,
  coins,
  onBuy,
  onPick,
  avatarId,
  blurb,
}: {
  title: string;
  mark: string;
  toys: Squishee[];
  earned: string[];
  coins: number;
  onBuy: (id: string) => boolean | void;
  onPick?: (id: string) => void;
  avatarId?: string;
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
              onBuy={onBuy}
              onPick={onPick}
              isAvatar={avatarId === s.id}
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
  const buySquishee = useProgress((s) => s.buySquishee);
  const setAvatar = useProgress((s) => s.setAvatar);
  const buyCosmetic = useProgress((s) => s.buyCosmetic);
  const equipCosmetic = useProgress((s) => s.equipCosmetic);
  const avatarId = avatarOf(earned, useProgress((s) => s.avatarId));
  const ownedCosmetics = useProgress((s) => s.ownedCosmetics);
  const equipped = useProgress((s) => s.equippedCosmetics);
  const ui = useUi();
  const recent = earned.length ? earned[earned.length - 1] : null;
  const recentToy = [...COMMON_SQUISHEES, ...RARE_SQUISHEES].find((s) => s.id === recent);
  const peach = squisheeById(STARTER_AVATAR)!;
  const pickable = [
    peach,
    ...earned
      .map((id) => squisheeById(id))
      .filter((s): s is Squishee => s != null && s.id !== STARTER_AVATAR),
  ];
  const seen = new Set<string>();
  const faces = pickable.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  function buy(id: string) {
    const r = buySquishee(id);
    if (r.ok) playTap();
    return r.ok;
  }

  function pick(id: string) {
    if (setAvatar(id)) playTap();
  }

  return (
    <AppScene scene="shelf" tabs={<AppTabs active="shelf" />}>
      <AppHeader variant="shelf" title={ui.shelf} />
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <section className="avatar-picker" data-avatar-picker="1">
          <h2 className="shelf-section">
            <span aria-hidden>☺</span> {ui.thatsMe}
          </h2>
          <p className="shelf-blurb">{ui.pickSquishee}</p>
          <div className="avatar-hero" data-avatar-hero="1">
            <DressedSquishee id={avatarId} equipped={equipped} className="avatar-hero-face" />
          </div>
          <div className="plank-rail">
            <div className="plank-board">
              {faces.map((s) => {
                const pressed = avatarId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={cn("shelf-slot", pressed && "shelf-slot-avatar")}
                    data-avatar-pick={s.id}
                    aria-pressed={pressed}
                    aria-label={pressed ? `${ui.thatsMe}, ${s.name}` : `${ui.pickSquishee}, ${s.name}`}
                    onClick={() => pick(s.id)}
                  >
                    <MagentaImg src={squisheeSrc(s.id)} alt="" className="pointer-events-none h-16 w-16" />
                    <span className="mt-1 text-center text-xs font-bold text-plum">{s.name}</span>
                    {pressed ? (
                      <span className="owned-pill">
                        <Check className="size-3.5" strokeWidth={3} />
                        {ui.thatsMe}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        <section className="shelf-plank" data-cosmetics-plank="1">
          <h2 className="shelf-section">
            <span aria-hidden>★</span> {ui.dressUp}
          </h2>
          <p className="shelf-blurb">{ui.dressUpBlurb}</p>
          <div className="plank-rail">
            <div className="plank-board">
              {COSMETICS.map((c) => (
                <CosmeticCard
                  key={c.id}
                  item={c}
                  label={cosmeticLabel(ui, c.id)}
                  coins={coins}
                  owned={ownedCosmetics.includes(c.id)}
                  equipped={equipped[c.slot] === c.id}
                  onBuy={() => {
                    const r = buyCosmetic(c.id);
                    if (r.ok) playTap();
                    return r.ok;
                  }}
                  onEquip={() => {
                    const r = equipCosmetic(c.id);
                    if (r.ok) playTap();
                  }}
                  buyLabel={ui.buy}
                  wearLabel={ui.wearIt}
                  offLabel={ui.takeOff}
                  coinsLabel={ui.coins}
                  notEnough={ui.notEnough}
                />
              ))}
              <EmptyPad />
            </div>
          </div>
        </section>
        {recentToy ? (
          <div className="shelf-recent" data-shelf-recent="1">
            <ShopCard s={recentToy} got coins={coins} onBuy={buy} onPick={pick} isAvatar={avatarId === recentToy.id} featured />
          </div>
        ) : null}
        <Plank
          title={ui.commons}
          mark="★"
          toys={COMMON_SQUISHEES}
          earned={earned}
          coins={coins}
          onBuy={buy}
          onPick={pick}
          avatarId={avatarId}
        />
        <Plank
          title={ui.rares}
          mark="◇"
          toys={RARE_SQUISHEES}
          earned={earned}
          coins={coins}
          onBuy={buy}
          onPick={pick}
          avatarId={avatarId}
          blurb={ui.rareBlurb}
        />
      </div>
    </AppScene>
  );
}

function CosmeticCard({
  item,
  label,
  coins,
  owned,
  equipped,
  onBuy,
  onEquip,
  buyLabel,
  wearLabel,
  offLabel,
  coinsLabel,
  notEnough,
}: {
  item: Cosmetic;
  label: string;
  coins: number;
  owned: boolean;
  equipped: boolean;
  onBuy: () => boolean | void;
  onEquip: () => void;
  buyLabel: string;
  wearLabel: string;
  offLabel: string;
  coinsLabel: string;
  notEnough: string;
}) {
  const canBuy = !owned && coins >= item.price;
  return (
    <div className={cn("shelf-slot", equipped && "shelf-slot-avatar")} data-cosmetic-shop={item.id}>
      <MagentaImg src={cosmeticSrc(item.id)} alt="" className="pointer-events-none h-16 w-16" />
      <span className="mt-1 text-center text-xs font-bold text-plum">{label}</span>
      {owned ? (
        <button
          type="button"
          className={cn("owned-pill", !equipped && "cosmetic-wear")}
          data-cosmetic-equip={item.id}
          aria-pressed={equipped}
          onClick={onEquip}
        >
          {equipped ? offLabel : wearLabel}
        </button>
      ) : (
        <button
          type="button"
          className="shelf-price"
          disabled={!canBuy}
          title={canBuy ? undefined : notEnough}
          data-cosmetic-buy={item.id}
          aria-label={`${buyLabel}, ${item.price} ${coinsLabel}`}
          onClick={() => onBuy()}
        >
          <span className="coin-face !h-4 !w-4 text-[0.55rem]" aria-hidden />
          {item.price}
        </button>
      )}
    </div>
  );
}

export function ShopCard({
  s,
  got,
  coins,
  onBuy,
  onPick,
  isAvatar = false,
  cheer = false,
  featured = false,
}: {
  s: Squishee;
  got: boolean;
  coins: number;
  onBuy: (id: string) => boolean | void;
  onPick?: (id: string) => void;
  isAvatar?: boolean;
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
      {onPick ? (
        <button
          type="button"
          className={cn("owned-pill", !isAvatar && "cosmetic-wear")}
          data-avatar-pick={s.id}
          aria-pressed={isAvatar}
          onClick={() => onPick(s.id)}
        >
          {isAvatar ? ui.thatsMe : ui.pickSquishee}
        </button>
      ) : (
        <span className="owned-pill">
          <Check className="size-3.5" strokeWidth={3} />
          {ui.owned}
        </span>
      )}
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
        className={cn("shelf-slot", featured && "shelf-slot-featured", got && s.rarity === "rare" && "rare-glow", isAvatar && "shelf-slot-avatar")}
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
