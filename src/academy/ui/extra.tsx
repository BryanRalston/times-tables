import { useEffect, useState } from "react";
import { squisheeById } from "@/lib/squishees";
import { wearBossLook } from "../boss-battle";
import { bossCosmeticName, bossForGame } from "../bosses";
import { bondHearts, bondName, bondScore, bondTier } from "../buddy/bond";
import { bookEntries, catchphrase } from "../buddy/cast";
import { palOwned, withBuddy } from "../buddy/unlock";
import { GAME_CARDS as GAMES, sheetHref } from "../games/catalog";
import { gameOffered } from "../games/offer";
import { playWindow } from "../grade-map";
import { show, t } from "../i18n";
import { DEFAULT_START_GRADE, SQUAD_IDS, cleanName, isGrade, type Grade, type Save } from "../model";
import { buyOutfit, wearOutfit } from "../rewards";
import { lookShowsOn, outfitHint, outfitLabel, outfitPrice, shopSections } from "../wardrobe";
import { activeChild, mapActive, withGrade, withLevel } from "../storage";
import { silence, speak } from "../voice";
import { AcademyPal, BackLink, Foot, FreeNote, Logo, PlayMark, SquisheeImg, cx } from "./bits";
import { SquishTally } from "./squishy";
import { BossFigure, PalWithLook } from "./boss-figure";
import { GradeChips } from "./grade-chips";
import { LanguageButton, withLang } from "./lang";

const STARTERS = SQUAD_IDS.slice(0, 3);

export function HelloScreen({ save, onSave, sound }: { save: Save; onSave: (save: Save) => void; sound: boolean }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<Grade>(DEFAULT_START_GRADE);
  const [buddy, setBuddy] = useState<string>(STARTERS[0] ?? "peach");

  useEffect(() => {
    speak(t("Pick a buddy!", "¡Elige un amigo!"), sound);
    return () => silence();
  }, [sound, save.lang]);

  return (
    <div className={cx("ac-shell", grade === "PK" && "is-prek")}>
      <header className="ac-top">
        <Logo />
        <LanguageButton lang={save.lang} onLang={(lang) => onSave(withLang(save, lang))} />
      </header>
      <form
        className="ac-hero ac-hello"
        onSubmit={(e) => {
          e.preventDefault();
          const cleaned = cleanName(name) || "Pal";
          const pick = (STARTERS as readonly string[]).includes(buddy) ? buddy : "peach";
          onSave(withLang(mapActive(save, (child) => withGrade({ ...child, name: cleaned, avatarId: pick }, grade)), save.lang));
          window.location.hash = "#/";
        }}
      >
        <h1 className="ac-sr">{show("Pick a buddy")}</h1>
        <div className="ac-buddy-picks" role="radiogroup" aria-label={show("Pick a buddy")}>
          {STARTERS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={buddy === id}
              data-buddy-pick={id}
              className={cx("ac-buddy-pick", buddy === id && "is-on")}
              onClick={() => setBuddy(id)}
            >
              <SquisheeImg id={id} label={squisheeById(id)?.name ?? id} />
              <small>{squisheeById(id)?.name ?? id}</small>
            </button>
          ))}
        </div>
        <p className="ac-bubble">{catchphrase(buddy)}</p>
        <GradeChips grade={grade} onGrade={setGrade} className="ac-hello-grades" />
        <button type="submit" className="ac-pal-play" aria-label={show("Play")}>
          <SquisheeImg id={buddy} />
          <PlayMark />
        </button>
        <label className="ac-field ac-name-opt">
          {show("Name")}
          <input
            value={name}
            maxLength={12}
            autoComplete="off"
            aria-label={show("Your name")}
            placeholder={show("You can skip this")}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <FreeNote />
      </form>
    </div>
  );
}

export function SettingsScreen({ save, onSave }: { save: Save; onSave: (save: Save) => void }) {
  const child = activeChild(save);
  const [name, setName] = useState(child.name);

  return (
    <div className="ac-shell">
      <header className="ac-top">
        <Logo />
        <LanguageButton lang={save.lang} onLang={(lang) => onSave(withLang(save, lang))} />
      </header>
      <h1>{show("Settings")}</h1>
      <form
        className="ac-panel"
        onSubmit={(e) => {
          e.preventDefault();
          const cleaned = cleanName(name);
          if (!cleaned) return;
          onSave(mapActive(save, (row) => ({ ...row, name: cleaned })));
        }}
      >
        <label className="ac-field">
          {show("Name")}
          <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="submit" className="ac-quiet">
          {show("Save name")}
        </button>
      </form>
      <section className="ac-panel">
        <h2>{show("Grade")}</h2>
        <p className="ac-hint">{show("This sets the starting level and the levels each game can use.")}</p>
        <GradeChips
          grade={child.grade}
          onGrade={(grade) => {
            if (!isGrade(grade)) return;
            onSave(mapActive(save, (row) => withGrade(row, grade)));
          }}
        />
      </section>
      <section className="ac-panel">
        <h2>{show("Challenge ahead")}</h2>
        <p className="ac-hint">{show("A grown-up can open levels past this grade. Games still start in the grade band.")}</p>
        <button
          type="button"
          className={cx("ac-grade", child.challengeAhead && "is-on")}
          aria-pressed={child.challengeAhead}
          onClick={() =>
            onSave(
              mapActive(save, (row) => {
                const challengeAhead = !row.challengeAhead;
                const next = { ...row, challengeAhead };
                const levels = { ...next.levels };
                for (const game of GAMES) {
                  const allowed = playWindow(
                    game.levels.map((level) => level.id),
                    game.id,
                    next.grade,
                    challengeAhead,
                  );
                  if (!allowed.ids.includes(levels[game.id] ?? "")) levels[game.id] = allowed.start || game.defaultLevel(next.grade);
                }
                return { ...next, levels };
              }),
            )
          }
        >
          {child.challengeAhead ? show("On") : show("Off")}
        </button>
      </section>
      <section className="ac-panel">
        <h2>{show("Sound")}</h2>
        <button type="button" className={cx("ac-grade", save.sound && "is-on")} onClick={() => onSave({ ...save, sound: !save.sound })}>
          {save.sound ? show("On") : show("Off")}
        </button>
      </section>
      {GAMES.filter((game) => gameOffered(game.id)).map((game) => {
        const allowed = playWindow(
          game.levels.map((row) => row.id),
          game.id,
          child.grade,
          child.challengeAhead,
        );
        return (
          <section key={game.id} className="ac-panel">
            <h2>{show(game.title)}</h2>
            {allowed.ids.length === 0 ? (
              <p className="ac-hint">{show("Coming later for this grade.")}</p>
            ) : (
              <div className="ac-levels">
                {game.levels
                  .filter((row) => allowed.ids.includes(row.id))
                  .map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className={cx("ac-grade", child.levels[game.id] === row.id && "is-on")}
                      onClick={() => onSave(mapActive(save, (kid) => withLevel(kid, game.id, row.id)))}
                    >
                      {show(row.label)}
                    </button>
                  ))}
              </div>
            )}
          </section>
        );
      })}
      <BackLink>{show("Back to games")}</BackLink>
      <Foot />
    </div>
  );
}

export function ShelfScreen({ save, onSave }: { save: Save; onSave: (save: Save) => void }) {
  const child = activeChild(save);
  const book = bookEntries();
  const found = book.filter((entry) => palOwned(child, entry.id)).length;
  const shop = shopSections();
  const lookCount = shop.reduce((sum, section) => sum + section.items.length, 0);
  const [shopNote, setShopNote] = useState<string | null>(null);

  return (
    <div className="ac-shell ac-mid">
      <header className="ac-top">
        <Logo />
      </header>
      <h1>{show("Squishee Book")}</h1>
      <p className="ac-lede">
        {t(
          `${found} of ${book.length} found · ${child.coins} coins`,
          `${found} de ${book.length} encontrados · ${child.coins} monedas`, `${found} de ${book.length} encontrados · ${child.coins} moedas`,
        `${found} sur ${book.length} trouvés · ${child.coins} pièces`, `找到${found}个，一共${book.length}个 · ${child.coins}个金币`, `${book.length} में से ${found} मिले · ${child.coins} सिक्के`, `عُثر على ${found} من ${book.length} · ${child.coins} عملات`)}
      </p>
      <SquishTally />
      <PalWithLook id={child.avatarId} cosmetic={child.equipped} lookId={child.equippedLook} className="ac-shelf-you" label={show("You")} />
      <h2>{show("Outfit shop")}</h2>
      <p className="ac-hint">
        {t(
          `${child.cosmetics.length} of ${lookCount} looks · ${child.coins} coins`,
          `${child.cosmetics.length} de ${lookCount} disfraces · ${child.coins} monedas`, `${child.cosmetics.length} de ${lookCount} fantasias · ${child.coins} moedas`,
        `${child.cosmetics.length} sur ${lookCount} déguisements · ${child.coins} pièces`, `装扮${child.cosmetics.length}套，一共${lookCount}套 · ${child.coins}个金币`, `${lookCount} में से ${child.cosmetics.length} रूप · ${child.coins} सिक्के`, `${child.cosmetics.length} من ${lookCount} أزياء · ${child.coins} عملات`)}
      </p>
      <p className="ac-hint">{show("Spend coins you earn. Never real money.")}</p>
      <p className="ac-hint">{t("Stars and practice unlock looks too.", "Las estrellas y la práctica también dan disfraces.")}</p>
      {shopNote ? (
        <p className="ac-hint" role="status">
          {shopNote}
        </p>
      ) : null}
      {shop.map((section) => (
        <section key={section.slot} className="ac-shop-slot" data-slot={section.slot}>
          <h3>{show(section.title)}</h3>
          <div className="ac-shop">
            {section.slot === "hat" ? (
              <button
                type="button"
                className={cx("ac-shelf-card", child.equipped === "" && "is-you")}
                onClick={() => onSave(mapActive(save, (row) => wearOutfit(row, "")))}
              >
                <SquisheeImg id={child.avatarId} />
                <small>{show("No outfit")}</small>
              </button>
            ) : null}
            {section.items.map((item) => {
              const have = child.cosmetics.includes(item.id);
              const price = outfitPrice(item.id);
              const fits = lookShowsOn(child.avatarId, item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  data-outfit={item.id}
                  data-fit={fits ? "yes" : "no"}
                  className={cx("ac-shelf-card", (!fits || (!have && child.coins < price)) && "is-locked", fits && child.equipped === item.id && "is-you")}
                  onClick={() => {
                    if (!fits) {
                      setShopNote(show("This look does not fit."));
                      return;
                    }
                    if (!have && child.coins < price) {
                      setShopNote(show("You need more coins."));
                      return;
                    }
                    setShopNote(null);
                    onSave(mapActive(save, (row) => (row.cosmetics.includes(item.id) ? wearOutfit(row, item.id) : buyOutfit(row, item.id))));
                  }}
                >
                  <AcademyPal id={child.avatarId} cosmetic={item.id} />
                  <small>
                    {outfitLabel(item.id)}
                    {have ? "" : ` · ${price}`}
                  </small>
                  {have ? null : <small>{outfitHint(item.id)}</small>}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <h2>{show("Boss cards")}</h2>
      <div className="ac-book" data-book="bosses">
        {GAMES.filter((game) => gameOffered(game.id)).map((game) => {
          const boss = bossForGame(game.id);
          const friend = child.journey.bosses.includes(game.id);
          const gold = child.goldCrowns.includes(game.id);
          const wearing = child.equippedLook === boss.cosmeticId;
          return (
            <article key={game.id} className={cx("ac-book-card", !friend && "is-locked")} data-boss-card={game.id} data-friend={friend ? "yes" : "no"}>
              {friend ? (
                <BossFigure face={boss.face} look={boss.look} mood="friendly" crown={gold} name={boss.name} size="fight" />
              ) : (
                <p className="ac-hint">???</p>
              )}
              <h3>{friend ? boss.name : show("Boss")}</h3>
              <p>{friend ? boss.friendly : show("Beat this boss to meet them.")}</p>
              {friend ? <p className="ac-trophy" data-trophy={boss.trophyId}>{boss.trophyName}</p> : null}
              {gold ? <p className="ac-trophy is-gold">{show("Gold Crown")}</p> : null}
              {friend ? (
                <button
                  type="button"
                  className="ac-quiet"
                  onClick={() => onSave(mapActive(save, (row) => wearBossLook(row, wearing ? "" : boss.cosmeticId)))}
                >
                  {wearing
                    ? t(`Take off ${bossCosmeticName(boss.cosmeticId)}`, `Quítale ${bossCosmeticName(boss.cosmeticId)}`, `Tire ${bossCosmeticName(boss.cosmeticId)}`, `Enlève ${bossCosmeticName(boss.cosmeticId)}`, `取下${bossCosmeticName(boss.cosmeticId)}`, `${bossCosmeticName(boss.cosmeticId)} उतारो`, `اخلع ${bossCosmeticName(boss.cosmeticId)}`)
                    : t(`Wear ${bossCosmeticName(boss.cosmeticId)}`, `Ponte ${bossCosmeticName(boss.cosmeticId)}`, `Vista ${bossCosmeticName(boss.cosmeticId)}`, `Mets ${bossCosmeticName(boss.cosmeticId)}`, `戴上${bossCosmeticName(boss.cosmeticId)}`, `${bossCosmeticName(boss.cosmeticId)} पहनो`, `ارتدِ ${bossCosmeticName(boss.cosmeticId)}`)}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
      <h2>{show("Squishees")}</h2>
      <div className="ac-shelf" data-book="squishees">
        {book.map((entry) => {
          const open = palOwned(child, entry.id);
          const card = (
            <>
              <AcademyPal
                id={entry.id}
                cosmetic={open && child.avatarId === entry.id ? child.equipped : ""}
                className={cx(!open && "ac-sil")}
                label={open ? entry.name : ""}
              />
              <small>{open ? entry.name : "???"}</small>
              <small>{entry.rarity === "rare" ? show("Rare") : show("Common")}</small>
              <small>{open ? entry.line : entry.find}</small>
              {open ? <small>{entry.fact}</small> : null}
              {open ? <small>{t(`Loves ${entry.favorite}`, `Le encanta ${entry.favorite}`, `Adora ${entry.favorite}`, `Adore ${entry.favorite}`, `最喜欢${entry.favorite}`, `${entry.favorite} पसंद है`, `يحب ${entry.favorite}`)}</small> : null}
              {open ? (
                <small className="ac-bond-pips" data-bond={bondTier(bondScore(child.bonds, entry.id))}>
                  {bondHearts(bondTier(bondScore(child.bonds, entry.id))) || bondName(0)}
                </small>
              ) : null}
            </>
          );
          if (!open) {
            return (
              <div key={entry.id} className="ac-shelf-card is-locked" data-found="no" data-rarity={entry.rarity}>
                {card}
              </div>
            );
          }
          return (
            <button
              key={entry.id}
              type="button"
              data-found="yes"
              data-rarity={entry.rarity}
              className={cx("ac-shelf-card", child.avatarId === entry.id && "is-you")}
              onClick={() => onSave(mapActive(save, (row) => withBuddy(row, entry.id)))}
            >
              {card}
            </button>
          );
        })}
      </div>
      <BackLink>{show("Back to games")}</BackLink>
      <FreeNote />
    </div>
  );
}

export function SheetsScreen() {
  return (
    <div className="ac-shell">
      <header className="ac-top">
        <Logo />
      </header>
      <h1>{show("Free worksheets")}</h1>
      <p className="ac-lede">{show("Print a page, or shuffle a new set. No signup.")}</p>
      <div className="ac-sheet-list">
        {GAMES.filter((game) => gameOffered(game.id)).map((game) => (
          <a key={game.id} className="ac-panel ac-sheet-link" href={sheetHref(game.id)}>
            <SquisheeImg id={game.mascot} />
            <span>
              <strong>{show(game.title)}</strong>
              <small>{show("Printable + answer key")}</small>
            </span>
          </a>
        ))}
        <a className="ac-panel ac-sheet-link" href={`${import.meta.env.BASE_URL}worksheets/`}>
          <span>
            <strong>{show("All printable worksheets")}</strong>
            <small>{show("Times, clocks, coins, and more")}</small>
          </span>
        </a>
      </div>
      <BackLink>{show("Back to games")}</BackLink>
      <FreeNote />
    </div>
  );
}
