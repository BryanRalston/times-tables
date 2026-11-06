import { useState } from "react";
import { squisheeById } from "@/lib/squishees";
import { bondName, bondScore, bondTier } from "../buddy/bond";
import { bookEntries, catchphrase } from "../buddy/cast";
import { ownedIds } from "../buddy/unlock";
import { GAME_CARDS as GAMES } from "../games/catalog";
import { bandFor } from "../grade-map";
import { dailySnapshot, normalizeJourney, subjectSpot } from "../journey";
import { show, t } from "../i18n";
import { todayIso, type AppLang, type Child } from "../model";
import { todayPlayLine } from "../placement";
import { activeSubject, forYouToday, nextFor, playHref, subjectById, subjectGames, subjectName, subjectTrail, visibleSubjects, type SubjectId } from "../subjects";
import { nextAction, pickTag } from "./next-copy";
import { rollGift, type GiftRoll } from "../rewards";
import { outfitLabel } from "../wardrobe";
import { chime } from "../sound";
import { WeekStickers } from "./stickers";
import { storiesOffered } from "../stories/offer";
import { AcademyPal, BackLink, Foot, GiftBox, LockIcon, Logo, Pips, PlayMark, ProgressRing, SquisheeImg, cx } from "./bits";
import { LanguageButton, PlayLanguages } from "./lang";
import { PalWithLook } from "./boss-figure";

export function HomeScreen({
  child,
  lang,
  sound,
  onClaim,
  onLang,
  onSubject,
  onPlay,
}: {
  child: Child;
  lang: AppLang;
  sound: boolean;
  onClaim: () => void;
  onLang: (lang: AppLang) => void;
  onSubject: (subject: SubjectId) => void;
  onPlay: (game: string, level: string) => void;
}) {
  const [prize, setPrize] = useState<GiftRoll | null>(null);
  const todayId = todayIso();
  const daily = dailySnapshot(child, todayId);
  const subject = activeSubject(child);
  const subjects = visibleSubjects(child);
  const step = nextFor(child, subject);
  const copy = nextAction(step, "home");
  const todayLine = todayPlayLine(copy.title, child.grade);
  const picks = forYouToday(child, subject);
  const info = subjectById(subject);
  const more = subjectGames(subject);
  const book = bookEntries();
  const palTier = bondTier(bondScore(child.bonds, child.avatarId));

  return (
    <div className={cx("ac-shell", child.grade === "PK" && "is-prek")}>
      <header className="ac-top">
        <Logo />
        <div className="ac-top-tools">
          <LanguageButton lang={lang} onLang={onLang} />
        </div>
      </header>

      <section className="ac-hero">
        <h1>
          {t(`Hi ${child.name}! Ready to play?`, `¡Hola ${child.name}! ¿Listo para jugar?`, `Oi ${child.name}! Vamos jogar?`, `Salut ${child.name} ! Tu veux jouer ?`, `${child.name}，你好！准备好玩了吗？`, `नमस्ते ${child.name}! खेलने के लिए तैयार?`, `مرحبًا ${child.name}! هل أنت مستعد للعب؟`)}
        </h1>
        <p className="ac-lede">{show("Short games · hop the island · collect squishees")}</p>
        <PlayLanguages />
        {subjects.length > 1 ? (
          <div className="ac-subjects" role="tablist" aria-label={t("Subjects", "Materias", "Matérias", "Matières", "科目", "विषय", "المواد")}>
            {subjects.map((row) => (
              <button
                key={row.id}
                type="button"
                role="tab"
                aria-selected={row.id === subject}
                className={cx("ac-subject", `is-${row.id}`, row.id === subject && "is-on")}
                data-subject={row.id}
                onClick={() => onSubject(row.id)}
              >
                <SquisheeImg id={row.icon} squish="off" />
                <span>{subjectName(row.id)}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="ac-play-stage">
          <div className="ac-play-pal">
            <div className="ac-pals">
              <PalWithLook id={child.avatarId} cosmetic={child.equipped} lookId={child.equippedLook} className="is-mid" label={child.name} />
            </div>
            <p className="ac-bubble">{catchphrase(child.avatarId)}</p>
            <p className="ac-bond" data-bond={palTier}>
              {squisheeById(child.avatarId)?.name ?? show("Buddy")} · {bondName(palTier)}
            </p>
          </div>
          <button
            type="button"
            className="ac-go ac-play-main"
            data-subject={subject}
            data-placement={step.reason}
            data-play-game={step.game}
            data-play-level={step.level}
            aria-label={`${copy.action}. ${todayLine}`}
            onClick={() => {
              if (step.game) onPlay(step.game, step.level);
              else window.location.hash = step.href;
            }}
          >
            <PlayMark />
            <span className="ac-play-copy">
              <strong>{copy.action}</strong>
              <small>{todayLine}</small>
            </span>
          </button>
        </div>
        <div className="ac-daily" data-daily-rounds={daily.rounds} data-daily-goal={daily.goal} data-gift={daily.ready ? "closed" : daily.claimed ? "open" : "none"}>
          <ProgressRing
            value={daily.rounds}
            max={daily.goal}
            label={t(`${daily.rounds} of ${daily.goal} rounds today`, `${daily.rounds} de ${daily.goal} rondas hoy`, `${daily.rounds} de ${daily.goal} rodadas hoje`, `${daily.rounds} sur ${daily.goal} manches aujourd'hui`, `今天${daily.rounds}轮，一共${daily.goal}轮`, `आज ${daily.goal} में से ${daily.rounds} राउंड`, `${daily.rounds} من ${daily.goal} جولات اليوم`)}
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
      </section>

      <section className="ac-foryou" data-subject={subject} aria-labelledby="ac-foryou-h">
        <h2 id="ac-foryou-h">{t("For you today", "Para ti hoy", "Para você hoje", "Pour toi aujourd'hui", "今天给你", "आज तुम्हारे लिए", "لك اليوم")}</h2>
        <div className="ac-foryou-list">
          {picks.map((pick) => {
            const game = GAMES.find((row) => row.id === pick.game);
            if (!game) return null;
            return (
              <a
                key={pick.game}
                className={`ac-pick is-${game.tint}`}
                data-pick={pick.game}
                data-reason={pick.reason}
                href={playHref(pick.game, "home")}
                onClick={(event) => {
                  event.preventDefault();
                  onPlay(pick.game, pick.level);
                }}
              >
                <SquisheeImg id={game.mascot} squish="off" />
                <span className="ac-pick-copy">
                  <strong>{show(game.title)}</strong>
                  <small>{pickTag(pick.reason)}</small>
                </span>
                <Pips value={child.bestStars[game.id] ?? 0} />
              </a>
            );
          })}
          {info.stories && storiesOffered() ? (
            <a className="ac-pick is-sky" href="#/stories" data-stories="open">
              <SquisheeImg id="owl" squish="off" />
              <span className="ac-pick-copy">
                <strong>{show("Stories")}</strong>
                <small>{show("Read along")}</small>
              </span>
            </a>
          ) : null}
        </div>
        <div className="ac-subject-links">
          {more.length > picks.length ? (
            <a className="ac-quiet ac-quiet-link" href={`#/games/${subject}`} data-more={subject}>
              {moreGamesLabel(subject, more.length)}
            </a>
          ) : null}
          {subjectTrail(child, subject).length > 0 ? (
            <a className="ac-quiet ac-quiet-link ac-map-link" href={`#/map/${subject}`} data-map={subject}>
              {islandLabel(subject)}
            </a>
          ) : null}
        </div>
      </section>

      {!info.stories && storiesOffered() ? (
        <a className="ac-stories-card" href="#/stories" data-stories="open">
          <SquisheeImg id="owl" squish="off" />
          <span>
            <strong>{show("Stories")}</strong>
            <small>{show("Read along")}</small>
          </span>
        </a>
      ) : null}

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
  if (prize.kind === "coins") return <p>{t(`${prize.amount} coins for the shelf.`, `${prize.amount} monedas para la tienda.`, `${prize.amount} moedas para a loja.`, `${prize.amount} pièces pour la boutique.`, `${prize.amount}个金币放到架子上。`, `शेल्फ के लिए ${prize.amount} सिक्के।`, `${prize.amount} عملات للرف.`)}</p>;
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
      {t(`${name} hopped in.`, `${name} llegó de un salto.`, `${name} chegou pulando.`, `${name} arrive d'un bond.`, `${name}跳进来了。`, `${name} अंदर कूद पड़ा।`, `${name} قفز إلى الداخل.`)}
    </p>
  );
}


function moreGamesLabel(subject: SubjectId, count: number): string {
  const name = subjectName(subject);
  return t(`All ${name} games · ${count}`, `Todos los juegos de ${name} · ${count}`, `Todos os jogos de ${name} · ${count}`, `Tous les jeux de ${name} · ${count}`, `全部${name}游戏 · ${count}`, `${name} के सभी खेल · ${count}`, `كل ألعاب ${name} · ${count}`);
}

export function islandLabel(subject: SubjectId): string {
  const name = subjectName(subject);
  return t(`${name} island map`, `Mapa de la isla de ${name}`, `Mapa da ilha de ${name}`, `Carte de l'île ${name}`, `${name}岛地图`, `${name} द्वीप का नक्शा`, `خريطة جزيرة ${name}`);
}

/** One game tile. Coming-later games stay visible with a lock and a short note. */
function GameTile({ gameId, child, here, onLater }: { gameId: string; child: Child; here: boolean; onLater: (text: string) => void }) {
  const game = GAMES.find((row) => row.id === gameId);
  if (!game) return null;
  const offer = bandFor(game.id, child.grade)?.offer ?? "play";
  const open = offer !== "later" || child.challengeAhead;
  if (!open) {
    return (
      <button
        type="button"
        className={`ac-card is-${game.tint} is-soon`}
        data-offer="later"
        onClick={() =>
          onLater(t(`${game.title} is coming later for this grade.`, `${show(game.title)} llega más adelante para este grado.`, `${show(game.title)} chega mais tarde para este ano.`, `${show(game.title)} arrive plus tard pour cette classe.`, `这个年级稍后才会有${show(game.title)}。`, `${show(game.title)} इस कक्षा के लिए बाद में आएगा।`, `${show(game.title)} يأتي لاحقًا لهذا الصف.`))
        }
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
    <a className={`ac-card is-${game.tint}`} data-offer={offer} href={playHref(game.id, "games")}>
      {here ? <span className="ac-soon">{show("Here")}</span> : offer === "intro" ? <span className="ac-soon">{show("Intro")}</span> : null}
      <SquisheeImg id={game.mascot} />
      <h2>{show(game.title)}</h2>
      <p>{offer === "intro" ? show("Gentle intro") : show(game.audience)}</p>
      <Pips value={child.bestStars[game.id] ?? 0} />
    </a>
  );
}

/** A subject's full game list, opened from "All … games" on Home. */
export function SubjectGamesScreen({ child, subject }: { child: Child; subject: SubjectId }) {
  const [toast, setToast] = useState<string | null>(null);
  const journey = normalizeJourney(child.journey, child.grade);
  const info = subjectById(subject);
  return (
    <div className={cx("ac-shell", child.grade === "PK" && "is-prek")} data-games={subject}>
      <header className="ac-top">
        <BackLink href="#/">{show("Back")}</BackLink>
        <Logo />
      </header>
      <div className="ac-subject-head">
        <SquisheeImg id={info.icon} squish="off" />
        <h1>{subjectName(subject)}</h1>
      </div>
      <div className="ac-grid">
        {subjectGames(subject).map((id) => (
          <GameTile
            key={id}
            gameId={id}
            child={child}
            here={subjectSpot(journey, subject).areaId === id}
            onLater={(text) => {
              setToast(text);
              window.setTimeout(() => setToast(null), 1800);
            }}
          />
        ))}
      </div>
      {info.stories && storiesOffered() ? (
        <a className="ac-stories-card" href="#/stories" data-stories="open">
          <SquisheeImg id="owl" squish="off" />
          <span>
            <strong>{show("Stories")}</strong>
            <small>{show("Read along")}</small>
          </span>
        </a>
      ) : null}
      <Foot />
      {toast ? (
        <div className="ac-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
