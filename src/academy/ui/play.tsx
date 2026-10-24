import { useEffect, useMemo, useRef, useState } from "react";
import { rngRandom } from "@/lib/rng";
import { squisheeById } from "@/lib/squishees";
import {
  CLEAN_UP_AT,
  clockMastery,
  cloneSkills,
  easeFromRound,
  freshMastery,
  gameHasMarks,
  moveLadder,
  noteMark,
  openingForRound,
  pickServeIndex,
  skillHeat,
  skillKeyForLevel,
  startLadder,
  type Ladder,
  type MasteryClock,
} from "../adapt";
import { bondName, bondScore, bondTier } from "../buddy/bond";
import { hostIdFor } from "../buddy/hosts";
import { buddyReaction } from "../buddy/react";
import { slotStory } from "../buddy/story";
import { bossEnergyAfterHit, bossIsTimed, bossMaxEnergy, phaseForIndex } from "../boss-battle";
import { bossForGame } from "../bosses";
import { playWindow } from "../grade-map";
import { gameById, pillLabel } from "../games/registry";
import { makeHandsTask } from "../hands-build";
import { cardStepLabel, cardsRoundLabel, remainderShown, show, t, yourTurnLine } from "../i18n";
import { bossReady, bossWon } from "../journey";
import {
  autoSpeakGrade,
  BOSS_LENGTH,
  cardsThisRound,
  PLACEMENT_LENGTH,
  ROUND_SECONDS,
  speedRoundOffer,
  type AnswerMark,
  type Child,
  type Grade,
  type RoundResult,
  type SkillStat,
} from "../model";
import { makeBossRound, makeQuestion } from "../games/round";
import type { ChoiceQ } from "../games/types";
import { coinsForRound, dueIdeas, newestUnlock, starsForRound, weakTimesFacts } from "../rewards";
import {
  choiceFact,
  exampleFor,
  handsOnSlots,
  pickFreshQuestion,
  planReturn,
  similarSlot,
  slotFact,
  speechFor,
  type RoundSlot,
} from "../round-flow";
import { blip, bossFanfare, bossRaspberry, bossStrike, chime, startBossMusic, stopBossMusic, teachTone } from "../sound";
import { hintCue } from "../teach";
import { silence, speak } from "../voice";
import { CoinShare, RoundBuddy } from "./buddy-view";
import { BossFigure, type BossMood } from "./boss-figure";
import { BossHud, BossIntro } from "./boss-stage";
import { AcademyPal, SpeakerIcon, SquisheeImg, Stars, cx, fmtSeconds } from "./bits";
import { RoundCastProvider } from "./round-cast";
import { CoinRow } from "./coins";
import { HandsBoard } from "./build-boards";
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
type Phase = "intro" | "ask" | "teach" | "practice" | "feedback" | "done";

function bossOpening(
  game: string,
  level: string,
  prefer: string[],
  grade: Grade,
  crown: boolean,
  challengeAhead: boolean,
): Served[] {
  const questions = makeBossRound(game, level, rngRandom(), prefer, undefined, { grade, crown, challengeAhead });
  return questions.map((question, i) => {
    const twist = phaseForIndex(i, questions.length);
    const skillLevel = question.skill.split(":")[1] ?? level;
    if (twist === "cards") return { slot: makeHandsTask(game, skillLevel, rngRandom(), undefined, prefer), returning: false };
    return { slot: { kind: "choice", question }, returning: false };
  });
}

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

function ideaOf(slot: RoundSlot): string {
  if (slot.kind === "choice") return slot.question.tags[0] || slot.question.skill;
  if (slot.kind === "clock") {
    if (slot.minutes === 15) return "quarterpast";
    if (slot.minutes === 45) return "quarterto";
    if (slot.minutes === 30) return "halfpast";
    if (slot.minutes === 0) return "oclock";
    return "fives";
  }
  return slot.skill;
}

function praiseLine(slot: RoundSlot): string {
  switch (slot.kind) {
    case "choice":
      return slot.question.praise;
    case "clock":
      return t("Yes! The hands show it.", "¡Sí! Las manecillas lo muestran.");
    case "pay":
      return t("Yes! That pays the price.", "¡Sí! Así se paga.");
    default:
      return slot.praise;
  }
}

export function PlayScreen({
  child,
  game,
  crown = false,
  sound,
  onExit,
  onRound,
  onLevel,
  onAck,
  onToggleSound,
}: {
  child: Child;
  game: string;
  crown?: boolean;
  sound: boolean;
  onExit: () => void;
  onRound: (result: RoundResult) => void;
  onLevel: (level: string) => void;
  onAck: () => void;
  onToggleSound: () => void;
}) {
  const spec = gameById(game);
  const gradeWindow = playWindow(
    spec?.levels.map((row) => row.id) ?? [],
    game,
    child.grade,
    child.challengeAhead,
  );
  const blocked = gradeWindow.offer === "later" || gradeWindow.ids.length === 0;
  const level = gradeWindow.ids.includes(child.levels[game] ?? "") ? (child.levels[game] ?? gradeWindow.start) : gradeWindow.start;
  const baseIndex = blocked
    ? 0
    : Math.max(gradeWindow.min, Math.min(gradeWindow.max, spec?.levels.findIndex((row) => row.id === level) ?? gradeWindow.min));
  const bounds = { min: Math.max(0, gradeWindow.min), max: Math.max(0, gradeWindow.max) };
  const calm = autoSpeakGrade(child.grade);
  const crownFight = crown && child.journey.bosses.includes(game);
  const openingBoss = crownFight || bossReady(child.journey, game, child.grade);
  const practiced = gameHasMarks(child.skills, game);
  const roundsHere = practiced ? Math.max(1, child.rounds) : 0;
  const openAt = blocked
    ? 0
    : openingForRound({
        savedIndex: baseIndex,
        startIndex: Math.max(0, spec?.levels.findIndex((row) => row.id === gradeWindow.start) ?? baseIndex),
        roundsPlayed: roundsHere,
        boss: openingBoss,
        bounds,
      });
  const roundLevel = spec?.levels[openAt]?.id ?? level;
  const [planned, setPlanned] = useState(() => cardsThisRound(child.grade, roundsHere, openingBoss));
  const cards = planned;
  const bossDef = bossForGame(game);
  const [roundId, setRoundId] = useState(0);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(openingBoss ? "intro" : "ask");
  const [energy, setEnergy] = useState(() => bossMaxEnergy(BOSS_LENGTH, crownFight));
  const [mood, setMood] = useState<BossMood>("arrive");
  const [dots, setDots] = useState<(Dot | null)[]>(() => blankDots(cards));
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [speed, setSpeed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [met, setMet] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [cheer, setCheer] = useState(0);
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
  const dotsRef = useRef<(Dot | null)[]>(blankDots(cards));
  const indexRef = useRef(0);
  const bossSnap = useRef<{ roundId: number; boss: boolean }>({ roundId: -1, boss: false });
  if (bossSnap.current.roundId !== roundId) {
    bossSnap.current = { roundId, boss: crownFight || bossReady(child.journey, game, child.grade) };
  }
  const boss = bossSnap.current.boss;
  const skillsRef = useRef<Record<string, SkillStat>>(cloneSkills(child.skills));
  const masteryRef = useRef<MasteryClock>(freshMastery());
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;
  const ladderRef = useRef<Ladder>(startLadder(openAt));
  const recentRef = useRef<string[]>([]);
  const comboRef = useRef(0);
  const missedRef = useRef(false);
  const handsRef = useRef<Set<number>>(new Set());
  const returnsRef = useRef<Map<number, RoundSlot>>(new Map());
  menuRef.current = menu;
  phaseRef.current = phase;
  onRoundRef.current = onRound;
  soundRef.current = sound;
  indexRef.current = index;

  function levelNow(): string {
    const levels = spec?.levels ?? [];
    const box = boundsRef.current;
    const at = Math.max(box.min, Math.min(box.max, ladderRef.current.index));
    return levels[at]?.id ?? level;
  }

  function nextQuestion(): ChoiceQ {
    const levels = spec?.levels ?? [];
    const count = Math.max(1, levels.length);
    const box = boundsRef.current;
    const heats = levels.map((row) => skillHeat(skillsRef.current[skillKeyForLevel(game, row.id)]));
    const pick = pickServeIndex({
      ladderIndex: ladderRef.current.index,
      levelCount: count,
      heats,
      roll: rngRandom().next(),
      minIndex: box.min,
      maxIndex: box.max,
    });
    const levelId = levels[pick.index]?.id ?? levels[box.min]?.id ?? level;
    const question = pickFreshQuestion(() => makeQuestion(game, levelId, rngRandom(), preferIds()), recentRef.current);
    remember(choiceFact(question));
    return question;
  }

  function preferIds(): string[] {
    const ideas = dueIdeas(skillsRef.current);
    const words = spec?.reviewKeys?.(child.words) ?? [];
    const facts = game === "times" ? weakTimesFacts(skillsRef.current) : [];
    const ease = easeFromRound({ combo: comboRef.current, missed: missedRef.current });
    const tags = [...ideas, ...words, ...facts];
    if (ease !== "steady") tags.push(`ease:${ease}`);
    return tags;
  }

  function remember(fact: string) {
    recentRef.current = [...recentRef.current, fact].slice(-8);
  }

  function stepUpAt(): number {
    return cards <= PLACEMENT_LENGTH ? 5 : CLEAN_UP_AT;
  }

  function applyShift(shift: "up" | "down" | "stay") {
    if (boss || !spec || shift === "stay") {
      if (shift === "stay") setNudge(null);
      return;
    }
    const before = ladderRef.current.index;
    ladderRef.current = moveLadder(ladderRef.current, spec.levels.length, shift === "up" ? 1 : -1, boundsRef.current);
    const after = ladderRef.current.index;
    if (after > before) setNudge("up");
    else if (after < before) setNudge("down");
    else setNudge(null);
  }

  function buildSlot(i: number): Served {
    const queued = returnsRef.current.get(i);
    if (queued) return { slot: queued, returning: true };
    const handsOn = handsRef.current.has(i);
    const lvl = levelNow();
    if (handsOn) {
      const slot = makeHandsTask(game, lvl, rngRandom(), recentRef.current.at(-1), preferIds());
      remember(slot.factKey);
      return { slot, returning: false };
    }
    return { slot: { kind: "choice", question: nextQuestion() }, returning: false };
  }

  const [questions, setQuestions] = useState<Served[]>(() => {
    if (blocked) return [];
    handsRef.current = new Set(boss ? [] : handsOnSlots(cards));
    if (boss) {
      return bossOpening(game, level, preferIds(), child.grade, crownFight, child.challengeAhead);
    }
    return [buildSlot(0)];
  });
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const practiceRef = useRef(practice);
  practiceRef.current = practice;

  function roundTotal() {
    return boss ? questionsRef.current.length || BOSS_LENGTH : cards;
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
    const nextBase = Math.max(boundsRef.current.min, nextSpec?.levels.findIndex((row) => row.id === nextLevel) ?? boundsRef.current.min);
    const nextBoss = crownFight || bossReady(child.journey, game, child.grade);
    const nextPracticed = gameHasMarks(child.skills, game);
    const nextRounds = nextPracticed ? Math.max(1, child.rounds) : 0;
    const nextPlanned = cardsThisRound(child.grade, nextRounds, nextBoss);
    skillsRef.current = cloneSkills(child.skills);
    masteryRef.current = freshMastery();
    ladderRef.current = startLadder(
      openingForRound({
        savedIndex: nextBase,
        startIndex: Math.max(0, nextSpec?.levels.findIndex((row) => row.id === gradeWindow.start) ?? nextBase),
        roundsPlayed: nextRounds,
        boss: nextBoss,
        bounds: boundsRef.current,
      }),
    );
    handsRef.current = new Set(nextBoss ? [] : handsOnSlots(nextPlanned));
    returnsRef.current = new Map();
    recentRef.current = [];
    comboRef.current = 0;
    missedRef.current = false;
    replayHereRef.current = false;
    practiceTaughtRef.current = false;
    answersRef.current = [];
    dotsRef.current = blankDots(nextBoss ? BOSS_LENGTH : nextPlanned);
    setPlanned(nextPlanned);
    startStarsRef.current = child.stars;
    finishedRef.current = false;
    const openingPhase: Phase = nextBoss ? "intro" : "ask";
    phaseRef.current = openingPhase;
    indexRef.current = 0;
    startedRef.current = Date.now();
    const opening = nextBoss
      ? bossOpening(game, nextLevel, preferIds(), child.grade, crownFight, child.challengeAhead)
      : [buildSlot(0)];
    questionsRef.current = opening;
    setQuestions(opening);
    setRoundId((n) => n + 1);
    setIndex(0);
    setPhase(openingPhase);
    setEnergy(bossMaxEnergy(BOSS_LENGTH, crownFight));
    setMood("arrive");
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
      crown: boss && crownFight,
    });
    if (!boss && spec) {
      const box = boundsRef.current;
      const at = Math.max(box.min, Math.min(box.max, ladderRef.current.index));
      const nextLevel = spec.levels[at]?.id;
      if (nextLevel) onLevel(nextLevel);
    }
  }

  function beginBattle() {
    startedRef.current = Date.now();
    phaseRef.current = "ask";
    setPhase("ask");
    setMood("idle");
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
    if (boss) setMood("idle");
    setHintOn(false);
    setPractice(null);
    setTeachSlot(null);
  }

  function scoreClean(served: Served, fromIndex: number, fromCombo: number, hint = false) {
    const mark = markOf(served.slot, true);
    if (hint) mark.hint = true;
    noteMark(skillsRef.current, mark);
    answersRef.current = [...answersRef.current, mark];
    paint(fromIndex, "ok");
    if (!boss && spec && !served.returning) {
      const step = clockMastery(masteryRef.current, { ok: true, idea: ideaOf(served.slot), assisted: hint }, stepUpAt());
      masteryRef.current = step.clock;
      applyShift(step.shift);
    }
    const nextCombo = served.returning ? 0 : fromCombo + 1;
    comboRef.current = nextCombo;
    if (!served.returning) bestRef.current = Math.max(bestRef.current, nextCombo);
    setCombo(nextCombo);
    if (boss) {
      const hitPhase = phaseForIndex(fromIndex, roundTotal());
      const dealt = served.returning ? 1 : nextCombo;
      setEnergy((current) => bossEnergyAfterHit(current, bossMaxEnergy(BOSS_LENGTH, crownFight), dealt, hitPhase, true));
      setMood(dealt >= 3 ? "dizzy" : "hit");
      bossStrike(soundRef.current, dealt);
    } else {
      blip(true, soundRef.current, nextCombo);
    }
    phaseRef.current = "feedback";
    setPhase("feedback");
    if (!boss) setCheer((n) => n + 1);
    if (soundRef.current) speak(show("Yes!"), true);
    const beat = nextCombo >= 3 ? 1200 : 900;
    waitRef.current = window.setTimeout(() => advance(fromIndex), beat);
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
      if (!boss) {
        const step = clockMastery(masteryRef.current, { ok: false, idea: ideaOf(served.slot), assisted: true }, stepUpAt());
        masteryRef.current = step.clock;
        applyShift(step.shift);
      }
    }
    comboRef.current = 0;
    missedRef.current = true;
    setCombo(0);
    if (boss) {
      setMood("raspberry");
      bossRaspberry(soundRef.current);
    } else {
      blip(false, soundRef.current, 0);
    }
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
        if (boss) {
          setMood("raspberry");
          bossRaspberry(soundRef.current);
        } else {
          blip(false, soundRef.current, 0);
        }
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
          ? yourTurnLine(speechFor(slot))
          : speechFor(slot)
        : "";
  const total = boss ? questions.length || BOSS_LENGTH : cards;
  const canSpeed = speedRoundOffer(child.grade, game, roundLevel, boss);
  const showSpeed = canSpeed && speed;
  const stepLabel = calm
    ? cardStepLabel(index, total)
    : t(`Question ${Math.min(total, index + 1)} of ${total}`, `Pregunta ${Math.min(total, index + 1)} de ${total}`, `Pergunta ${Math.min(total, index + 1)} de ${total}`, `Question ${Math.min(total, index + 1)} sur ${total}`, `第${Math.min(total, index + 1)}题，共${total}题`, `सवाल ${total} में से ${Math.min(total, index + 1)}`, `السؤال ${Math.min(total, index + 1)} من ${total}`);

  useEffect(() => {
    if (!showSpeed) return;
    const id = window.setInterval(() => {
      const now = phaseRef.current;
      if (now === "done" || now === "teach" || now === "practice" || now === "intro") return;
      setLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [roundId, showSpeed]);

  useEffect(() => {
    if (showSpeed && left === 0 && phase !== "done" && phase !== "teach" && phase !== "practice" && phase !== "intro") {
      if (boss && !bossIsTimed(child.grade)) return;
      finishRef.current();
    }
  }, [left, phase, showSpeed, boss, child.grade]);

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
    const won = boss && bossWon(dotsRef.current.filter((dot) => dot === "ok" || dot === "helped").length, total);
    if (won) bossFanfare(soundRef.current);
    else chime(stars === 3 ? "cheer" : "coin", soundRef.current);
  }, [phase, total, roundId, boss]);

  const bossMusic = boss && phase !== "done";
  useEffect(() => {
    if (!bossMusic) {
      stopBossMusic();
      return;
    }
    return startBossMusic(sound);
  }, [bossMusic, sound, roundId]);

  useEffect(() => {
    if (phase !== "intro") return;
    speak(bossDef.taunt, sound);
  }, [phase, sound, bossDef.taunt]);

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
  const counting =
    slot?.kind === "choice" &&
    (slot.question.visual.kind === "add" ||
      slot.question.visual.kind === "times" ||
      slot.question.visual.kind === "money" ||
      (slot.question.visual.kind === "scene" &&
        (slot.question.visual.board.game === "count" ||
          slot.question.visual.board.game === "problems" ||
          slot.question.visual.board.game === "place" ||
          slot.question.visual.board.game === "variables")));
  const buddyCue = buddyReaction({
    phase: phase === "intro" ? "ask" : phase,
    ok,
    stars: liveStars,
    hintOn,
    combo,
    counting: phase === "ask" && counting,
  });
  const palBond = bondTier(bondScore(child.bonds, child.avatarId));
  const choice = slot?.kind === "choice" ? slot.question : null;
  const graphPals = choice?.visual.kind === "scene" && choice.visual.board.game === "graphs";
  const filled = dots.filter((dot) => dot != null).length;
  const playBuddy = boss ? null : (
    <div className="ac-play-buddy" data-pals={graphPals ? "pair" : "one"}>
      <RoundBuddy id={child.avatarId} cosmetic={child.equipped} reaction={buddyCue} pulse={phase === "feedback" ? cheer : 0} />
      {graphPals ? <AcademyPal id={hostId} className="ac-buddy-img" squish="buddy" label="" /> : null}
    </div>
  );

  if (blocked) {
    return (
      <div className={cx("ac-shell", child.grade === "PK" && "is-prek")}>
        <header className="ac-play-top">
          <button type="button" className="ac-x" onClick={onExit} aria-label={show("Close")}>
            ×
          </button>
        </header>
        <section className="ac-done">
          <h1>
            {t(
              `${show(spec?.title ?? "This game")} is coming later`,
              `${show(spec?.title ?? "This game")} llega más adelante`, `${show(spec?.title ?? "This game")} chega mais tarde`,
            `${show(spec?.title ?? "This game")} arrive plus tard`, `稍后才会有${show(spec?.title ?? "This game")}`, `${show(spec?.title ?? "This game")} बाद में आएगा`, `${show(spec?.title ?? "This game")} يأتي لاحقًا`)}
          </h1>
          <p className="ac-hint">{show("This grade plays other games first. A grown-up can turn on challenge ahead in settings.")}</p>
          <button type="button" className="ac-go" onClick={onExit}>
            {show("Home")}
          </button>
        </section>
      </div>
    );
  }

  const fightPhase = boss ? phaseForIndex(index, total) : "rally";
  const bossWonRound = boss && bossWon(correct, total);
  const maxEnergy = bossMaxEnergy(BOSS_LENGTH, crownFight);

  return (
    <div className={cx("ac-shell", child.grade === "PK" && "is-prek", spec?.layout === "wide" && "ac-wide", boss && "is-boss", crownFight && "is-crown")} data-phase={phase} data-round={child.rounds <= 0 && !boss ? "first" : "play"}>
      <header className="ac-play-top">
        <button type="button" className="ac-x" onClick={close} aria-label={show("Close")}>
          ×
        </button>
        <button
          type="button"
          className={cx("ac-mute", !sound && "is-off")}
          aria-pressed={!sound}
          aria-label={sound ? show("Mute sounds") : show("Turn sounds on")}
          onClick={onToggleSound}
        >
          <SpeakerIcon muted={!sound} />
        </button>
        {boss && !bossIsTimed(child.grade) ? (
          <span className="ac-take-time">{show("Take your time")}</span>
        ) : canSpeed ? (
          <button
            type="button"
            className={cx("ac-speed", speed && "is-on")}
            data-speed={speed ? "on" : "off"}
            aria-pressed={speed}
            onClick={() => {
              setSpeed((on) => {
                if (!on) setLeft(ROUND_SECONDS);
                return !on;
              });
            }}
          >
            {show("Speed round")}
          </button>
        ) : calm && !boss ? (
          <span className="ac-cards-chip" data-cards={total}>
            {cardsRoundLabel(total)}
          </span>
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
              aria-label={show("Time left")}
            >
              <span style={{ width: `${(left / ROUND_SECONDS) * 100}%` }} />
            </div>
            <div className="ac-clock-read">{fmtSeconds(left)}</div>
          </>
        ) : null}
      </header>

      {phase === "done" ? (
        <section className="ac-done" data-confetti={liveStars === 3 || bossWonRound ? "on" : "off"} data-boss={boss ? "yes" : "no"}>
          {liveStars === 3 || bossWonRound ? <Confetti /> : null}
          {bossWonRound ? (
            <BossFigure face={bossDef.face} look={bossDef.look} mood="friendly" crown={crownFight} name={bossDef.name} size="hero" />
          ) : (
            <SquisheeImg id={friend && !met ? friend.id : mascot} className="ac-done-pal" label={friend?.name ?? ""} />
          )}
          <h1>
            {bossWonRound
              ? crownFight
                ? show("Gold Crown!")
                : show("Boss beaten!")
              : boss
                ? show("Nice try!")
                : correct >= total
                  ? show("Perfect round!")
                  : liveStars === 3
                    ? show("So close!")
                    : liveStars === 2
                      ? show("Nice work!")
                      : show("You stuck with it!")}
          </h1>
          <Stars value={liveStars} className="ac-stars-big" />
          <p>
            {correct} {show("of")} {total} · {liveStars} {liveStars === 1 ? show("star") : show("stars")} · +
            {coinsForRound(correct, total, bestCombo, boss)} {show("coins")}
          </p>
          {bestCombo >= 3 ? (
            <p className="ac-combo-note" data-combo={bestCombo}>
              {t(`Combo ×${bestCombo}`, `Combo ×${bestCombo}`, `Combo ×${bestCombo}`, `Combo ×${bestCombo}`, `连击×${bestCombo}`, `कॉम्बो ×${bestCombo}`, `سلسلة ×${bestCombo}`)}
            </p>
          ) : null}
          {bossWonRound ? (
            <div className="ac-boss-win" data-boss-win={game}>
              <p>{bossDef.friendly}</p>
              <p className="ac-trophy" data-trophy={bossDef.trophyId}>
                {bossDef.trophyName}
              </p>
              <p data-cosmetic={bossDef.cosmeticId}>
                {bossDef.cosmeticName} {show("unlocked.")}
              </p>
              <p>
                {bossDef.name} {show("joined your Squishee Book.")}
              </p>
              {host ? (
                <p data-befriend={host.id}>
                  {host.name} {show("is your friend too.")}
                </p>
              ) : null}
              <a className="ac-quiet ac-quiet-link" href="#/shelf">
                {show("Boss card")}
              </a>
            </div>
          ) : boss ? (
            <p className="ac-hint">{show("The boss is still there. You can try again.")}</p>
          ) : null}
          <RoundBuddy id={child.avatarId} cosmetic={child.equipped} reaction={buddyCue} />
          <p className="ac-bond" data-bond={palBond}>
            {squisheeById(child.avatarId)?.name ?? show("Buddy")} · {bondName(palBond)}
          </p>
          {friend && !met ? (
            <div className="ac-unlock">
              <p>{show("New friend!")}</p>
              <h2>
                {friend.name} {show("hopped in")}
              </h2>
              <button
                type="button"
                className="ac-go"
                onClick={() => {
                  setMet(true);
                  onAck();
                }}
              >
                {show("Meet")} {friend.name}
              </button>
            </div>
          ) : null}
          <div className="ac-done-actions">
            <button type="button" className="ac-go" onClick={() => restart()}>
              {boss && !bossWonRound ? show("Try the boss") : show("Play again")}
            </button>
            {bossWonRound ? (
              <a className="ac-quiet ac-quiet-link" href={`#/play/${game}/crown`}>
                {show("Gold Crown rematch")}
              </a>
            ) : null}
            <a className="ac-quiet ac-quiet-link" href="#/map">
              {show("Island map")}
            </a>
            <button type="button" className="ac-quiet" onClick={onExit}>
              {show("Home")}
            </button>
          </div>
        </section>
      ) : phase === "intro" && boss ? (
        <BossIntro boss={bossDef} crown={crownFight} onStart={beginBattle} />
      ) : slot ? (
        <>
          {boss ? (
            <BossHud
              boss={bossDef}
              energy={energy}
              maxEnergy={maxEnergy}
              mood={mood}
              buddyId={child.avatarId}
              phase={fightPhase}
              crown={crownFight}
            />
          ) : null}
          <div className="ac-play-meta">
            {filled === 0 && !boss ? (
              <button type="button" className="ac-pill" onClick={() => setMenu(true)}>
                {servedPill(game, served?.slot, level)}
              </button>
            ) : (
              <span className="ac-pill">{boss ? bossDef.name : servedPill(game, served?.slot, level)}</span>
            )}
            <span className="ac-nudge-slot" aria-live="polite">
              {nudge === "up" ? <span className="ac-nudge">{show("Harder")}</span> : null}
              {nudge === "down" ? <span className="ac-nudge is-down">{show("Easier")}</span> : null}
            </span>
            {phase !== "feedback" ? (
              <button
                type="button"
                className="ac-hear"
                aria-label={show("Hear it again")}
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
                aria-label={show("Hint")}
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
          <RoundCastProvider buddyId={child.avatarId} hostId={hostId} equipped={child.equipped}>
          <div
            className={cx(
              "ac-stage",
              spec?.layout === "wide" && phase !== "teach" && slot.kind === "choice" && "is-time",
              phase === "feedback" && "is-yes",
              phase === "feedback" && combo >= 3 && "is-glow",
              phase === "teach" && "is-teach",
              hintOn && asking && "is-hint",
              boss && fightPhase === "cards" && "is-cards",
              boss && fightPhase === "super" && "is-super",
            )}
          >
            {reaction && phase !== "feedback" ? (
              <span className="ac-react" aria-hidden="true">
                {reaction}
              </span>
            ) : null}
            {phase === "teach" && example ? (
              <div className="ac-stage-main" key={`${slotFact(teachSlot ?? slot)}-teach`}>
                {playBuddy}
                <SquisheeImg id={mascot} className="ac-mascot" label="" />
                <WorkedExample example={example} onDone={afterTeach} />
              </div>
            ) : (
              <div className="ac-stage-main" key={slotFact(slot)}>
                {slot.kind !== "choice" ? (
                  <div className="ac-hands-layout">
                    {playBuddy}
                    <p className="ac-story">{slotStory(slot, child.avatarId, hostId)}</p>
                    {phase === "feedback" ? (
                      <p className="ac-banner is-yes">{served ? praiseLine(served.slot) : show("Yes!")}</p>
                    ) : null}
                    <div className={phase === "feedback" ? "ac-hands-lock" : undefined}>
                      <HandsBoard task={slot} onAnswer={(good) => answer(good)} />
                    </div>
                  </div>
                ) : choice ? (
                  <>
                    {spec?.Aside ? <spec.Aside question={choice} /> : null}
                    <div className="ac-stage-copy">
                      <p className="ac-story">{slotStory(slot, child.avatarId, hostId)}</p>
                      {choice.visual.kind === "money" ? <CoinShare buddyId={child.avatarId} hostId={hostId} /> : null}
                      {spec ? (
                        <spec.Prompt question={choice} reveal={phase === "feedback"} mascot={mascot} happy={ok} />
                      ) : null}
                      {playBuddy}
                      {ChoiceView ? (
                        <ChoiceView
                          question={choice}
                          reveal={phase === "feedback"}
                          picked={null}
                          onChoose={(value, hinted) => answer(value === choice.answer, hinted === true)}
                        />
                      ) : (
                        <div className={cx("ac-choices", phase === "feedback" && "is-locked")}>
                          {choice.choices.map((option, choiceIndex) => {
                            const pile = choice.visual.kind === "money" ? choice.visual.piles?.[option] : undefined;
                            const label =
                              choice.visual.kind === "money" && choice.visual.labels?.[option]
                                ? choice.visual.labels[option]
                                : remainderShown(option);
                            const right = phase === "feedback" && option === choice.answer;
                            return (
                              <button
                                key={option}
                                ref={choiceIndex === 0 ? retryFocusRef : undefined}
                                type="button"
                                className={cx("ac-choice", pile && "is-coins", right && "is-yes")}
                                aria-label={label}
                                disabled={phase === "feedback"}
                                onClick={() => answer(option === choice.answer)}
                              >
                                {pile ? <CoinRow pile={pile} label={label} /> : label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className={cx("ac-banner", phase === "feedback" && "is-yes", hintOn && "is-hint")} aria-live="polite">
                        {phase === "feedback"
                          ? served
                            ? praiseLine(served.slot)
                            : show("Yes!")
                          : hintOn
                            ? hintCue(choice).caption
                            : phase === "practice"
                              ? show("Try one like it")
                              : ""}
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
            aria-label={stepLabel}
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
                aria-label={combo >= 2 ? t(`Combo ${combo}`, `Combo ${combo}`, `Combo ${combo}`, `Combo ${combo}`, `连击${combo}`, `कॉम्बो ${combo}`, `سلسلة ${combo}`) : show("Combo")}
              >
                <span style={{ width: `${Math.min(100, (combo / 5) * 100)}%` }} />
              </div>
              <small>{combo >= 2 ? t(`Combo ×${combo}`, `Combo ×${combo}`, `Combo ×${combo}`, `Combo ×${combo}`, `连击×${combo}`, `कॉम्बो ×${combo}`, `سلسلة ×${combo}`) : show("Combo")}</small>
            </div>
          )}
          <div className="ac-qdots" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => {
              const dot = dots[i];
              const cls = dot === "ok" ? "is-ok" : dot === "helped" ? "is-helped" : dot === "miss" ? "is-miss" : i === index ? "is-now" : "";
              return <i key={i} className={cls} />;
            })}
          </div>
          <p className="ac-qmeta">{stepLabel}</p>
        </>
      ) : null}

      {menu ? (
        <div className="ac-modal" role="dialog" aria-label={show("Pick a level")}>
          <div className="ac-modal-card">
            <h2>{show("Pick a level")}</h2>
            <p className="ac-hint">{show("Starts a new round.")}</p>
            {(spec?.levels ?? []).filter((row) => gradeWindow.ids.includes(row.id)).map((row) => (
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
                <strong>
                  {show("Level")} {row.num}
                </strong>
                <small>{show(row.label)}</small>
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
