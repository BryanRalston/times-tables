import { useMemo, useState } from "react";
import { rngFromSeed } from "@/lib/rng";
import {
  gameTitle,
  isAddLevel,
  isTimeLevel,
  isTimesLevel,
  levelsFor,
  type GameId,
} from "../model";
import { makeSheet, type SheetItem } from "../questions";
import { AnalogClock } from "./bits";

function readFocus(): number | undefined {
  const n = Number(new URLSearchParams(window.location.search).get("factor"));
  return Number.isInteger(n) && n >= 2 && n <= 12 ? n : undefined;
}

function readLevel(game: GameId): string {
  const raw = new URLSearchParams(window.location.search).get("level") ?? "";
  if (game === "times" && isTimesLevel(raw)) return raw;
  if (game === "add" && isAddLevel(raw)) return raw;
  if (game === "time" && isTimeLevel(raw)) return raw;
  if (game === "times") return "toTen";
  if (game === "add") return "within20";
  return "half";
}

const BLURB: Record<GameId, string> = {
  times: "Free printable multiplication practice for grades K–3. Random problems and an answer key. No signup.",
  add: "Free printable addition and subtraction for grades K–2. Facts within 5, 10, 20, or 100, plus an answer key.",
  time: "Free printable telling-time practice for grades K–3. Analog clocks to the hour, half hour, quarter hour, and 5 minutes, with an answer key.",
};

export function WorksheetPage({ game }: { game: GameId }) {
  const [level, setLevel] = useState(() => readLevel(game));
  const [focus, setFocus] = useState<number | undefined>(() => (game === "times" ? readFocus() : undefined));
  const [seed, setSeed] = useState(() => Date.now() % 1_000_000_000);
  const items = useMemo(
    () => makeSheet({ game, level, rng: rngFromSeed(seed), focus }),
    [game, level, seed, focus],
  );

  function pushLevel(next: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("level", next);
    window.history.replaceState(null, "", url);
    setLevel(next);
    setSeed(Date.now() % 1_000_000_000);
  }

  function pushFocus(next: number | undefined) {
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("factor", String(next));
    else url.searchParams.delete("factor");
    window.history.replaceState(null, "", url);
    setFocus(next);
    setSeed(Date.now() % 1_000_000_000);
  }

  const title = `${gameTitle(game)} worksheet`;

  return (
    <div className="ac-sheet-page">
      <header className="ac-sheet-bar ac-no-print">
        <a href={`${import.meta.env.BASE_URL || "/times-tables/academy/"}#/`}>← Games</a>
        <div className="ac-sheet-controls">
          <label>
            Level
            <select value={level} onChange={(e) => pushLevel(e.target.value)}>
              {levelsFor(game).map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          {game === "times" ? (
            <label>
              Table
              <select value={focus ?? ""} onChange={(e) => pushFocus(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">Mix</option>
                {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>
                    ×{n}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button type="button" onClick={() => setSeed(Date.now() % 1_000_000_000)}>
            New problems
          </button>
          <button type="button" className="ac-go" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </header>
      <article className="ac-paper">
        <p className="ac-kicker">Squishee Academy</p>
        <h1>{title}</h1>
        <p className="ac-seo">{BLURB[game]}</p>
        <p className="ac-name-line">
          Name _______________________ &nbsp;&nbsp; Date ____________
        </p>
        {game === "time" ? <Clocks items={items} /> : <Problems items={items} />}
        <section className="ac-key">
          <h2>Answer key</h2>
          <ol>
            {items.map((item, i) => (
              <li key={`${item.prompt}-${i}`}>{item.clock ? item.answer : `${item.prompt} ${item.answer}`}</li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}

function Problems({ items }: { items: SheetItem[] }) {
  return (
    <ol className="ac-problems">
      {items.map((item, i) => (
        <li key={`${item.prompt}-${i}`}>{item.prompt}</li>
      ))}
    </ol>
  );
}

function Clocks({ items }: { items: SheetItem[] }) {
  return (
    <div className="ac-clock-grid">
      {items.map((item, i) =>
        item.clock ? (
          <figure key={`${item.answer}-${i}`}>
            <AnalogClock hours={item.clock.hours} minutes={item.clock.minutes} />
            <figcaption>What time is it? __________</figcaption>
          </figure>
        ) : null,
      )}
    </div>
  );
}
