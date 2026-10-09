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
import { hostIdFor } from "../buddy/hosts";
import { buddyReaction } from "../buddy/react";
import { slotStory } from "../buddy/story";
import { gameById, pillLabel } from "../games/registry";
import { makeClockTask, makePayTask } from "../hands";
import { bossReady, bossWon } from "../journey";
import {
  autoSpeakGrade,
  BOSS_LENGTH,
  ROUND_LENGTH,
  ROUND_SECONDS,
  speedRoundGrade,
  type AnswerMark,
  type Child,
  type RoundResult,
  type SkillStat,
} from "../model";
import { makeBossRound, makeQuestion, type ChoiceQ } from "../questions";
import { coinsForRound, newestUnlock, starsForRound, weakTimesFacts } from "../rewards";
import {
  exampleFor,
  handsOnSlots,
  planReturn,
  similarSlot,
  slotFact,
  speechFor,
  type RoundSlot,
} from "../round-flow";
import { blip, chime, teachTone } from "../sound";
import { hintCue } from "../teach";
import { silence, speak } from "../voice";
import { CoinShare, HostGreet, RoundBuddy } from "./buddy-view";
import { Flame, SpeakerIcon, SquisheeImg, Stars, cx, fmtSeconds } from "./bits";
import { RoundCastProvider } from "./round-cast";
import { CoinRow } from "./coins";
import { ClockBoard, PayBoard } from "./hands";
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

type Dot = "ok" | "helped" | "miss";
type Phase = "ask" | "teach" | "practice" | "feedback" | "done";

interface Served {
  slot: RoundSlot;
  returning: boolean;
}

function blankDots(n: number): (Dot | null)[] {
  return Array.from({ length: n }, () => null);
}

function servedPill(gameId: string, slot: RoundSlot | undefined, fallbackLevel: string): string {
  const spec = gameById(gameId);
  if (!spec || !slot) return pillLabel(gameId, fallbackLevel);
  const skill = slot.kind === "choice" ? slot.question.skill : slot.skill;
  const prefix = `${gameId}:`;
  const levelId = skill.startsWith(prefix) ? skill.slice(prefix.length) : "";
  const row = spec.levels.find((level) => level.id === levelId);
  return row ? spec.pill(row) : pillLabel(gameId, fallbackLevel);
}

function markOf(slot: RoundSlot, ok: boolean, unscored = false): AnswerMark {
  if (slot.kind === "choice") {
    const question = slot.question;
    return {
      skill: question.skill,
      tags: question.tags,
      factKey: question.factKey ?? slotFact(slot),
      ok,
      unscored: unscored || undefined,
    };
  }
  return { skill: slot.skill, tags: [], factKey: slot.factKey, ok, unscored: unscored || undefined };
}

function praiseLine(slot: RoundSlot): string {
  if (slot.kind === "choice") return slot.question.praise;
  if (slot.kind === "clock") return "Yes! The hands show it.";
  return "Yes! That pays the price.";
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
  const calm = autoSpeakGrade(child.grade);
  const canSpeed = speedRoundGrade(child.grade);
  const [roundId, setRoundId] = useState(0);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ask");
  const [dots, setDots] = useState<(Dot | null)[]>(() => blankDots(ROUND_LENGTH));
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [speed, setSpeed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [met, setMet] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [nudge, setNudge] = useState<"up" | "down" | null>(null);
  const [practice, setPractice] = useState<RoundSlot | null>(null);
  const [teachSlot, setTeachSlot] = useState<RoundSlot | null>(null);

  const startStarsRef = useRef(child.stars);
  const finishedRef = useRef(false);
  const startedRef = useRef(Date.now());
  const waitRef = useRef<number | null>(null);
  const menuRef = useRef(false);
  const phaseRef = useRef(phase);
  const onRoundRef = useRef(onRound);
  const answerRef = useRef<(ok: boolean, hint?: boolean) => void>(() => {});
  const bestRef = useRef(0);
  const soundRef = useRef(sound);
  const retryFocusRef = useRef<HTMLButtonElement | null>(null);
  const teachSourceRef = useRef<"scored" | "practice">("scored");
  const practiceTaughtRef = useRef(false);
  const replayHereRef = useRef(false);
  const answersRef = useRef<AnswerMark[]>([]);
  const dotsRef = useRef<(Dot | null)[]>(blankDots(ROUND_LENGTH));
  const indexRef = useRef(0);
  const bossSnap = useRef<{ roundId: number; boss: boolean }>({ roundId: -1, boss: false });
  if (bossSnap.current.roundId !== roundId) {
    bossSnap.current = { roundId, boss: bossReady(child.journey, game) };
  }
  const boss = bossSnap.current.boss;
  const skillsRef = useRef<Record<string, SkillStat>>(cloneSkills(child.skills));
  const ladderRef = useRef<Ladder>(startLadder(openingIndex(baseIndex, child.rounds, boss)));
  const handsRef = useRef<Set<number>>(new Set());
  const returnsRef = useRef<Map<number, RoundSlot>>(new Map());
  menuRef.current = menu;
  phaseRef.current = phase;
  onRoundRef.current = onRound;
  soundRef.current = sound;
  indexRef.current = index;

  function levelNow(): string {
    const levels = spec?.levels ?? [];
    const at = Math.max(0, Math.min(Math.max(0, levels.length - 1), ladderRef.current.index));
    return levels[at]?.id ?? level;
  }

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
    return makeQuestion(game, levelId, rngRandom(), preferIds());
  }

  function preferIds(): string[] {
    if (spec?.reviewKeys) return spec.reviewKeys(child.words);
    return game === "times" ? weakTimesFacts(skillsRef.current) : [];
  }

  function buildSlot(i: number): Served {
    const queued = returnsRef.current.get(i);
    if (queued) return { slot: queued, returning: true };
    const handsOn = handsRef.current.has(i);
    const lvl = levelNow();
    if (handsOn && game === "time") return { slot: makeClockTask(lvl, rngRandom()), returning: false };
    if (handsOn && game === "money") return { slot: makePayTask(lvl, rngRandom()), returning: false };
    return { slot: { kind: "choice", question: nextQuestion() }, returning: false };
  }

  const [questions, setQuestions] = useState<Served[]>(() => {
    handsRef.current = new Set(boss || (game !== "time" && game !== "money") ? [] : handsOnSlots(ROUND_LENGTH));
    if (boss) {
      return makeBossRound(game, level, rngRandom(), preferIds()).map((question) => ({
        slot: { kind: "choice" as const, question },
        returning: false,
      }));
    }
    return [buildSlot(0)];
  });
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const practiceRef = useRef(practice);
  practiceRef.current = practice;

  function roundTotal() {
    return boss ? questionsRef.current.length || BOSS_LENGTH : ROUND_LENGTH;
  }

  function paint(i: number, dot: Dot) {
    const next = dotsRef.current.slice();
    while (next.length < roundTotal()) next.push(null);
    next[i] = dot;
    dotsRef.current = next;
    setDots(next);
  }

  function restart(nextLevel = level) {
    if (waitRef.current) window.clearTimeout(waitRef.current);
    const nextSpec = gameById(game);
    const nextBase = Math.max(0, nextSpec?.levels.findIndex((row) => row.id === nextLevel) ?? 0);
    const nextBoss = bossReady(child.journey, game);
    skillsRef.current = cloneSkills(child.skills);
    ladderRef.current = startLadder(openingIndex(nextBase, child.rounds, nextBoss));
    handsRef.current = new Set(nextBoss || (game !== "time" && game !== "money") ? [] : handsOnSlots(ROUND_LENGTH));
    returnsRef.current = new Map();
    replayHereRef.current = false;
    practiceTaughtRef.current = false;
    answersRef.current = [];
    dotsRef.current = blankDots(nextBoss ? BOSS_LENGTH : ROUND_LENGTH);
    startStarsRef.current = child.stars;
    finishedRef.current = false;
    phaseRef.current = "ask";
    indexRef.current = 0;
    startedRef.current = Date.now();
    const prefer = nextSpec?.reviewKeys?.(child.words) ?? (game === "times" ? weakTimesFacts(skillsRef.current) : []);
    const opening = nextBoss
      ? makeBossRound(game, nextLevel, rngRandom(), prefer).map((question) => ({
          slot: { kind: "choice" as const, question },
          returning: false,
        }))
      : [buildSlot(0)];
    questionsRef.current = opening;
    setQuestions(opening);
    setRoundId((n) => n + 1);
    setIndex(0);
    setPhase("ask");
    setDots(dotsRef.current);
    setCombo(0);
    setBestCombo(0);
    bestRef.current = 0;
    setLeft(ROUND_SECONDS);
    setSpeed(false);
    setMenu(false);
    setUnlockId(null);
    setMet(false);
    setHintOn(false);
    setNudge(null);
    setPractice(null);
    setTeachSlot(null);
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (waitRef.current) window.clearTimeout(waitRef.current);
    const total = roundTotal();
    const correct = dotsRef.current.filter((dot) => dot === "ok" || dot === "helped").length;
    const earned = starsForRound(correct, total);
    setUnlockId(newestUnlock(startStarsRef.current, startStarsRef.current + earned));
    setBestCombo(bestRef.current);
    setPhase("done");
    const seconds = Math.min(180, Math.max(1, Math.round((Date.now() - startedRef.current) / 1000)));
    onRoundRef.current({
      game,
      correct,
      total,
      seconds,
      answers: answersRef.current,
      bestCombo: bestRef.current,
      boss,
    });
  }

  const finishRef = useRef(finish);
  finishRef.current = finish;

  function advance(fromIndex: number) {
    phaseRef.current = "ask";
    const total = roundTotal();
    if (fromIndex + 1 >= total) {
      finishRef.current();
      return;
    }
    if (!questionsRef.current[fromIndex + 1]) {
      const extra = buildSlot(fromIndex + 1);
      questionsRef.current = [...questionsRef.current, extra];
      setQuestions(questionsRef.current);
    }
    indexRef.current = fromIndex + 1;
    setIndex(fromIndex + 1);
    setPhase("ask");
    setHintOn(false);
    setPractice(null);
    setTeachSlot(null);
  }

  function easeLadder() {
    if (boss || !spec) return;
    const before = ladderRef.current.index;
    ladderRef.current = stepLadder(ladderRef.current, spec.levels.length, false);
    const after = ladderRef.current.index;
    setNudge(after < before ? "down" : null);
  }

  function scoreClean(served: Served, fromIndex: number, fromCombo: number, hint = false) {
    const mark = markOf(served.slot, true);
    if (hint) mark.hint = true;
    noteMark(skillsRef.current, mark);
    answersRef.current = [...answersRef.current, mark];
    paint(fromIndex, "ok");
    if (!boss && spec && !served.returning) {
      const before = ladderRef.current.index;
      ladderRef.current = stepLadder(ladderRef.current, spec.levels.length, true);
      const after = ladderRef.current.index;
      setNudge(after > before ? "up" : null);
    }
    const nextCombo = served.returning ? 0 : fromCombo + 1;
    if (!served.returning) bestRef.current = Math.max(bestRef.current, nextCombo);
    setCombo(nextCombo);
    blip(true, soundRef.current, nextCombo);
    phaseRef.current = "feedback";
    setPhase("feedback");
    waitRef.current = window.setTimeout(() => advance(fromIndex), 620);
  }

  function beginTeach(slot: RoundSlot, source: "scored" | "practice") {
    teachSourceRef.current = source;
    setTeachSlot(slot);
    phaseRef.current = "teach";
    setPhase("teach");
    setHintOn(false);
  }

  function missScored(served: Served, fromIndex: number) {
    if (!served.returning) {
      const taken = [...returnsRef.current.keys()];
      const at = planReturn(fromIndex, roundTotal(), taken, [...handsRef.current]);
      if (at === fromIndex) replayHereRef.current = true;
      else returnsRef.current.set(at, served.slot);
      const miss = markOf(served.slot, false, true);
      noteMark(skillsRef.current, miss);
      answersRef.current = [...answersRef.current, miss];
      paint(fromIndex, "helped");
      easeLadder();
    }
    setCombo(0);
    blip(false, soundRef.current, 0);
    beginTeach(served.slot, "scored");
  }

  function continueAfterPractice(fromIndex: number) {
    practiceTaughtRef.current = false;
    setPractice(null);
    if (replayHereRef.current) {
      replayHereRef.current = false;
      const current = questionsRef.current[fromIndex];
      if (current) {
        const again: Served = { slot: current.slot, returning: true };
        const copy = questionsRef.current.slice();
        copy[fromIndex] = again;
        questionsRef.current = copy;
        setQuestions(copy);
      }
      phaseRef.current = "ask";
      setPhase("ask");
      setTeachSlot(null);
      return;
    }
    const served = questionsRef.current[fromIndex];
    if (served?.returning && dotsRef.current[fromIndex] !== "helped") paint(fromIndex, "miss");
    advance(fromIndex);
  }

  function answer(ok: boolean, hint = false) {
    if (menuRef.current || finishedRef.current) return;
    const mode = phaseRef.current;
    if (mode === "practice") {
      if (!ok && !practiceTaughtRef.current) {
        const slot = practiceRef.current;
        if (!slot) return;
        practiceTaughtRef.current = true;
        blip(false, soundRef.current, 0);
        beginTeach(slot, "practice");
        return;
      }
      if (ok) blip(true, soundRef.current, 0);
      continueAfterPractice(indexRef.current);
      return;
    }
    if (mode !== "ask") return;
    const served = questionsRef.current[indexRef.current];
    if (!served) return;
    if (!ok) {
      missScored(served, indexRef.current);
      return;
    }
    scoreClean(served, indexRef.current, combo, hint);
  }
  answerRef.current = answer;

  function afterTeach() {
    if (phaseRef.current !== "teach") return;
    if (teachSourceRef.current === "practice") {
      continueAfterPractice(indexRef.current);
      return;
    }
    const served = questionsRef.current[indexRef.current];
    if (!served) return;
    const next = similarSlot(game, served.slot, rngRandom());
    practiceTaughtRef.current = false;
    practiceRef.current = next;
    setPractice(next);
    phaseRef.current = "practice";
    setPhase("practice");
    setTeachSlot(null);
  }

  function close() {
    silence();
    if (finishedRef.current) {
      onExit();
      return;
    }
    if (dotsRef.current.some((dot) => dot != null)) finish();
    else onExit();
  }

  const served = questions[index];
  const slot = phase === "practice" && practice ? practice : served?.slot;
  const example = useMemo(() => (phase === "teach" && teachSlot ? exampleFor(teachSlot) : null), [phase, teachSlot]);
  const speech =
    phase === "teach" && example
      ? example.speech
      : slot
        ? phase === "practice"
          ? `Your turn. ${speechFor(slot)}`
          : speechFor(slot)
        : "";
  const total = boss ? questions.length || BOSS_LENGTH : ROUND_LENGTH;
  const showSpeed = canSpeed && speed;

  useEffect(() => {
    if (!showSpeed) return;
    const id = window.setInterval(() => {
      const now = phaseRef.current;
      if (now === "done" || now === "teach" || now === "practice") return;
      setLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [roundId, showSpeed]);

  useEffect(() => {
    if (showSpeed && left === 0 && phase !== "done" && phase !== "teach" && phase !== "practice") finishRef.current();
  }, [left, phase, showSpeed]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (menuRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const now = phaseRef.current;
      if (now !== "ask" && now !== "practice") return;
      const current = now === "practice" ? practiceRef.current : questionsRef.current[indexRef.current]?.slot;
      if (!current || current.kind !== "choice" || current.question.visual.kind === "spell") return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) {
        const choice = current.question.choices[n - 1] ?? "";
        answerRef.current(choice === current.question.answer);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    if ((phase !== "ask" && phase !== "practice") || !speech) return;
    if (!autoSpeakGrade(child.grade)) return;
    speak(speech, sound);
  }, [phase, speech, sound, child.grade]);

  useEffect(() => {
    if (phase !== "teach" || !example) return;
    teachTone(sound);
    if (autoSpeakGrade(child.grade)) speak(example.speech, sound);
  }, [phase, example, sound, child.grade]);

  useEffect(() => {
    if (phase !== "done") return;
    const stars = starsForRound(
      dotsRef.current.filter((dot) => dot === "ok" || dot === "helped").length,
      total,
    );
    chime(stars === 3 ? "cheer" : "coin", soundRef.current);
  }, [phase, total, roundId]);

  useEffect(() => {
    if (phase === "ask" || phase === "practice") retryFocusRef.current?.focus();
  }, [phase, index, practice]);

  const correct = dots.filter((dot) => dot === "ok" || dot === "helped").length;
  const liveStars = starsForRound(correct, total);
  const mascot = spec?.mascot ?? "peach";
  const ChoiceView = spec?.Choices;
  const friend = unlockId ? squisheeById(unlockId) : undefined;
  const asking = phase === "ask" || phase === "practice";
  const ok = phase === "feedback";
  const reaction = phase === "feedback" ? (combo >= 3 ? "★" : "✓") : phase === "teach" ? "…" : null;
  const hostId = hostIdFor(game);
  const host = squisheeById(hostId);
  const buddyCue = buddyReaction({ phase, ok, stars: liveStars, hintOn });
  const choice = slot?.kind === "choice" ? slot.question : null;
  const filled = dots.filter((dot) => dot != null).length;

  return (
    <div className={cx("ac-shell", spec?.layout === "wide" && "ac-wide")} data-phase={phase}>
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
        {canSpeed ? (
          <button
            type="button"
            className={cx("ac-speed", speed && "is-on")}
            aria-pressed={speed}
            onClick={() => {
              setSpeed((on) => {
                if (!on) setLeft(ROUND_SECONDS);
                return !on;
              });
            }}
          >
            Speed
          </button>
        ) : (
          <span className="ac-speed-gap" />
        )}
        {showSpeed ? (
          <>
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
          </>
        ) : null}
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
          {boss && bossWon(correct, total) && host ? (
            <div className="ac-unlock" data-befriend={host.id}>
              <SquisheeImg id={host.id} className="ac-done-pal" label={host.name} />
              <p>{host.name} is your friend!</p>
              <h2>{host.name}</h2>
            </div>
          ) : boss ? (
            <p className="ac-hint">The boss is still there. You can try again.</p>
          ) : null}
          <RoundBuddy id={child.avatarId} cosmetic={child.equipped} reaction={buddyCue} />
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
      ) : slot ? (
        <>
          <div className="ac-play-meta">
            {filled === 0 && !boss ? (
              <button type="button" className="ac-pill" onClick={() => setMenu(true)}>
                {servedPill(game, served?.slot, level)}
              </button>
            ) : (
              <span className="ac-pill">{boss ? "Boss round" : servedPill(game, served?.slot, level)}</span>
            )}
            <span className="ac-nudge-slot" aria-live="polite">
              {nudge === "up" ? <span className="ac-nudge">Harder</span> : null}
              {nudge === "down" ? <span className="ac-nudge is-down">Easier</span> : null}
            </span>
            {phase !== "feedback" ? (
              <button
                type="button"
                className="ac-hear"
                aria-label="Hear it again"
                onClick={() => speak(speech, sound)}
              >
                <SpeakerIcon />
              </button>
            ) : (
              <span className="ac-hint-spacer" />
            )}
            {asking && phase === "ask" && choice ? (
              <button
                type="button"
                className="ac-hint-btn"
                aria-pressed={hintOn}
                aria-label="Hint"
                onClick={() => {
                  setHintOn(true);
                  speak(hintCue(choice).speech, sound);
                }}
              >
                ?
              </button>
            ) : null}
            <Stars value={liveStars} />
          </div>
          {boss ? <HostGreet id={hostId} /> : null}
          <RoundCastProvider buddyId={child.avatarId} hostId={hostId} equipped={child.equipped}>
          <div
            className={cx(
              "ac-stage",
              "has-buddy",
              spec?.layout === "wide" && phase !== "teach" && slot.kind !== "clock" && slot.kind !== "pay" && "is-time",
              phase === "feedback" && "is-yes",
              phase === "feedback" && combo >= 3 && "is-streak",
              phase === "teach" && "is-teach",
              hintOn && asking && "is-hint",
            )}
          >
            <RoundBuddy id={child.avatarId} cosmetic={child.equipped} reaction={buddyCue} />
            {reaction ? (
              <span className="ac-react" aria-hidden="true">
                {reaction}
              </span>
            ) : null}
            {phase === "teach" && example ? (
              <div className="ac-stage-main" key={`${slotFact(teachSlot ?? slot)}-teach`}>
                <SquisheeImg id={mascot} className="ac-mascot" label="" />
                <WorkedExample example={example} onDone={afterTeach} />
              </div>
            ) : phase === "feedback" ? (
              <div className="ac-stage-main">
                <SquisheeImg id={mascot} className="ac-mascot is-happy" label="" />
                <p className="ac-banner is-yes">{served ? praiseLine(served.slot) : "Yes!"}</p>
              </div>
            ) : (
              <div className="ac-stage-main" key={slotFact(slot) + phase}>
                {slot.kind === "clock" || slot.kind === "pay" ? (
                  <>
                    <p className="ac-story">{slotStory(slot, child.avatarId, hostId)}</p>
                    {slot.kind === "clock" ? (
                      <ClockBoard task={slot} onAnswer={(good) => answer(good)} />
                    ) : (
                      <PayBoard task={slot} onAnswer={(good) => answer(good)} />
                    )}
                  </>
                ) : choice ? (
                  <>
                    {spec?.Aside ? <spec.Aside question={choice} /> : null}
                    <div className="ac-stage-copy">
                      <p className="ac-story">{slotStory(slot, child.avatarId, hostId)}</p>
                      {choice.visual.kind === "money" ? <CoinShare buddyId={child.avatarId} hostId={hostId} /> : null}
                      {spec ? (
                        <spec.Prompt question={choice} reveal={false} mascot={mascot} happy={ok} />
                      ) : null}
                      {ChoiceView ? (
                        <ChoiceView
                          question={choice}
                          reveal={false}
                          picked={null}
                          onChoose={(value, hinted) => answer(value === choice.answer, hinted === true)}
                        />
                      ) : (
                        <div className="ac-choices">
                          {choice.choices.map((option, choiceIndex) => {
                            const pile = choice.visual.kind === "money" ? choice.visual.piles?.[option] : undefined;
                            const label =
                              choice.visual.kind === "money" && choice.visual.labels?.[option]
                                ? choice.visual.labels[option]
                                : option;
                            return (
                              <button
                                key={option}
                                ref={choiceIndex === 0 ? retryFocusRef : undefined}
                                type="button"
                                className={cx("ac-choice", pile && "is-coins")}
                                aria-label={label}
                                onClick={() => answer(option === choice.answer)}
                              >
                                {pile ? <CoinRow pile={pile} label={label} /> : option}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className={cx("ac-banner", hintOn && "is-hint")} aria-live="polite">
                        {hintOn ? hintCue(choice).caption : phase === "practice" ? "Try one like it" : ""}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
          </RoundCastProvider>
          <div
            className="ac-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={filled}
            aria-label={`Question ${Math.min(total, index + 1)} of ${total}`}
          >
            <span style={{ width: `${(filled / total) * 100}%` }} />
          </div>
          {calm ? null : (
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
          )}
          <div className="ac-qdots" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => {
              const dot = dots[i];
              const cls = dot === "ok" ? "is-ok" : dot === "helped" ? "is-helped" : dot === "miss" ? "is-miss" : i === index ? "is-now" : "";
              return <i key={i} className={cls} />;
            })}
          </div>
          <p className="ac-qmeta">
            Question {Math.min(total, index + 1)} of {total}
            {!calm && combo >= 2 ? (
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
