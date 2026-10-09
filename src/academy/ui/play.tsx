import { useEffect, useMemo, useRef, useState } from "react";
import { rngRandom } from "@/lib/rng";
import { squisheeById } from "@/lib/squishees";
import {
  cloneSkills,
  noteMark,
  openingIndex,
  pickServeIndex,
  skillHeat,
  skillKeyForLevel,
  startLadder,
  stepLadder,
  type Ladder,
} from "../adapt";
import { gameById, pillLabel } from "../games/registry";
import { bossReady, bossWon } from "../journey";
import {
  BOSS_LENGTH,
  ROUND_LENGTH,
  ROUND_SECONDS,
  type AnswerMark,
  type Child,
  type RoundResult,
  type SkillStat,
} from "../model";
import { makeBossRound, makeQuestion, type ChoiceQ } from "../questions";
import { coinsForRound, newestUnlock, starsForRound, weakTimesFacts } from "../rewards";
import { blip, chime, teachTone } from "../sound";
import { hintCue, workedExample } from "../teach";
import { silence, speak } from "../voice";
import { Flame, SpeakerIcon, SquisheeImg, Stars, cx, fmtSeconds } from "./bits";
import { CoinRow } from "./coins";
import { WorkedExample } from "./teach-view";

function Confetti() {
  return (
    <div className="ac-confetti" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 17) % 100}%`, animationDelay: `${(i % 6) * 0.07}s` }} />
      ))}
    </div>
  );
}

function servedPill(gameId: string, question: ChoiceQ | undefined, fallbackLevel: string): string {
  const spec = gameById(gameId);
  if (!spec || !question) return pillLabel(gameId, fallbackLevel);
  const prefix = `${gameId}:`;
  const levelId = question.skill.startsWith(prefix) ? question.skill.slice(prefix.length) : "";
  const row = spec.levels.find((level) => level.id === levelId);
  return row ? spec.pill(row) : pillLabel(gameId, fallbackLevel);
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
  const spec = gameById(game);
  const baseIndex = Math.max(0, spec?.levels.findIndex((row) => row.id === level) ?? 0);
  const [roundId, setRoundId] = useState(0);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"ask" | "teach" | "retry" | "feedback" | "done">("ask");
  const [picked, setPicked] = useState<string | null>(null);
  const [results, setResults] = useState<RoundResult["answers"]>([]);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [menu, setMenu] = useState(false);
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [met, setMet] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [nudge, setNudge] = useState<"up" | "down" | null>(null);

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
  const taughtRef = useRef(false);
  const retryFocusRef = useRef<HTMLButtonElement | null>(null);
  const bossSnap = useRef<{ roundId: number; boss: boolean }>({ roundId: -1, boss: false });
  if (bossSnap.current.roundId !== roundId) {
    bossSnap.current = { roundId, boss: bossReady(child.journey, game) };
  }
  const boss = bossSnap.current.boss;
  const skillsRef = useRef<Record<string, SkillStat>>(cloneSkills(child.skills));
  const ladderRef = useRef<Ladder>(startLadder(openingIndex(baseIndex, child.rounds, boss)));
  menuRef.current = menu;
  phaseRef.current = phase;
  onRoundRef.current = onRound;
  resultsRef.current = results;
  soundRef.current = sound;

  function nextQuestion(): ChoiceQ {
    const levels = spec?.levels ?? [];
    const count = Math.max(1, levels.length);
    const heats = levels.map((row) => skillHeat(skillsRef.current[skillKeyForLevel(game, row.id)]));
    const pick = pickServeIndex({
      ladderIndex: ladderRef.current.index,
      levelCount: count,
      heats,
      roll: rngRandom().next(),
    });
    const levelId = levels[pick.index]?.id ?? levels[0]?.id ?? level;
    const prefer = game === "times" ? weakTimesFacts(skillsRef.current) : [];
    return makeQuestion(game, levelId, rngRandom(), prefer);
  }

  const [questions, setQuestions] = useState<ChoiceQ[]>(() =>
    boss ? makeBossRound(game, level, rngRandom()) : [nextQuestion()],
  );
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  function restart(nextLevel = level) {
    if (waitRef.current) window.clearTimeout(waitRef.current);
    const nextSpec = gameById(game);
    const nextBase = Math.max(0, nextSpec?.levels.findIndex((row) => row.id === nextLevel) ?? 0);
    const nextBoss = bossReady(child.journey, game);
    skillsRef.current = cloneSkills(child.skills);
    ladderRef.current = startLadder(openingIndex(nextBase, child.rounds, nextBoss));
    startStarsRef.current = child.stars;
    finishedRef.current = false;
    taughtRef.current = false;
    phaseRef.current = "ask";
    resultsRef.current = [];
    startedRef.current = Date.now();
    const opening = nextBoss ? makeBossRound(game, nextLevel, rngRandom()) : [nextQuestion()];
    questionsRef.current = opening;
    setQuestions(opening);
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
    setHintOn(false);
    setNudge(null);
  }

  const total = boss ? questions.length || BOSS_LENGTH : ROUND_LENGTH;

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (waitRef.current) window.clearTimeout(waitRef.current);
    const answers = resultsRef.current;
    const correct = answers.filter((mark) => mark.ok).length;
    const roundTotal = boss ? questionsRef.current.length || BOSS_LENGTH : ROUND_LENGTH;
    const earned = starsForRound(correct, roundTotal);
    setUnlockId(newestUnlock(startStarsRef.current, startStarsRef.current + earned));
    setBestCombo(bestRef.current);
    setPhase("done");
    const seconds = Math.min(180, Math.max(1, Math.round((Date.now() - startedRef.current) / 1000)));
    onRoundRef.current({
      game,
      correct,
      total: roundTotal,
      seconds,
      answers,
      bestCombo: bestRef.current,
      boss,
    });
  }

  const finishRef = useRef(finish);
  finishRef.current = finish;

  function advance(fromIndex: number) {
    phaseRef.current = "ask";
    taughtRef.current = false;
    const roundTotal = boss ? questionsRef.current.length || BOSS_LENGTH : ROUND_LENGTH;
    if (fromIndex + 1 >= roundTotal) {
      finishRef.current();
      return;
    }
    if (!boss && !questionsRef.current[fromIndex + 1]) {
      const extra = nextQuestion();
      questionsRef.current = [...questionsRef.current, extra];
      setQuestions(questionsRef.current);
    }
    setIndex(fromIndex + 1);
    setPhase("ask");
    setPicked(null);
    setHintOn(false);
  }

  function settle(mark: AnswerMark, fromIndex: number, fromCombo: number) {
    noteMark(skillsRef.current, mark);
    const nextResults = [...resultsRef.current, mark];
    resultsRef.current = nextResults;
    setResults(nextResults);
    if (!boss && spec) {
      const before = ladderRef.current.index;
      const clean = mark.ok && !mark.taught;
      ladderRef.current = stepLadder(ladderRef.current, spec.levels.length, clean);
      const after = ladderRef.current.index;
      setNudge(after > before ? "up" : after < before ? "down" : null);
    }
    const nextCombo = mark.ok && !mark.taught ? fromCombo + 1 : 0;
    if (mark.ok && !mark.taught) bestRef.current = Math.max(bestRef.current, nextCombo);
    setCombo(nextCombo);
    blip(mark.ok, sound, nextCombo);
    waitRef.current = window.setTimeout(() => advance(fromIndex), mark.ok ? 620 : 760);
  }

  function choose(value: string) {
    if (!value || menuRef.current || finishedRef.current) return;
    const asking = phaseRef.current === "ask" || phaseRef.current === "retry";
    if (!asking) return;
    const q = questionsRef.current[index];
    if (!q) return;
    const ok = value === q.answer;
    if (!ok && phaseRef.current === "ask" && !taughtRef.current) {
      phaseRef.current = "teach";
      taughtRef.current = true;
      setPicked(value);
      setCombo(0);
      setHintOn(false);
      setPhase("teach");
      blip(false, sound, 0);
      return;
    }
    phaseRef.current = "feedback";
    setPicked(value);
    setPhase("feedback");
    setHintOn(false);
    settle(
      { skill: q.skill, tags: q.tags, factKey: q.factKey, ok, taught: taughtRef.current },
      index,
      combo,
    );
  }
  chooseRef.current = choose;

  function beginRetry() {
    if (phaseRef.current !== "teach") return;
    phaseRef.current = "retry";
    setPicked(null);
    setPhase("retry");
    speak("Your turn!", soundRef.current);
  }

  function close() {
    silence();
    if (finishedRef.current) {
      onExit();
      return;
    }
    if (resultsRef.current.length > 0) finish();
    else onExit();
  }

  const q: ChoiceQ | undefined = questions[index];
  const example = useMemo(() => (phase === "teach" && q ? workedExample(q) : null), [phase, q]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (phaseRef.current === "done") return;
      setLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [roundId]);

  useEffect(() => {
    if (left === 0 && phase !== "done") finishRef.current();
  }, [left, phase]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (menuRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      if (phaseRef.current !== "ask" && phaseRef.current !== "retry") return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) chooseRef.current(questionsRef.current[index]?.choices[n - 1] ?? "");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  useEffect(() => {
    return () => {
      if (waitRef.current) window.clearTimeout(waitRef.current);
      silence();
    };
  }, []);

  useEffect(() => {
    if (!sound) silence();
  }, [sound]);

  useEffect(() => {
    if (phase !== "ask" || !q) return;
    speak(q.title, sound);
  }, [phase, q, sound]);

  useEffect(() => {
    if (phase !== "teach" || !example) return;
    teachTone(sound);
    speak(example.speech, sound);
  }, [phase, example, sound]);

  useEffect(() => {
    if (phase !== "done") return;
    const stars = starsForRound(resultsRef.current.filter((mark) => mark.ok).length, total);
    chime(stars === 3 ? "cheer" : "coin", soundRef.current);
  }, [phase, total, roundId]);

  useEffect(() => {
    if (phase === "retry") retryFocusRef.current?.focus();
  }, [phase, index]);

  const correct = results.filter((mark) => mark.ok).length;
  const liveStars = starsForRound(correct, total);
  const mascot = spec?.mascot ?? "peach";
  const friend = unlockId ? squisheeById(unlockId) : undefined;
  const reveal = phase === "feedback";
  const ok = reveal && picked === q?.answer;
  const asking = phase === "ask" || phase === "retry";
  const reaction = phase === "feedback" && ok ? (combo >= 3 ? "★" : "✓") : phase === "teach" ? "…" : phase === "feedback" ? "·" : null;

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
            {boss && bossWon(correct, total)
              ? "Boss beaten!"
              : boss
                ? "Nice try!"
                : correct >= total
                  ? "Perfect round!"
                  : liveStars === 3
                    ? "So close!"
                    : liveStars === 2
                      ? "Nice work!"
                      : "You stuck with it!"}
          </h1>
          <Stars value={liveStars} className="ac-stars-big" />
          <p>
            {correct} of {total} · {liveStars} {liveStars === 1 ? "star" : "stars"} · +
            {coinsForRound(correct, total, bestCombo, boss)} coins
          </p>
          {boss ? (
            <p className="ac-hint">
              {bossWon(correct, total)
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
            <button type="button" className="ac-go" onClick={() => restart()}>
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
                {servedPill(game, q, level)}
              </button>
            ) : (
              <span className="ac-pill">{boss ? "Boss round" : servedPill(game, q, level)}</span>
            )}
            <span className="ac-nudge-slot" aria-live="polite">
              {nudge === "up" ? <span className="ac-nudge">Harder</span> : null}
              {nudge === "down" ? <span className="ac-nudge is-down">Easier</span> : null}
            </span>
            {asking && phase === "ask" ? (
              <button
                type="button"
                className="ac-hint-btn"
                aria-pressed={hintOn}
                aria-label="Hint"
                onClick={() => {
                  setHintOn(true);
                  speak(hintCue(q).speech, sound);
                }}
              >
                ?
              </button>
            ) : (
              <span className="ac-hint-spacer" />
            )}
            <Stars value={liveStars} />
          </div>
          <div
            className={cx(
              "ac-stage",
              spec?.layout === "wide" && phase !== "teach" && "is-time",
              reveal && (ok ? "is-yes" : "is-try"),
              reveal && ok && combo >= 3 && "is-streak",
              phase === "teach" && "is-teach",
              hintOn && asking && "is-hint",
            )}
          >
            {reaction ? (
              <span className="ac-react" aria-hidden="true">
                {reaction}
              </span>
            ) : null}
            {phase === "teach" && example ? (
              <div className="ac-stage-main" key={`${q.id}-teach`}>
                <SquisheeImg id={mascot} className="ac-mascot" label="" />
                <WorkedExample example={example} onDone={beginRetry} />
              </div>
            ) : (
              <div className="ac-stage-main" key={q.id}>
                {spec?.Aside ? <spec.Aside question={q} /> : null}
                <div className="ac-stage-copy">
                  {spec ? <spec.Prompt question={q} reveal={reveal} mascot={mascot} happy={ok} /> : null}
                  <div className="ac-choices">
                    {q.choices.map((choice, choiceIndex) => {
                      const cls =
                        phase !== "feedback"
                          ? ""
                          : choice === q.answer
                            ? "is-yes"
                            : choice === picked
                              ? "is-no"
                              : "is-dim";
                      const pile = q.visual.kind === "money" ? q.visual.piles?.[choice] : undefined;
                      const label =
                        q.visual.kind === "money" && q.visual.labels?.[choice] ? q.visual.labels[choice] : choice;
                      return (
                        <button
                          key={choice}
                          ref={choiceIndex === 0 ? retryFocusRef : undefined}
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
                  <div className={cx("ac-banner", reveal && (ok ? "is-yes" : "is-no"), hintOn && !reveal && "is-hint")} aria-live="polite">
                    {reveal ? (ok ? q.praise : q.almost) : hintOn ? hintCue(q).caption : ""}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div
            className="ac-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={results.length}
            aria-label={`Question ${Math.min(total, index + 1)} of ${total}`}
          >
            <span style={{ width: `${(results.length / total) * 100}%` }} />
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
            {Array.from({ length: total }, (_, i) => {
              const mark = results[i];
              const cls = mark ? (mark.ok ? "is-ok" : "is-miss") : i === index ? "is-now" : "";
              return <i key={questions[i]?.id ?? i} className={cls} />;
            })}
          </div>
          <p className="ac-qmeta">
            Question {Math.min(total, index + 1)} of {total}
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
                  restart(row.id);
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
