import { useState } from "react";
import {
  gameTitle,
  gradeLabel,
  mascotFor,
  todayIso,
  type Child,
  type GameId,
} from "../model";
import { gameOfDay, giftCount, unlockedCount } from "../rewards";
import { Flame, Foot, LockIcon, Logo, SquisheeImg, Stars } from "./bits";

const CARDS: { id: GameId | "words"; title: string; audience: string; tint: string; mascot: string }[] = [
  { id: "times", title: "Times Tables", audience: "Grade 2–3", tint: "pink", mascot: "peach" },
  { id: "add", title: "Add & Subtract", audience: "K–2", tint: "mint", mascot: "frog" },
  { id: "time", title: "Telling Time", audience: "Grade 1–3", tint: "sun", mascot: "melon" },
  { id: "words", title: "Sight Words", audience: "K–1", tint: "lav", mascot: "grape" },
];

export function HomeScreen({ child }: { child: Child }) {
  const [toast, setToast] = useState<string | null>(null);
  const today = gameOfDay(todayIso());
  const gifts = giftCount(child);
  const pals = ["frog", "peach", "bunny"];

  return (
    <div className="ac-shell">
      <header className="ac-top">
        <Logo />
        {child.streak > 0 ? (
          <div className="ac-streak" aria-label={`${child.streak} day streak`}>
            <Flame /> {child.streak}-day streak
          </div>
        ) : (
          <div className="ac-streak">
            <Flame /> Let’s play
          </div>
        )}
      </header>

      <section className="ac-hero">
        <div className="ac-pals">
          {pals.map((id) => (
            <SquisheeImg key={id} id={id} className={id === "peach" ? "is-mid" : ""} />
          ))}
        </div>
        <h1>Hi {child.name}! Ready to play?</h1>
        <p className="ac-lede">2-minute games · earn stars · unlock squishees</p>
        <a className="ac-go" href={`#/play/${today}`}>
          <span className="ac-play-tri" aria-hidden="true" /> Play today&apos;s game
        </a>
      </section>

      <div className="ac-grid">
        {CARDS.map((card) => {
          if (card.id === "words") {
            return (
              <button
                key={card.id}
                type="button"
                className={`ac-card is-${card.tint} is-soon`}
                onClick={() => {
                  setToast("Sight words are coming soon.");
                  window.setTimeout(() => setToast(null), 1800);
                }}
              >
                <span className="ac-soon">
                  <LockIcon /> Soon
                </span>
                <SquisheeImg id={card.mascot} />
                <h2>{card.title}</h2>
                <p>{card.audience}</p>
              </button>
            );
          }
          const game = card.id;
          return (
            <a key={game} className={`ac-card is-${card.tint}`} href={`#/play/${game}`}>
              <SquisheeImg id={mascotFor(game)} />
              <h2>{card.title}</h2>
              <p>{card.audience}</p>
              <Stars value={child.bestStars[game]} />
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
          <SquisheeImg id={child.avatarId} className="ac-meter-pal" />
          <span>
            <strong>
              {unlockedCount(child.stars)}/{24}
            </strong>
            <small>squishees</small>
          </span>
        </a>
        <a className="ac-meter" href="#/shelf">
          <span className="ac-meter-ico" aria-hidden="true">
            🎁
          </span>
          <span>
            <strong>{gifts}</strong>
            <small>{gifts === 1 ? "gift" : "gifts"}</small>
          </span>
        </a>
      </div>

      <p className="ac-today-note">
        Today: {gameTitle(today)} · {gradeLabel(child.grade)}
      </p>
      <Foot />
      {toast ? (
        <div className="ac-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
