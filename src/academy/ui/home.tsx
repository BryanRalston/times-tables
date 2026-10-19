import { useState } from "react";
import { squisheeById } from "@/lib/squishees";
import { bondName, bondScore, bondTier } from "../buddy/bond";
import { bookEntries, catchphrase } from "../buddy/cast";
import { ownedIds } from "../buddy/unlock";
import { bossForGame } from "../bosses";
import { GAMES } from "../games/registry";
import { bandFor } from "../grade-map";
import { bossReady, dailySnapshot, normalizeJourney } from "../journey";
import { show, t } from "../i18n";
import { todayIso, type Child } from "../model";
import { nextPlacement, todayPlayLine } from "../placement";
import { rollGift, type GiftRoll } from "../rewards";
import { outfitLabel } from "../wardrobe";
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
  const daily = dailySnapshot(child, todayId);
  const journey = normalizeJourney(child.journey, child.grade);
  const place = nextPlacement(child);
  const facing = bossReady(journey, journey.areaId, child.grade) && place.reason !== "weak";
  const playId = facing ? journey.areaId : place.game;
  const playLevel = facing ? (child.levels[journey.areaId] ?? place.level) : place.level;
  const playTitle = GAMES.find((game) => game.id === playId)?.title ?? playId;
  const todayLine = todayPlayLine(show(playTitle), child.grade);
  const playAction = facing
    ? t(`Face ${bossForGame(playId).name}`, `Enfrenta a ${bossForGame(playId).name}`)
    : show("Play");
  const book = bookEntries();
  const palTier = bondTier(bondScore(child.bonds, child.avatarId));

  return (
    <div className={cx("ac-shell", child.grade === "PK" && "is-prek")}>
      <header className="ac-top">
        <Logo />
        <a className="ac-island-link" href="#/map">
          {show("Island")}
        </a>
      </header>

      <section className="ac-hero">
        <div className="ac-pals">
          <PalWithLook id={child.avatarId} cosmetic={child.equipped} lookId={child.equippedLook} className="is-mid" label={child.name} />
        </div>
        <p className="ac-bubble">{catchphrase(child.avatarId)}</p>
        <p className="ac-bond" data-bond={palTier}>
          {squisheeById(child.avatarId)?.name ?? show("Buddy")} · {bondName(palTier)}
        </p>
        <h1>
          {t(`Hi ${child.name}! Ready to play?`, `¡Hola ${child.name}! ¿Listo para jugar?`)}
        </h1>
        <p className="ac-lede">{show("Short games · hop the island · collect squishees")}</p>
        <div className="ac-daily" data-daily-rounds={daily.rounds} data-daily-goal={daily.goal} data-gift={daily.ready ? "closed" : daily.claimed ? "open" : "none"}>
          <ProgressRing
            value={daily.rounds}
            max={daily.goal}
            label={t(`${daily.rounds} of ${daily.goal} rounds today`, `${daily.rounds} de ${daily.goal} rondas hoy`)}
          />
          <button
            type="button"
            className={cx("ac-gift", daily.ready && "is-ready", (daily.claimed || prize != null) && "is-open")}
            disabled={!daily.ready}
            aria-label={
              daily.ready ? show("Open today's gift") : daily.claimed ? show("Today's gift is open") : show("Gift at 3 rounds")
            }
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
          data-play-game={playId}
          data-play-level={playLevel}
          aria-label={`${playAction}. ${todayLine}`}
          onClick={() => onPlay(playId, playLevel)}
        >
          <span className="ac-play-tri" aria-hidden="true" />
          <span className="ac-play-copy">
            <strong>{playAction}</strong>
            <small>{todayLine}</small>
          </span>
        </button>
        <a className="ac-map-link" href="#/map">
          {show("Island map")}
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
                  setToast(t(`${game.title} is coming later for this grade.`, `${show(game.title)} llega más adelante para este grado.`));
                  window.setTimeout(() => setToast(null), 1800);
                }}
              >
                <span className="ac-soon">
                  <LockIcon /> {show("Later")}
                </span>
                <SquisheeImg id={game.mascot} />
                <h2>{show(game.title)}</h2>
                <p>{show("Coming later")}</p>
              </button>
            );
          }
          return (
            <a key={game.id} className={`ac-card is-${game.tint}`} data-offer={offer} href={`#/play/${game.id}`}>
              {journey.areaId === game.id ? (
                <span className="ac-soon">{show("Here")}</span>
              ) : offer === "intro" ? (
                <span className="ac-soon">{show("Intro")}</span>
              ) : null}
              <SquisheeImg id={game.mascot} />
              <h2>{show(game.title)}</h2>
              <p>{offer === "intro" ? show("Gentle intro") : show(game.audience)}</p>
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
            <small>{show("stars")}</small>
          </span>
        </a>
        <a className="ac-meter" href="#/shelf">
          <AcademyPal id={child.avatarId} cosmetic={child.equipped} className="ac-meter-pal" />
          <span>
            <strong>
              {ownedIds(child).length}/{book.length}
            </strong>
            <small>{show("book")}</small>
          </span>
        </a>
        <a className="ac-meter" href="#/shelf">
          <span className="ac-meter-ico" aria-hidden="true">
            ●
          </span>
          <span>
            <strong>{child.coins}</strong>
            <small>{show("coins")}</small>
          </span>
        </a>
      </div>

      <Foot />
      {toast ? (
        <div className="ac-toast" role="status">
          {toast}
        </div>
      ) : null}
      {prize ? (
        <div className="ac-modal" role="dialog" aria-label={show("Daily gift")}>
          <div className="ac-modal-card ac-prize">
            <GiftBox open />
            <h2>{show("Daily gift!")}</h2>
            <PrizeBody prize={prize} />
            <button type="button" className="ac-go" onClick={() => setPrize(null)}>
              {show("Nice!")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PrizeBody({ prize }: { prize: GiftRoll }) {
  if (prize.kind === "coins") return <p>{t(`${prize.amount} coins for the shelf.`, `${prize.amount} monedas para la tienda.`)}</p>;
  if (prize.kind === "cosmetic") {
    return (
      <p>
        {t("A new outfit:", "Un disfraz nuevo:")} <strong>{outfitLabel(prize.id)}</strong>
      </p>
    );
  }
  const pal = squisheeById(prize.id);
  const name = pal?.name ?? t("A friend", "Un amigo");
  return (
    <p>
      <AcademyPal id={prize.id} className="ac-done-pal" label={pal?.name ?? ""} />
      {t(`${name} hopped in.`, `${name} llegó de un salto.`)}
    </p>
  );
}

