import { useState } from "react";
import { squisheeById } from "@/lib/squishees";
import { catchphrase } from "../buddy/cast";
import { hatchPick } from "../buddy/egg";
import { hostIdFor } from "../buddy/hosts";
import { ownedIds } from "../buddy/unlock";
import { bossForGame } from "../bosses";
import { GAMES, gameById } from "../games/registry";
import { bandFor } from "../grade-map";
import { areaIndex, areaOpen, bossReady, normalizeJourney } from "../journey";
import { DAILY_GOAL, STOPS_PER_AREA, todayIso, type Child } from "../model";
import { AcademyPal, BackLink, Foot, LockIcon, Logo, cx } from "./bits";
import { PalWithLook } from "./boss-figure";
import { EggIcon } from "./buddy-view";

const STOP_NAME = ["Start", "Hop", "Skip", "Boss"];

export function MapScreen({ child, onOpenEgg }: { child: Child; onOpenEgg: () => void }) {
  const journey = normalizeJourney(child.journey, child.grade);
  const here = areaIndex(journey);
  const today = todayIso();
  const eggReady = child.dailyDate === today && child.egg === "closed";
  const eggOpen = child.dailyDate === today && child.egg === "open";
  const [hatchedId, setHatchedId] = useState<string | null>(null);
  const left = Math.max(0, DAILY_GOAL - (child.dailyDate === today ? child.dailyRounds : 0));

  return (
    <div className="ac-shell ac-map-shell">
      <header className="ac-top">
        <Logo />
        <PalWithLook id={child.avatarId} cosmetic={child.equipped} lookId={child.equippedLook} className="ac-meter-pal" label={child.name} />
      </header>
      <h1>Island map</h1>
      <p className="ac-lede">Finish a round to hop. Beat the boss to befriend the host.</p>
      <div className="ac-egg-card" data-egg={eggReady ? "ready" : eggOpen ? "open" : "wait"}>
        <EggIcon ready={eggReady} />
        {eggReady ? (
          <button
            type="button"
            className="ac-go"
            onClick={() => {
              setHatchedId(hatchPick(today, ownedIds(child)));
              onOpenEgg();
            }}
          >
            Hatch the egg
          </button>
        ) : eggOpen ? (
          <p>The egg hatched today.</p>
        ) : (
          <p>{left === 0 ? "Play today to grow the egg." : `${left} more ${left === 1 ? "round" : "rounds"} and the egg hatches.`}</p>
        )}
      </div>
      <ol className="ac-islands" data-area={journey.areaId} data-stop={journey.stop}>
        {GAMES.map((game, index) => {
          const open = areaOpen(journey, index, child.grade);
          const offer = bandFor(game.id, child.grade)?.offer ?? "play";
          const later = offer === "later" && !child.challengeAhead;
          const current = index === here;
          const beaten = journey.bosses.includes(game.id);
          const host = hostIdFor(game.id);
          const hostName = squisheeById(host)?.name ?? "Host";
          const boss = bossForGame(game.id);
          const atBoss = current && bossReady(journey, game.id, child.grade);
          return (
            <li key={game.id} className={cx("ac-island", `is-${game.tint}`, !open && "is-locked", current && "is-here")} data-host={host}>
              <div className="ac-island-head">
                <AcademyPal id={host} className={cx(!open && "ac-sil")} label={open ? hostName : ""} />
                <div>
                  <h2>{game.title}</h2>
                  {open && !later ? <p className="ac-bubble">{catchphrase(host)}</p> : null}
                  <p>
                    {later
                      ? "Coming later"
                      : !open
                        ? "Locked"
                        : beaten
                          ? `${hostName} is your friend`
                          : current
                            ? "You are here"
                            : offer === "intro"
                              ? "Gentle intro"
                              : `${hostName} says hi`}
                  </p>
                </div>
              </div>
              <div className="ac-stops" aria-hidden="true">
                {Array.from({ length: STOPS_PER_AREA }, (_, stop) => {
                  const state = stopState(index, stop, here, journey.stop, beaten);
                  const boss = stop === STOPS_PER_AREA - 1;
                  return (
                    <span key={stop} className={cx("ac-stop", `is-${state}`, boss && "is-boss")} data-stop={stop} data-state={state}>
                      {state === "now" ? (
                        <AcademyPal id={child.avatarId} cosmetic={child.equipped} className="ac-map-you" />
                      ) : (
                        <small>{boss ? "★" : stop + 1}</small>
                      )}
                      <em>{STOP_NAME[stop]}</em>
                    </span>
                  );
                })}
              </div>
              {later ? (
                <p className="ac-hint">Coming later for this grade.</p>
              ) : open ? (
                <div className="ac-island-actions">
                  <a className="ac-quiet" href={`#/play/${game.id}`}>
                    {atBoss ? `Face ${boss.name}` : current ? "Play" : offer === "intro" ? "Gentle intro" : "Practice"}
                  </a>
                  {beaten ? (
                    <a className="ac-quiet" href={`#/play/${game.id}/crown`}>
                      Gold Crown
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="ac-hint">
                  <LockIcon /> Beat the {gameById(GAMES[index - 1]?.id)?.title ?? "last"} boss.
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <BackLink>Back to games</BackLink>
      <Foot />
      {hatchedId ? (
        <div className="ac-modal" role="dialog" aria-label="Hatched squishee">
          <div className="ac-modal-card ac-prize">
            <AcademyPal id={hatchedId} className="ac-done-pal" label={squisheeById(hatchedId)?.name ?? ""} />
            <h2>{squisheeById(hatchedId)?.name ?? "A friend"} hatched!</h2>
            <p className="ac-bubble">{catchphrase(hatchedId)}</p>
            <a className="ac-go" href="#/shelf">
              Open the book
            </a>
            <button type="button" className="ac-quiet" onClick={() => setHatchedId(null)}>
              Nice!
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function stopState(index: number, stop: number, here: number, hereStop: number, beaten: boolean): "done" | "now" | "ahead" {
  if (index < here || beaten) return stop === hereStop && index === here ? "now" : "done";
  if (index > here) return "ahead";
  if (stop < hereStop) return "done";
  if (stop === hereStop) return "now";
  return "ahead";
}
