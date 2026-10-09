import { useMemo, useState } from "react";
import { rngFromSeed } from "@/lib/rng";
import { gameById } from "../games/registry";
import { makeSheet } from "../questions";

export function WorksheetPage({ game: gameId }: { game: string }) {
  const spec = gameById(gameId);
  const [level, setLevel] = useState(() => readLevel(gameId));
  const [focus, setFocus] = useState<number | undefined>(() => readFocus(gameId));
  const [seed, setSeed] = useState(() => Date.now() % 1_000_000_000);
  const items = useMemo(
    () => makeSheet({ game: gameId, level, rng: rngFromSeed(seed), focus }),
    [gameId, level, seed, focus],
  );

  if (!spec) return null;

  function pushLevel(next: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("level", next);
    window.history.replaceState(null, "", url);
    setLevel(next);
    setSeed(Date.now() % 1_000_000_000);
  }

  function pushFocus(next: number | undefined) {
    const focusSpec = spec?.focus;
    if (!focusSpec) return;
    const url = new URL(window.location.href);
    if (next) url.searchParams.set(focusSpec.param, String(next));
    else url.searchParams.delete(focusSpec.param);
    window.history.replaceState(null, "", url);
    setFocus(next);
    setSeed(Date.now() % 1_000_000_000);
  }

  const title = `${spec.title} worksheet`;

  return (
    <div className="ac-sheet-page">
      <header className="ac-sheet-bar ac-no-print">
        <a href={`${import.meta.env.BASE_URL || "/times-tables/academy/"}#/`}>← Games</a>
        <div className="ac-sheet-controls">
          <label>
            Level
            <select value={level} onChange={(e) => pushLevel(e.target.value)}>
              {spec.levels.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          {spec.focus ? (
            <label>
              {spec.focus.label}
              <select value={focus ?? ""} onChange={(e) => pushFocus(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">{spec.focus.blank}</option>
                {spec.focus.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
        <p className="ac-seo">{spec.blurb}</p>
        <p className="ac-name-line">
          Name _______________________ &nbsp;&nbsp; Date ____________
        </p>
        <spec.SheetBody items={items} />
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

function readFocus(gameId: string): number | undefined {
  const spec = gameById(gameId);
  if (!spec?.focus) return undefined;
  return spec.focus.read(new URLSearchParams(window.location.search).get(spec.focus.param));
}

function readLevel(gameId: string): string {
  const spec = gameById(gameId);
  if (!spec) return "";
  const raw = new URLSearchParams(window.location.search).get("level") ?? "";
  return spec.isLevel(raw) ? raw : spec.sheetDefaultLevel;
}
