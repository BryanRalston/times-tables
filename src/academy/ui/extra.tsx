import { useState } from "react";
import { COSMETICS, cosmeticPrice, type CosmeticId } from "@/lib/cosmetics";
import { squisheeById } from "@/lib/squishees";
import { GAMES, sheetHref } from "../games/registry";
import { SQUAD_IDS, cleanName, isGrade, type Grade, type Save } from "../model";
import { buyOutfit, giftCount, palUnlocked, starsNeeded, unlockedCount, wearOutfit } from "../rewards";
import { activeChild, mapActive, withGrade, withLevel } from "../storage";
import { AcademyPal, BackLink, Foot, FreeNote, Logo, SquisheeImg, cx } from "./bits";
import { GradeChips } from "./grownups";

export function HelloScreen({ save, onSave }: { save: Save; onSave: (save: Save) => void }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<Grade>("K");
  const ready = cleanName(name).length > 0;

  return (
    <div className="ac-shell">
      <header className="ac-top">
        <Logo />
      </header>
      <form
        className="ac-hero"
        onSubmit={(e) => {
          e.preventDefault();
          const cleaned = cleanName(name);
          if (!cleaned) return;
          onSave(mapActive(save, (child) => withGrade({ ...child, name: cleaned, avatarId: "peach" }, grade)));
        }}
      >
        <div className="ac-pals">
          <SquisheeImg id="frog" />
          <SquisheeImg id="peach" className="is-mid" />
          <SquisheeImg id="bunny" />
        </div>
        <h1>Hi! Ready to play?</h1>
        <p className="ac-lede">2-minute games · earn stars · unlock squishees</p>
        <label className="ac-field">
          Your name
          <input value={name} maxLength={12} autoComplete="off" onChange={(e) => setName(e.target.value)} />
        </label>
        <GradeChips grade={grade} onGrade={setGrade} />
        <button type="submit" className="ac-go" disabled={!ready}>
          Let&apos;s play
        </button>
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
  const owned = unlockedCount(child.stars);
  const gifts = giftCount(child);

  return (
    <div className="ac-shell ac-mid">
      <header className="ac-top">
        <Logo />
      </header>
      <h1>Shelf</h1>
      <p className="ac-lede">
        {child.coins} coins · {owned} of {SQUAD_IDS.length} squishees
        {gifts > 0 ? ` · ${gifts} new` : ""}
      </p>
      <AcademyPal id={child.avatarId} cosmetic={child.equipped} className="ac-shelf-you" label="You" />
      <h2>Outfits</h2>
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
      <div className="ac-shelf">
        {SQUAD_IDS.map((id, index) => {
          const open = palUnlocked(child, id, index);
          const meta = squisheeById(id);
          return (
            <button
              key={id}
              type="button"
              className={cx("ac-shelf-card", !open && "is-locked", child.avatarId === id && "is-you")}
              disabled={!open}
              onClick={() => onSave(mapActive(save, (row) => ({ ...row, avatarId: id, opened: Math.max(row.opened, owned) })))}
            >
              <AcademyPal id={id} cosmetic={child.avatarId === id ? child.equipped : ""} label={open ? meta?.name : ""} />
              <small>{open ? (meta?.name ?? id) : `${starsNeeded(index)} stars`}</small>
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
