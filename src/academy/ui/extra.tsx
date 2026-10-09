import { useEffect, useState } from "react";
import { COSMETICS, cosmeticPrice, type CosmeticId } from "@/lib/cosmetics";
import { squisheeById } from "@/lib/squishees";
import { bookEntries, catchphrase } from "../buddy/cast";
import { palOwned, withBuddy } from "../buddy/unlock";
import { GAMES, sheetHref } from "../games/registry";
import { DEFAULT_START_GRADE, SQUAD_IDS, cleanName, isGrade, type Grade, type Save } from "../model";
import { buyOutfit, wearOutfit } from "../rewards";
import { activeChild, mapActive, withGrade, withLevel } from "../storage";
import { silence, speak } from "../voice";
import { AcademyPal, BackLink, Foot, FreeNote, Logo, SquisheeImg, cx } from "./bits";
import { GradeChips } from "./grownups";

const STARTERS = SQUAD_IDS.slice(0, 3);

export function HelloScreen({ save, onSave, sound }: { save: Save; onSave: (save: Save) => void; sound: boolean }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<Grade>(DEFAULT_START_GRADE);
  const [buddy, setBuddy] = useState<string>(STARTERS[0] ?? "peach");

  useEffect(() => {
    speak("Pick a buddy!", sound);
    return () => silence();
  }, [sound]);

  return (
    <div className="ac-shell">
      <header className="ac-top">
        <Logo />
      </header>
      <form
        className="ac-hero ac-hello"
        onSubmit={(e) => {
          e.preventDefault();
          const cleaned = cleanName(name) || "Pal";
          const pick = (STARTERS as readonly string[]).includes(buddy) ? buddy : "peach";
          onSave(mapActive(save, (child) => withGrade({ ...child, name: cleaned, avatarId: pick }, grade)));
          window.location.hash = "#/";
        }}
      >
        <h1 className="ac-sr">Pick a buddy</h1>
        <div className="ac-buddy-picks" role="radiogroup" aria-label="Pick a buddy">
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
        <button type="submit" className="ac-pal-play" aria-label="Play">
          <SquisheeImg id={buddy} />
          <span className="ac-play-tri" aria-hidden="true" />
        </button>
        <label className="ac-field ac-name-opt">
          Name
          <input
            value={name}
            maxLength={12}
            autoComplete="off"
            aria-label="Your name"
            placeholder="You can skip this"
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
      </header>
      <h1>Settings</h1>
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
          Name
          <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="submit" className="ac-quiet">
          Save name
        </button>
      </form>
      <section className="ac-panel">
        <h2>Grade</h2>
        <p className="ac-hint">This sets the starting level for each game.</p>
        <GradeChips
          grade={child.grade}
          onGrade={(grade) => {
            if (!isGrade(grade)) return;
            onSave(mapActive(save, (row) => withGrade(row, grade)));
          }}
        />
      </section>
      <section className="ac-panel">
        <h2>Sound</h2>
        <button type="button" className={cx("ac-grade", save.sound && "is-on")} onClick={() => onSave({ ...save, sound: !save.sound })}>
          {save.sound ? "On" : "Off"}
        </button>
      </section>
      {GAMES.map((game) => (
        <section key={game.id} className="ac-panel">
          <h2>{game.title}</h2>
          <div className="ac-levels">
            {game.levels.map((row) => (
              <button
                key={row.id}
                type="button"
                className={cx("ac-grade", child.levels[game.id] === row.id && "is-on")}
                onClick={() => onSave(mapActive(save, (kid) => withLevel(kid, game.id, row.id)))}
              >
                {row.label}
              </button>
            ))}
          </div>
        </section>
      ))}
      <BackLink>Back to games</BackLink>
      <Foot />
    </div>
  );
}

export function ShelfScreen({ save, onSave }: { save: Save; onSave: (save: Save) => void }) {
  const child = activeChild(save);
  const book = bookEntries();
  const found = book.filter((entry) => palOwned(child, entry.id)).length;

  return (
    <div className="ac-shell ac-mid">
      <header className="ac-top">
        <Logo />
      </header>
      <h1>Squishee Book</h1>
      <p className="ac-lede">
        {found} of {book.length} found · {child.coins} coins
      </p>
      <AcademyPal id={child.avatarId} cosmetic={child.equipped} className="ac-shelf-you" label="You" />
      <h2>Outfit shop</h2>
      <p className="ac-hint">Spend coins you earn. Never real money.</p>
      <div className="ac-shelf">
        <button
          type="button"
          className={cx("ac-shelf-card", child.equipped === "" && "is-you")}
          onClick={() => onSave(mapActive(save, (row) => wearOutfit(row, "")))}
        >
          <SquisheeImg id={child.avatarId} />
          <small>No outfit</small>
        </button>
        {COSMETICS.map((item) => {
          const have = child.cosmetics.includes(item.id);
          const price = cosmeticPrice(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={cx("ac-shelf-card", !have && child.coins < price && "is-locked", child.equipped === item.id && "is-you")}
              disabled={!have && child.coins < price}
              onClick={() =>
                onSave(mapActive(save, (row) => (row.cosmetics.includes(item.id) ? wearOutfit(row, item.id) : buyOutfit(row, item.id))))
              }
            >
              <AcademyPal id={child.avatarId} cosmetic={item.id} />
              <small>
                {outfitName(item.id)}
                {have ? "" : ` · ${price}`}
              </small>
            </button>
          );
        })}
      </div>
      <h2>Squishees</h2>
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
              <small>{entry.rarity === "rare" ? "Rare" : "Common"}</small>
              <small>{open ? entry.line : entry.find}</small>
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
      <BackLink>Back to games</BackLink>
      <FreeNote />
    </div>
  );
}

function outfitName(id: CosmeticId): string {
  switch (id) {
    case "party-hat":
      return "Party hat";
    case "scarf":
      return "Scarf";
    case "bow":
      return "Bow";
    case "shades":
      return "Shades";
    default: {
      const neverId: never = id;
      return neverId;
    }
  }
}

export function SheetsScreen() {
  return (
    <div className="ac-shell">
      <header className="ac-top">
        <Logo />
      </header>
      <h1>Free worksheets</h1>
      <p className="ac-lede">Print a page, or shuffle a new set. No signup.</p>
      <div className="ac-sheet-list">
        {GAMES.map((game) => (
          <a key={game.id} className="ac-panel ac-sheet-link" href={sheetHref(game.id)}>
            <SquisheeImg id={game.mascot} />
            <span>
              <strong>{game.title}</strong>
              <small>Printable + answer key</small>
            </span>
          </a>
        ))}
        <a className="ac-panel ac-sheet-link" href={`${import.meta.env.BASE_URL}worksheets/`}>
          <span>
            <strong>All printable worksheets</strong>
            <small>Times, clocks, coins, and more</small>
          </span>
        </a>
      </div>
      <BackLink>Back to games</BackLink>
      <FreeNote />
    </div>
  );
}
