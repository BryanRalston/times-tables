import { GAMES, gameById } from "../games/registry";
import { STOPS_PER_AREA, type Child } from "../model";
import { areaIndex, areaOpen, bossReady, normalizeJourney } from "../journey";
import { AcademyPal, BackLink, Foot, LockIcon, Logo, SquisheeImg, cx } from "./bits";

const STOP_NAME = ["Start", "Hop", "Skip", "Boss"];

export function MapScreen({ child }: { child: Child }) {
  const journey = normalizeJourney(child.journey);
  const here = areaIndex(journey);

  return (
    <div className="ac-shell ac-map-shell">
      <header className="ac-top">
        <Logo />
        <AcademyPal id={child.avatarId} cosmetic={child.equipped} className="ac-meter-pal" label={child.name} />
      </header>
      <h1>Island map</h1>
      <p className="ac-lede">Finish a round to hop. Beat the boss to open the next island.</p>
      <ol className="ac-islands" data-area={journey.areaId} data-stop={journey.stop}>
        {GAMES.map((game, index) => {
          const open = areaOpen(journey, index);
          const current = index === here;
          const beaten = journey.bosses.includes(game.id);
          return (
            <li key={game.id} className={cx("ac-island", `is-${game.tint}`, !open && "is-locked", current && "is-here")}>
              <div className="ac-island-head">
                <SquisheeImg id={game.mascot} />
                <div>
                  <h2>{game.title}</h2>
                  <p>{!open ? "Locked" : beaten ? "Boss beaten" : current ? "You are here" : "Open"}</p>
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
              {open ? (
                <a className="ac-quiet" href={`#/play/${game.id}`}>
                  {current && bossReady(journey, game.id) ? "Boss round" : current ? "Play" : "Practice"}
                </a>
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
