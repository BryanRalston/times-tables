import { useState } from "react";
import { squisheeById } from "@/lib/squishees";
import { catchphrase } from "../buddy/cast";
import { hatchPick } from "../buddy/egg";
import { hostIdFor } from "../buddy/hosts";
import { ownedIds } from "../buddy/unlock";
import { bossForGame } from "../bosses";
import { GAME_CARDS as GAMES, gameCard as gameById } from "../games/catalog";
import { gameOffered } from "../games/offer";
import { bandFor } from "../grade-map";
import { areaIndex, areaOpen, bossReady, normalizeJourney } from "../journey";
import { show, t } from "../i18n";
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
    <div className={cx("ac-shell ac-map-shell", child.grade === "PK" && "is-prek")}>
      <header className="ac-top">
        <Logo />
        <PalWithLook id={child.avatarId} cosmetic={child.equipped} lookId={child.equippedLook} className="ac-meter-pal" label={child.name} />
      </header>
      <h1>{show("Island map")}</h1>
      <p className="ac-lede">{t("Finish a round to hop. Beat the boss to befriend the host.", "Termina una ronda para saltar. Vence al jefe para hacerte amigo del anfitrión.")}</p>
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
            {show("Hatch the egg")}
          </button>
        ) : eggOpen ? (
          <p>{show("The egg hatched today.")}</p>
        ) : (
          <p>
            {left === 0
              ? show("Play today to grow the egg.")
              : left === 1
                ? t(`${left} more round and the egg hatches.`, `${left} ronda más y se abre el huevo.`, `${left} rodada a mais e o ovo abre.`, `${left} manche de plus et l'œuf éclot.`, `再玩${left}轮，蛋就破壳啦。`, `${left} और राउंड, और अंडा बाहर आएगा।`, `بعد ${left} جولة أخرى تفقس البيضة.`)
                : t(`${left} more rounds and the egg hatches.`, `${left} rondas más y se abre el huevo.`, `${left} rodadas a mais e o ovo abre.`, `${left} manches de plus et l'œuf éclot.`, `再玩${left}轮，蛋就破壳啦。`, `${left} और राउंड, और अंडा बाहर आएगा।`, `بعد ${left} جولات أخرى تفقس البيضة.`)}
          </p>
        )}
      </div>
      <ol className="ac-islands" data-area={journey.areaId} data-stop={journey.stop}>
        {GAMES.map((game, index) => {
          if (!gameOffered(game.id)) return null;
          const open = areaOpen(journey, index, child.grade);
          const offer = bandFor(game.id, child.grade)?.offer ?? "play";
          const later = offer === "later" && !child.challengeAhead;
          const current = index === here;
          const beaten = journey.bosses.includes(game.id);
          const host = hostIdFor(game.id);
          const hostName = squisheeById(host)?.name ?? show("Host");
          const boss = bossForGame(game.id);
          const atBoss = current && bossReady(journey, game.id, child.grade);
          return (
            <li key={game.id} className={cx("ac-island", `is-${game.tint}`, !open && "is-locked", current && "is-here")} data-host={host}>
              <div className="ac-island-head">
                <AcademyPal id={host} className={cx(!open && "ac-sil")} label={open ? hostName : ""} />
                <div>
                  <h2>{show(game.title)}</h2>
                  {open && !later ? <p className="ac-bubble">{catchphrase(host)}</p> : null}
                  <p>
                    {later
                      ? show("Coming later")
                      : !open
                        ? show("Locked")
                        : beaten
                          ? t(`${hostName} is your friend`, `${hostName} es tu amigo`, `${hostName} é seu amigo`, `${hostName} est ton copain`, `${hostName}是你的朋友`, `${hostName} तुम्हारा दोस्त है`, `${hostName} صديقك`)
                          : current
                            ? show("You are here")
                            : offer === "intro"
                              ? show("Gentle intro")
                              : t(`${hostName} says hi`, `${hostName} te saluda`, `${hostName} cumprimenta você`, `${hostName} te dit bonjour`, `${hostName}向你问好`, `${hostName} नमस्ते कहता है`, `${hostName} يقول مرحبًا`)}
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
                      <em>{show(STOP_NAME[stop] ?? "")}</em>
                    </span>
                  );
                })}
              </div>
              {later ? (
                <p className="ac-hint">{show("Coming later for this grade.")}</p>
              ) : open ? (
                <div className="ac-island-actions">
                  <a className="ac-quiet" href={`#/play/${game.id}`}>
                    {atBoss ? t(`Face ${boss.name}`, `Enfrenta a ${boss.name}`, `Enfrente ${boss.name}`, `Affronte ${boss.name}`, `去见${boss.name}`, `फलक ${boss.name}`, `واجه ${boss.name}`) : current ? show("Play") : offer === "intro" ? show("Gentle intro") : t("Practice", "Practica")}
                  </a>
                  {beaten ? (
                    <a className="ac-quiet" href={`#/play/${game.id}/crown`}>
                      {show("Gold Crown")}
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="ac-hint">
                  <LockIcon />{" "}
                  {(() => {
                    const prev = gameById(GAMES[index - 1]?.id)?.title;
                    return prev
                      ? t(`Beat the ${prev} boss.`, `Vence al jefe de ${show(prev)}.`, `Vença o chefe de ${show(prev)}.`, `Bats le chef de ${show(prev)}.`, `打败${prev}的大魔王。`, `${show(prev)} बॉस को हराओ।`, `اهزم زعيم ${show(prev)}.`)
                      : t("Beat the last boss.", "Vence al jefe anterior.");
                  })()}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <BackLink>{show("Back to games")}</BackLink>
      <Foot />
      {hatchedId ? (
        <div className="ac-modal" role="dialog" aria-label={show("Hatched squishee")}>
          <div className="ac-modal-card ac-prize">
            <AcademyPal id={hatchedId} className="ac-done-pal" label={squisheeById(hatchedId)?.name ?? ""} />
            <h2>
              {t(
                `${squisheeById(hatchedId)?.name ?? "A friend"} hatched!`,
                `¡${squisheeById(hatchedId)?.name ?? "Un amigo"} salió del huevo!`, `${squisheeById(hatchedId)?.name ?? "Um amigo"} saiu do ovo!`,
              `${squisheeById(hatchedId)?.name ?? "Un ami"} vient d'éclore !`, `${squisheeById(hatchedId)?.name ?? "一个朋友"}破壳啦！`, `${squisheeById(hatchedId)?.name ?? "A friend"} बाहर आ गया!`, `${squisheeById(hatchedId)?.name ?? "صديق"} خرج من البيضة!`)}
            </h2>
            <p className="ac-bubble">{catchphrase(hatchedId)}</p>
            <a className="ac-go" href="#/shelf">
              {show("Open the book")}
            </a>
            <button type="button" className="ac-quiet" onClick={() => setHatchedId(null)}>
              {show("Nice!")}
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
