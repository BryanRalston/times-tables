import { useState } from "react";
import { squisheeById } from "@/lib/squishees";
import { bookEntries, catchphrase } from "../buddy/cast";
import { ownedIds } from "../buddy/unlock";
import { bossForGame } from "../bosses";
import { GAMES } from "../games/registry";
import { bandFor } from "../grade-map";
import { bossReady, dailySnapshot, normalizeJourney } from "../journey";
import { gradeLabel, todayIso, type Child } from "../model";
import { nextPlacement } from "../placement";
import { gameOfDay, rollGift, type GiftRoll } from "../rewards";
import { chime } from "../sound";
import { WeekStickers } from "./stickers";
import { AcademyPal, Foot, GiftBox, LockIcon, Logo, ProgressRing, SquisheeImg, Stars, cx } from "./bits";
import { PalWithLook } from "./boss-figure";

export function HomeScreen({
  child,
  sound,
  onClaim,
  onPlay,
}: {
  child: Child;
  sound: boolean;
  onClaim: () => void;
  onPlay: (game: string, level: string) => void;
}) {
  const [prize, setPrize] = useState<GiftRoll | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const todayId = todayIso();
  const today = gameOfDay(todayId);
  const daily = dailySnapshot(child, todayId);
  const journey = normalizeJourney(child.journey, child.grade);
  const place = nextPlacement(child);
  const book = bookEntries();
  const bossHere = bossReady(journey, journey.areaId, child.grade);

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
          <PalWithLook id={child.avatarId} cosmetic={child.equipped} lookId={child.equippedLook} className="is-mid" label={child.name} />
        </div>
        <p className="ac-bubble">{catchphrase(child.avatarId)}</p>
        <h1>Hi {child.name}! Ready to play?</h1>
        <p className="ac-lede">2-minute games · hop the island · collect squishees</p>
        <div className="ac-daily" data-daily-rounds={daily.rounds} data-daily-goal={daily.goal} data-gift={daily.ready ? "closed" : daily.claimed ? "open" : "none"}>
          <ProgressRing value={daily.rounds} max={daily.goal} label={`${daily.rounds} of ${daily.goal} rounds today`} />
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
        <WeekStickers secondsByDay={child.secondsByDay} today={todayId} />
        <button
          type="button"
          className="ac-go ac-play-main"
          data-placement={place.reason}
          onClick={() => onPlay(bossHere ? journey.areaId : place.game, bossHere ? (child.levels[journey.areaId] ?? place.level) : place.level)}
        >
          <span className="ac-play-tri" aria-hidden="true" /> {bossHere ? `Face ${bossForGame(journey.areaId).name}` : "Play"}
        </button>
        <a className="ac-map-link" href="#/map">
          Island map
        </a>
      </section>

      <div className="ac-grid">
        {GAMES.map((game) => {
          const offer = bandFor(game.id, child.grade)?.offer ?? "play";
          const open = offer !== "later" || child.challengeAhead;
          if (!open) {
            return (
              <button
                key={game.id}
                type="button"
                className={`ac-card is-${game.tint} is-soon`}
                data-offer="later"
                onClick={() => {
                  setToast(`${game.title} is coming later for this grade.`);
                  window.setTimeout(() => setToast(null), 1800);
                }}
              >
                <span className="ac-soon">
                  <LockIcon /> Later
                </span>
                <SquisheeImg id={game.mascot} />
                <h2>{game.title}</h2>
                <p>Coming later</p>
              </button>
            );
          }
          return (
            <a key={game.id} className={`ac-card is-${game.tint}`} data-offer={offer} href={`#/play/${game.id}`}>
              {journey.areaId === game.id ? (
                <span className="ac-soon">Here</span>
              ) : offer === "intro" ? (
                <span className="ac-soon">Intro</span>
              ) : null}
              <SquisheeImg id={game.mascot} />
              <h2>{game.title}</h2>
              <p>{offer === "intro" ? "Gentle intro" : game.audience}</p>
              <Stars value={child.bestStars[game.id] ?? 0} />
            </a>
          );
        })}
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
              {ownedIds(child).length}/{book.length}
            </strong>
            <small>book</small>
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
