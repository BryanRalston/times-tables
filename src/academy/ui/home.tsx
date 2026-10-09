import { useState } from "react";
import { squisheeById } from "@/lib/squishees";
import { GAMES, gameById } from "../games/registry";
import { bossReady, dailySnapshot, normalizeJourney } from "../journey";
import { gradeLabel, todayIso, type Child } from "../model";
import { gameOfDay, rollGift, unlockedCount, type GiftRoll } from "../rewards";
import { chime } from "../sound";
import { AcademyPal, Flame, Foot, GiftBox, LockIcon, Logo, ProgressRing, SquisheeImg, Stars, cx } from "./bits";

/** Not a game yet. A real game is a registry module, not a locked card. */
const COMING_SOON = { title: "Sight Words", audience: "K–1", tint: "lav", mascot: "grape" };

export function HomeScreen({ child, sound, onClaim }: { child: Child; sound: boolean; onClaim: () => void }) {
  const [toast, setToast] = useState<string | null>(null);
  const [prize, setPrize] = useState<GiftRoll | null>(null);
  const todayId = todayIso();
  const today = gameOfDay(todayId);
  const daily = dailySnapshot(child, todayId);
  const journey = normalizeJourney(child.journey);
  const here = gameById(journey.areaId) ?? GAMES[0];
  const boss = here ? bossReady(journey, here.id) : false;
  const pals = ["frog", "peach", "bunny"];

  return (
    <div className="ac-shell">
      <header className="ac-top">
        <Logo />
        <a className="ac-streak" href="#/map">
          Island
        </a>
      </header>

      <section className="ac-hero">
        <div className="ac-pals">
          {pals.map((id) => (
            <SquisheeImg key={id} id={id} className={id === "peach" ? "is-mid" : ""} />
          ))}
        </div>
        <h1>Hi {child.name}! Ready to play?</h1>
        <p className="ac-lede">2-minute games · hop the island · collect squishees</p>
        <div className="ac-daily" data-daily-rounds={daily.rounds} data-daily-goal={daily.goal} data-gift={daily.ready ? "closed" : daily.claimed ? "open" : "none"}>
          <ProgressRing value={daily.rounds} max={daily.goal} label={`${daily.rounds} of ${daily.goal} rounds today`} />
          <div className="ac-streak" aria-label={child.streak > 0 ? `${child.streak} day streak` : "No streak yet"}>
            <Flame /> {child.streak > 0 ? `${child.streak}-day streak` : "Start a streak"}
          </div>
          <button
            type="button"
            className={cx("ac-gift", daily.ready && "is-ready", (daily.claimed || prize != null) && "is-open")}
            disabled={!daily.ready}
            aria-label={daily.ready ? "Open today's gift" : daily.claimed ? "Today's gift is open" : "Gift at 3 rounds"}
            onClick={() => {
              if (!daily.ready) return;
              setPrize(rollGift(todayId, child));
              chime("gift", sound);
              onClaim();
            }}
          >
            <GiftBox open={daily.claimed || prize != null} />
          </button>
        </div>
        <a className="ac-go" href={here ? `#/play/${here.id}` : "#/map"}>
          <span className="ac-play-tri" aria-hidden="true" /> {boss ? "Boss round" : "Play the island"}
        </a>
        <a className="ac-map-link" href="#/map">
          Island map
        </a>
      </section>

      <div className="ac-grid">
        {GAMES.map((game) => (
          <a key={game.id} className={`ac-card is-${game.tint}`} href={`#/play/${game.id}`}>
            {journey.areaId === game.id ? <span className="ac-soon">Here</span> : null}
            <SquisheeImg id={game.mascot} />
            <h2>{game.title}</h2>
            <p>{game.audience}</p>
            <Stars value={child.bestStars[game.id] ?? 0} />
          </a>
        ))}
        <button
          type="button"
          className={`ac-card is-${COMING_SOON.tint} is-soon`}
          onClick={() => {
            setToast("Sight words are coming soon.");
            window.setTimeout(() => setToast(null), 1800);
          }}
        >
          <span className="ac-soon">
            <LockIcon /> Soon
          </span>
          <SquisheeImg id={COMING_SOON.mascot} />
          <h2>{COMING_SOON.title}</h2>
          <p>{COMING_SOON.audience}</p>
        </button>
      </div>

      <div className="ac-meters">
        <a className="ac-meter" href="#/shelf">
          <span className="ac-meter-ico" aria-hidden="true">
            ★
          </span>
          <span>
            <strong>{child.stars}</strong>
            <small>stars</small>
          </span>
        </a>
        <a className="ac-meter" href="#/shelf">
          <AcademyPal id={child.avatarId} cosmetic={child.equipped} className="ac-meter-pal" />
          <span>
            <strong>
              {unlockedCount(child.stars)}/{24}
            </strong>
            <small>squishees</small>
          </span>
        </a>
        <a className="ac-meter" href="#/shelf">
          <span className="ac-meter-ico" aria-hidden="true">
            ●
          </span>
          <span>
            <strong>{child.coins}</strong>
            <small>coins</small>
          </span>
        </a>
      </div>

      <p className="ac-today-note">
        Today: {GAMES.find((game) => game.id === today)?.title ?? today} · {gradeLabel(child.grade)}
      </p>
      <Foot />
      {toast ? (
        <div className="ac-toast" role="status">
          {toast}
        </div>
      ) : null}
      {prize ? (
        <div className="ac-modal" role="dialog" aria-label="Daily gift">
          <div className="ac-modal-card ac-prize">
            <GiftBox open />
            <h2>Daily gift!</h2>
            <PrizeBody prize={prize} />
            <button type="button" className="ac-go" onClick={() => setPrize(null)}>
              Nice!
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PrizeBody({ prize }: { prize: GiftRoll }) {
  if (prize.kind === "coins") return <p>{prize.amount} coins for the shelf.</p>;
  if (prize.kind === "cosmetic") {
    return (
      <p>
        A new outfit: <strong>{outfitName(prize.id)}</strong>
      </p>
    );
  }
  const pal = squisheeById(prize.id);
  return (
    <p>
      <AcademyPal id={prize.id} className="ac-done-pal" label={pal?.name ?? ""} />
      {pal?.name ?? "A friend"} hopped in.
    </p>
  );
}

function outfitName(id: string): string {
  switch (id) {
    case "party-hat":
      return "party hat";
    case "scarf":
      return "scarf";
    case "bow":
      return "bow";
    case "shades":
      return "shades";
    default:
      return id;
  }
}
