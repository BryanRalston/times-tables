import { useEffect, useState } from "react";
import { GAME_CARDS as GAMES } from "../games/catalog";
import { gameOffered } from "../games/offer";
import { tierWindow } from "../grade-map";
import { getLocale, show } from "../i18n";
import { cleanName, isGrade, type Child, type Save } from "../model";
import { privacyPathForLocale } from "../privacy-path";
import { activeChild, mapActive, tierFor, withGrade, withTier } from "../storage";
import { cx } from "./bits";
import { GradeChips } from "./grade-chips";
import { TierPicker } from "./tier-picker";

/** Turn Challenge ahead on or off and move any level that is now outside the window back in. */
export function withChallengeAhead(row: Child, challengeAhead: boolean): Child {
  const next = { ...row, challengeAhead };
  const levels = { ...next.levels };
  for (const game of GAMES) {
    const allowed = tierWindow(
      game.levels.map((level) => level.id),
      game.id,
      next.grade,
      challengeAhead,
      tierFor(next, game.id),
    );
    if (!allowed.ids.includes(levels[game.id] ?? "")) levels[game.id] = allowed.start || game.defaultLevel(next.grade);
  }
  return { ...next, levels };
}

/**
 * The grown-up settings, shown only inside the gated Grown-ups corner.
 * Grade, Challenge ahead and Easy/Medium/Hard per game for the active child.
 * Difficulty is saved per game and per grade (see withTier), so a grade change keeps each grade's picks.
 */
export function GrownupSettings({ save, onSave }: { save: Save; onSave: (save: Save) => void }) {
  const child = activeChild(save);
  const [name, setName] = useState(child.name);
  useEffect(() => setName(child.name), [child.id, child.name]);
  const base = import.meta.env.BASE_URL;
  const games = GAMES.filter((game) => gameOffered(game.id));

  return (
    <section className="ac-panel ac-gu-settings" aria-label={show("Settings")}>
      <h2>
        {show("Settings")} <span className="ac-gu-who">{child.name}</span>
      </h2>

      <div className="ac-gu-row">
        <h3>{show("Grade")}</h3>
        <p className="ac-hint">{show("This sets the starting level and the levels each game can use.")}</p>
        <GradeChips
          grade={child.grade}
          onGrade={(grade) => {
            if (!isGrade(grade)) return;
            onSave(mapActive(save, (row) => withGrade(row, grade)));
          }}
        />
      </div>

      <div className="ac-gu-row">
        <h3>{show("Challenge ahead")}</h3>
        <p className="ac-hint">{show("A grown-up can open levels past this grade. Games still start in the grade band.")}</p>
        <button
          type="button"
          className={cx("ac-grade", child.challengeAhead && "is-on")}
          aria-pressed={child.challengeAhead}
          data-gu="challenge"
          onClick={() => onSave(mapActive(save, (row) => withChallengeAhead(row, !row.challengeAhead)))}
        >
          {child.challengeAhead ? show("On") : show("Off")}
        </button>
      </div>

      <div className="ac-gu-row">
        <h3>{show("Difficulty")}</h3>
        <p className="ac-hint">{show("Easy, Medium or Hard for each game. Saved for this grade.")}</p>
        <ul className="ac-gu-tiers">
          {games.map((game) => {
            const tier = tierFor(child, game.id);
            const open = tierWindow(game.levels.map((row) => row.id), game.id, child.grade, child.challengeAhead, tier).ids.length > 0;
            return (
              <li key={game.id} data-game={game.id}>
                <span className="ac-gu-game">{show(game.title)}</span>
                {open ? (
                  <TierPicker tier={tier} compact onTier={(next) => onSave(mapActive(save, (kid) => withTier(kid, game.id, next)))} />
                ) : (
                  <span className="ac-hint">{show("Coming later for this grade.")}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="ac-gu-row ac-gu-pair">
        <form
          className="ac-gu-name"
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
        <div>
          <h3>{show("Sound")}</h3>
          <button type="button" className={cx("ac-grade", save.sound && "is-on")} onClick={() => onSave({ ...save, sound: !save.sound })}>
            {save.sound ? show("On") : show("Off")}
          </button>
        </div>
      </div>

      <nav className="ac-gu-links" aria-label={show("Grown-ups")}>
        <a href="#/sheets">{show("Free worksheets")}</a>
        <a href={`${base}${privacyPathForLocale(getLocale())}`}>{show("Privacy")}</a>
      </nav>
    </section>
  );
}
