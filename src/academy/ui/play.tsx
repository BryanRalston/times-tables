import { useEffect, useMemo, useRef, useState } from "react";
import { squisheeById } from "@/lib/squishees";
import { rngRandom } from "@/lib/rng";
import { gameById, pillLabel } from "../games/registry";
import { bossReady, bossWon } from "../journey";
import {
  ROUND_LENGTH,
  ROUND_SECONDS,
  type Child,
  type RoundResult,
} from "../model";
import { makeBossRound, makeRound, type ChoiceQ } from "../questions";
import { coinsForRound, newestUnlock, starsForRound, weakTimesFacts } from "../rewards";
import { blip, chime } from "../sound";
import { CoinRow } from "./coins";
import { Flame, SpeakerIcon, SquisheeImg, Stars, cx, fmtSeconds } from "./bits";

function Confetti() {
  return (
    <div className="ac-confetti" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 17) % 100}%`, animationDelay: `${(i % 6) * 0.07}s` }} />
      ))}
    </div>
  );
}

export function PlayScreen({
  child,
  game,
  sound,
  onExit,
  onRound,
  onLevel,
  onAck,
  onToggleSound,
}: {
  child: Child;
  game: string;
  sound: boolean;
  onExit: () => void;
  onRound: (result: RoundResult) => void;
  onLevel: (level: string) => void;
  onAck: () => void;
  onToggleSound: () => void;
}) {
  const level = child.levels[game];
  const [roundId, setRoundId] = useState(0);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"ask" | "feedback" | "done">("ask");
  const [picked, setPicked] = useState<string | null>(null);
  const [results, setResults] = useState<RoundResult["answers"]>([]);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [menu, setMenu] = useState(false);
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [met, setMet] = useState(false);

  const weakRef = useRef(weakTimesFacts(child.skills));
  const startStarsRef = useRef(child.stars);
  const resultsRef = useRef(results);
  const finishedRef = useRef(false);
  const startedRef = useRef(Date.now());
  const waitRef = useRef<number | null>(null);
  const menuRef = useRef(false);
  const phaseRef = useRef(phase);
  const onRoundRef = useRef(onRound);
  const chooseRef = useRef<(value: string) => void>(() => {});
  const bestRef = useRef(0);
  const soundRef = useRef(sound);
  const bossSnap = useRef<{ roundId: number; boss: boolean }>({ roundId: -1, boss: false });
  if (bossSnap.current.roundId !== roundId) {
    bossSnap.current = { roundId, boss: bossReady(child.journey, game) };
  }
  const boss = bossSnap.current.boss;
  menuRef.current = menu;
  phaseRef.current = phase;
  onRoundRef.current = onRound;
  resultsRef.current = results;
  soundRef.current = sound;

  const questions = useMemo(
    () =>
      boss
        ? makeBossRound(game, level, rngRandom())
        : makeRound(game, level, rngRandom(), ROUND_LENGTH, weakRef.current),
    [boss, game, level, roundId],
  );

  function restart() {
    if (waitRef.current) window.clearTimeout(waitRef.current);
    weakRef.current = weakTimesFacts(child.skills);
    startStarsRef.current = child.stars;
    finishedRef.current = false;
    phaseRef.current = "ask";
    resultsRef.current = [];
    startedRef.current = Date.now();
    setRoundId((n) => n + 1);
    setIndex(0);
    setPhase("ask");
    setPicked(null);
    setResults([]);
    setCombo(0);
    setBestCombo(0);
    bestRef.current = 0;
    setLeft(ROUND_SECONDS);
    setMenu(false);
    setUnlockId(null);
    setMet(false);
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (waitRef.current) window.clearTimeout(waitRef.current);
    const answers = resultsRef.current;
    const correct = answers.filter((mark) => mark.ok).length;
    const earned = starsForRound(correct, questions.length);
    setUnlockId(newestUnlock(startStarsRef.current, startStarsRef.current + earned));
    setBestCombo(bestRef.current);
    setPhase("done");
    const seconds = Math.min(180, Math.max(1, Math.round((Date.now() - startedRef.current) / 1000)));
    onRoundRef.current({
      game,
      correct,
      total: questions.length,
      seconds,
      answers,
      bestCombo: bestRef.current,
      boss,
    });
  }

  const finishRef = useRef(finish);
  finishRef.current = finish;

  function choose(value: string) {
    if (!value || phaseRef.current !== "ask" || menuRef.current || finishedRef.current) return;
    phaseRef.current = "feedback";
    const q = questions[index];
    if (!q) return;
    const ok = value === q.answer;
    const mark = { skill: q.skill, tags: q.tags, factKey: q.factKey, ok };
    const nextResults = [...resultsRef.current, mark];
    resultsRef.current = nextResults;
    setResults(nextResults);
    setPicked(value);
    setPhase("feedback");
    const nextCombo = ok ? combo + 1 : 0;
    if (ok) bestRef.current = Math.max(bestRef.current, nextCombo);
    setCombo(nextCombo);
    blip(ok, sound);
    waitRef.current = window.setTimeout(() => {
      if (index + 1 >= questions.length) finishRef.current();
      else {
        setIndex(index + 1);
        setPhase("ask");
        setPicked(null);
      }
    }, 850);
  }
  chooseRef.current = choose;

  function close() {
    if (finishedRef.current) {
      onExit();
      return;
    }
    if (resultsRef.current.length > 0) finish();
    else onExit();
  }

  useEffect(() => {
    if (phase === "done") return;
    const id = window.setInterval(() => {
      setLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, roundId]);

  useEffect(() => {
    if (left === 0 && phase !== "done") finishRef.current();
  }, [left, phase]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (menuRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) chooseRef.current(questions[index]?.choices[n - 1] ?? "");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, questions]);

  useEffect(() => {
    return () => {
      if (waitRef.current) window.clearTimeout(waitRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "done") return;
    const stars = starsForRound(resultsRef.current.filter((mark) => mark.ok).length, questions.length);
    chime(stars === 3 ? "cheer" : "coin", soundRef.current);
  }, [phase, questions.length, roundId]);

  const correct = results.filter((mark) => mark.ok).length;
  const liveStars = starsForRound(correct, questions.length);
  const q: ChoiceQ | undefined = questions[index];
  const spec = gameById(game);
  const mascot = spec?.mascot ?? "peach";
  const friend = unlockId ? squisheeById(unlockId) : undefined;
  const reveal = phase === "feedback";
  const ok = reveal && picked === q?.answer;

  return (
    <div className={cx("ac-shell", spec?.layout === "wide" && "ac-wide")}>
      <header className="ac-play-top">
        <button type="button" className="ac-x" onClick={close} aria-label="Close">
          ×
        </button>
        <button
          type="button"
          className={cx("ac-mute", !sound && "is-off")}
          aria-pressed={!sound}
          aria-label={sound ? "Mute sounds" : "Turn sounds on"}
          onClick={onToggleSound}
        >
          <SpeakerIcon muted={!sound} />
        </button>
        <div
          className={cx("ac-timer", `is-${game}`)}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={ROUND_SECONDS}
          aria-valuenow={left}
          aria-label="Time left"
        >
          <span style={{ width: `${(left / ROUND_SECONDS) * 100}%` }} />
        </div>
        <div className="ac-clock-read">{fmtSeconds(left)}</div>
      </header>

      {phase === "done" ? (
        <section className="ac-done" data-confetti={liveStars === 3 ? "on" : "off"} data-boss={boss ? "yes" : "no"}>
          {liveStars === 3 ? <Confetti /> : null}
          <SquisheeImg id={friend && !met ? friend.id : mascot} className="ac-done-pal" label={friend?.name ?? ""} />
          <h1>
            {boss && bossWon(correct, questions.length)
              ? "Boss beaten!"
              : boss
                ? "Nice try!"
                : correct >= questions.length
                  ? "Perfect round!"
                  : liveStars === 3
                    ? "So close!"
                    : liveStars === 2
                      ? "Nice work!"
                      : "You stuck with it!"}
          </h1>
          <Stars value={liveStars} className="ac-stars-big" />
          <p>
            {correct} of {questions.length} · {liveStars} {liveStars === 1 ? "star" : "stars"} · +
            {coinsForRound(correct, questions.length, bestCombo, boss)} coins
          </p>
          {boss ? (
            <p className="ac-hint">
              {bossWon(correct, questions.length)
                ? "The next island is open."
                : "The boss is still there. You can try again."}
            </p>
          ) : null}
          {friend && !met ? (
            <div className="ac-unlock">
              <p>New friend!</p>
              <h2>{friend.name} hopped in</h2>
              <button
                type="button"
                className="ac-go"
                onClick={() => {
                  setMet(true);
                  onAck();
                }}
              >
                Meet {friend.name}
              </button>
            </div>
          ) : null}
          <div className="ac-done-actions">
            <button type="button" className="ac-go" onClick={restart}>
              Play again
            </button>
            <a className="ac-quiet ac-quiet-link" href="#/map">
              Island map
            </a>
            <button type="button" className="ac-quiet" onClick={onExit}>
              Home
            </button>
          </div>
        </section>
      ) : q ? (
        <>
          <div className="ac-play-meta">
            {results.length === 0 && !boss ? (
              <button type="button" className="ac-pill" onClick={() => setMenu(true)}>
                {pillLabel(game, level)}
              </button>
            ) : (
              <span className="ac-pill">{boss ? "Boss round" : pillLabel(game, level)}</span>
            )}
            <Stars value={liveStars} />
          </div>
          <div className={cx("ac-stage", spec?.layout === "wide" && "is-time", reveal && (ok ? "is-yes" : "is-try"))}>
            {spec?.Aside ? <spec.Aside question={q} /> : null}
            <div className="ac-stage-main">
              {spec ? <spec.Prompt question={q} reveal={reveal} mascot={mascot} happy={ok} /> : null}
              <div className="ac-choices">
                {q.choices.map((choice) => {
                  const cls =
                    phase !== "feedback"
                      ? ""
                      : choice === q.answer
                        ? "is-yes"
                        : choice === picked
                          ? "is-no"
                          : "is-dim";
                  const pile = q.visual.kind === "money" ? q.visual.piles?.[choice] : undefined;
                  const label = q.visual.kind === "money" && q.visual.labels?.[choice] ? q.visual.labels[choice] : choice;
                  return (
                    <button
                      key={choice}
                      type="button"
                      className={cx("ac-choice", pile && "is-coins", cls)}
                      aria-label={label}
                      onClick={() => choose(choice)}
                    >
                      {pile ? <CoinRow pile={pile} label={label} /> : choice}
                    </button>
                  );
                })}
              </div>
              <div className={cx("ac-banner", reveal && (ok ? "is-yes" : "is-no"))} aria-live="polite">
                {reveal ? (ok ? q.praise : q.almost) : ""}
              </div>
            </div>
          </div>
          <div className="ac-combo-row">
            <div
              className="ac-combo"
              data-combo={combo}
              role="meter"
              aria-valuemin={0}
              aria-valuemax={5}
              aria-valuenow={Math.min(5, combo)}
              aria-label={combo >= 2 ? `Combo ${combo}` : "Combo"}
            >
              <span style={{ width: `${Math.min(100, (combo / 5) * 100)}%` }} />
            </div>
            <small>{combo >= 2 ? `Combo ×${combo}` : "Combo"}</small>
          </div>
          <div className="ac-qdots" aria-hidden="true">
            {questions.map((_, i) => {
              const mark = results[i];
              const cls = mark ? (mark.ok ? "is-ok" : "is-miss") : i === index ? "is-now" : "";
              return <i key={questions[i]?.id ?? i} className={cls} />;
            })}
          </div>
          <p className="ac-qmeta">
            Question {index + 1} of {questions.length}
            {combo >= 2 ? (
              <>
                {" "}
                · <Flame /> nice streak
              </>
            ) : null}
          </p>
        </>
      ) : null}

      {menu ? (
        <div className="ac-modal" role="dialog" aria-label="Pick a level">
          <div className="ac-modal-card">
            <h2>Pick a level</h2>
            <p className="ac-hint">Starts a new round.</p>
            {(spec?.levels ?? []).map((row) => (
              <button
                key={row.id}
                type="button"
                className={cx("ac-level", row.id === level && "is-on")}
                onClick={() => {
                  setMenu(false);
                  if (row.id === level) return;
                  onLevel(row.id);
                  restart();
                }}
              >
                <strong>Level {row.num}</strong>
                <small>{row.label}</small>
              </button>
            ))}
            <button type="button" className="ac-quiet" onClick={() => setMenu(false)}>
              Keep playing
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
