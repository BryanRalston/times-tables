import { useEffect, useRef, useState } from "react";
import { AnswerPanel } from "@/components/answer-panel";
import { applyKeypadKey } from "@/components/keypad";
import { AppHeader, AppScene, AppTabs, useUi } from "@/components/chrome";
import { MiniGame } from "@/components/minigame";
import { Mascot, StarPop, type Pose } from "@/components/mascot";
import { Board } from "@/components/models";
import { ScratchPad } from "@/components/scratch";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/lib/calendar";
import { activityById, suggestedUnitId } from "@/lib/curriculum";
import { dailyStartUnitId } from "@/lib/path";
import { makeDailyWalk, walkLabel } from "@/lib/daily";
import { parseLocale, UI } from "@/lib/i18n";
import { cardHeading, interactGatesSubmit, leftoverHoldMs, leftoverPanelOpen, leftoverSkipOpen, leftoverSpeechOpen } from "@/lib/leftover";
import { aliasActivityId, navigate } from "@/lib/nav";
import { holdMsFor, REVEAL_AFTER_MISSES, WRONG_REVEAL_MS, WRONG_RETRY_MS, type FactStat } from "@/lib/practice";
import { useProgress } from "@/lib/progress";
import { dailyWalkActivityId, hopCreditsOf } from "@/lib/radial-web";
import { makeActivityRound, makeWelcomeRound } from "@/lib/questions";
import { rngFromSeed } from "@/lib/rng";
import { canAffordAnything, coinsForResult } from "@/lib/coins";
import { playCorrect, playStar, playStreak, playWrong, unlockAudio } from "@/lib/sound";
import { schoolStreak } from "@/lib/streak";
import type { Locale, Question } from "@/lib/types";
import { correctSpeech, keypadAllowsDot, pandaLine, questionCorrect } from "@/lib/utils";

type Kind = "welcome" | "daily" | "activity";

interface Pack {
  title: string;
  items: Question[];
  unitId: string;
  date: string;
  schoolDay: number;
  fresh: number;
  review: number;
  activityId: string;
}

function playKey(kind: Kind, activityId: string | undefined, date: string): string {
  if (kind === "welcome") return "welcome";
  if (kind === "activity") return activityId ?? "practice";
  return dailyWalkActivityId(date);
}

function buildPack(
  kind: Kind,
  activityId: string | undefined,
  classUnitId: string,
  skipWeekend: boolean,
  shaky: Record<string, number>,
  facts: Record<string, FactStat>,
  learnerId: string,
  attempt: number,
  locale: Locale,
  grade: 3 | 4,
): Pack {
  const date = todayIso();
  const ui = UI[locale];
  if (kind === "welcome") {
    return {
      title: ui.whatsHiding,
      items: makeWelcomeRound(rngFromSeed(`welcome:${learnerId}:${attempt}`), locale),
      unitId: "u1",
      date,
      schoolDay: 0,
      fresh: 4,
      review: 0,
      activityId: "welcome",
    };
  }
  if (kind === "activity") {
    const found = activityById(aliasActivityId(activityId ?? ""));
    const items = found
      ? makeActivityRound(
          found.activity,
          rngFromSeed(`activity:${learnerId}:${found.activity.id}:${attempt}`),
          undefined,
          locale,
          facts,
        )
      : [];
    return {
      title: found?.activity.title ?? ui.play,
      items,
      unitId: found?.unit.id ?? "u1",
      date,
      schoolDay: 0,
      fresh: items.length,
      review: 0,
      activityId: activityId ?? "practice",
    };
  }
  const walk = makeDailyWalk({
    date,
    classUnitId: classUnitId || undefined,
    skipWeekend,
    shaky,
    facts,
    learnerId,
    attempt,
    locale,
    grade,
  });
  return {
    title: walkLabel(walk, locale),
    items: walk.items,
    unitId: walk.unit.id,
    date: walk.date,
    schoolDay: walk.schoolDay,
    fresh: walk.fresh,
    review: walk.review,
    activityId: dailyWalkActivityId(walk.date),
  };
}

export function PlayPage({ kind, activityId }: { kind: Kind; activityId?: string }) {
  const sessions = useProgress((s) => s.sessions);
  const markWelcome = useProgress((s) => s.markWelcome);
  const recordRound = useProgress((s) => s.recordRound);
  const recordSession = useProgress((s) => s.recordSession);
  const noteAttempt = useProgress((s) => s.noteAttempt);
  const awardCoins = useProgress((s) => s.awardCoins);

  const [pack] = useState(() => {
    const st = useProgress.getState();
    const date = todayIso();
    const calendarId = suggestedUnitId(date, st.classUnitId || undefined, st.pathGrade);
    const unitGuess = dailyStartUnitId(st.classUnitId || undefined, calendarId, st.sessions, st.activities, date);
    const key = playKey(kind, activityId, date);
    const attempt = st.beginPlay(key);
    const locale = parseLocale(st.locale);
    return buildPack(
      kind,
      activityId,
      st.classUnitId || unitGuess,
      st.skipWeekend,
      st.shaky,
      st.facts ?? {},
      st.learnerId,
      attempt,
      locale,
      st.pathGrade ?? 3,
    );
  });
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [finishPhase, setFinishPhase] = useState<"play" | "summary" | null>(null);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [shake, setShake] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [misses, setMisses] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [hop, setHop] = useState(false);
  const [star, setStar] = useState(false);
  const [pose, setPose] = useState<Pose>("think");
  const [interacted, setInteracted] = useState(false);
  const [cardMisses, setCardMisses] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [combo, setCombo] = useState(0);
  const holdRef = useRef(0);
  const recorded = useRef(false);
  const startedAt = useRef(typeof performance !== "undefined" ? performance.now() : Date.now());

  const q = pack.items[i];
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const who = q?.source === "review" ? "rem" : "nix";
  const ui = useUi();
  const locale = parseLocale(useProgress((s) => s.locale));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qa = new URLSearchParams(window.location.search).get("qa") === "1";
    if (!qa) {
      delete window.__G3_Q;
      return;
    }
    const data = (q?.data ?? {}) as Record<string, unknown>;
    window.__G3_Q = q
      ? {
          answer: q.answer,
          needsInteract: Boolean(q.needsInteract),
          kind: q.kind,
          input: q.input,
          choices: q.choices ?? null,
          prompt: q.prompt,
          interacted,
          checkDisabled: Boolean(interactGatesSubmit(q.kind, q.needsInteract) && !interacted),
          value: typeof data.value === "number" ? data.value : null,
          max: typeof data.max === "number" ? data.max : null,
          unit: typeof data.unit === "string" ? data.unit : null,
          attribute: typeof data.attribute === "string" ? data.attribute : null,
        }
      : null;
  }, [q, interacted]);

  useEffect(() => {
    unlockAudio();
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(holdRef.current);
  }, []);

  useEffect(() => {
    if (!q || q.input !== "keypad" && q.input !== "money") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (status !== "idle") return;
      if (interactGatesSubmit(q.kind, q.needsInteract) && !interacted) return;
      const leftover = q.kind === "tenframe";
      const allowDot = keypadAllowsDot(q);
      if (e.key === "Enter") {
        e.preventDefault();
        check();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setValue((v) => applyKeypadKey(v, "back", { replace: leftover, allowDot }));
      } else if (/^\d$/.test(e.key)) {
        e.preventDefault();
        setValue((v) => applyKeypadKey(v, e.key, { replace: leftover, allowDot }));
      } else if (e.key === "." && allowDot) {
        e.preventDefault();
        setValue((v) => applyKeypadKey(v, ".", { allowDot: true }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function resetCard() {
    setValue("");
    setStatus("idle");
    setHop(false);
    setStar(false);
    setPose("think");
    setInteracted(false);
    setCardMisses(0);
    setReveal(false);
    startedAt.current = typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  function elapsedMs() {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    return Math.round(now - startedAt.current);
  }

  function track(ok: boolean) {
    if (!q) return;
    noteAttempt({ key: q.factKey, kind: q.kind, ok, ms: elapsedMs(), date: pack.date });
  }

  function finish(nextCorrect: number, nextMisses: string[]) {
    if (recorded.current) return;
    recorded.current = true;
    const total = pack.items.length;
    const pct = total === 0 ? 0 : nextCorrect / total;
    const earned = nextCorrect + (pct >= 1 ? 2 : pct >= 0.7 ? 1 : 0);
    recordRound({
      activityId: pack.activityId,
      correct: nextCorrect,
      total,
      earned,
      misses: nextMisses,
    });
    if (kind === "daily") {
      recordSession({
        date: pack.date,
        unitId: pack.unitId,
        schoolDay: pack.schoolDay,
        correct: nextCorrect,
        total,
        fresh: pack.fresh,
        review: pack.review,
        completed: true,
      });
    }
    if (kind === "welcome") markWelcome();
    const gained = coinsForResult(nextCorrect, total);
    awardCoins(gained);
    setCoinsEarned(gained);
    playStar();
    setPose("star");
    if (kind === "welcome") {
      navigate({ id: "path" }, { replace: true });
      return;
    }
    setFinishPhase("play");
    setDone(true);
  }

  function goNext(nextCorrect: number, nextMisses: string[]) {
    if (i + 1 >= pack.items.length) {
      finish(nextCorrect, nextMisses);
      return;
    }
    setI((n) => n + 1);
    resetCard();
  }

  function check(override?: string) {
    if (!q || status !== "idle") return;
    if (interactGatesSubmit(q.kind, q.needsInteract) && !interacted) {
      setShake((n) => n + 1);
      return;
    }
    const given = override ?? value;
    if (!given.length) return;
    if (questionCorrect(given, q)) {
      const nextCorrect = correct + 1;
      const nextCombo = combo + 1;
      setCorrect(nextCorrect);
      setCombo(nextCombo);
      setStatus("correct");
      setPose("celebrate");
      setHop(true);
      setStar(true);
      setValue(given);
      setReveal(false);
      if (nextCombo >= 3) playStreak();
      else playCorrect();
      track(true);
      const hold = holdMsFor(q.kind, leftoverHoldMs(), reduce);
      holdRef.current = window.setTimeout(() => goNext(nextCorrect, misses), hold);
    } else {
      const nextCardMiss = cardMisses + 1;
      setCardMisses(nextCardMiss);
      setCombo(0);
      setStatus("wrong");
      setPose("oops");
      setShake((n) => n + 1);
      playWrong();
      track(false);
      const key = q.factKey ?? q.prompt;
      const nextMisses = misses.includes(key) ? misses : [...misses, key].slice(0, 12);
      setMisses(nextMisses);
      if (nextCardMiss >= REVEAL_AFTER_MISSES) {
        setReveal(true);
        setValue(q.answer);
        holdRef.current = window.setTimeout(() => goNext(correct, nextMisses), reduce ? 280 : WRONG_REVEAL_MS);
      } else {
        setValue("");
        holdRef.current = window.setTimeout(() => {
          setStatus("idle");
          setPose("think");
          setHop(false);
        }, reduce ? 160 : WRONG_RETRY_MS);
      }
    }
  }

  function skip() {
    if (!q || status !== "idle") return;
    if (interactGatesSubmit(q.kind, q.needsInteract) && !interacted) return;
    const key = q.factKey ?? q.prompt;
    const nextMisses = misses.includes(key) ? misses : [...misses, key].slice(0, 12);
    setMisses(nextMisses);
    setCombo(0);
    track(false);
    goNext(correct, nextMisses);
  }

  if (!pack.items.length) {
    return (
      <AppScene scene="play" tabs={<AppTabs active="play" />}>
        <AppHeader variant="play" />
        <div className="grid flex-1 place-items-center p-6">
          <Button onClick={() => navigate({ id: "home" })}>{ui.path}</Button>
        </div>
      </AppScene>
    );
  }

  if (done && finishPhase === "play") {
    const st = useProgress.getState();
    return (
      <MiniGame
        seed={`minigame:${st.learnerId}:${pack.activityId}:${pack.date}`}
        owned={st.squishees}
        skipLabel={ui.skip}
        pokePrompt={ui.pokeThe}
        whoHidLabel={ui.whoHid}
        matchLabel={ui.findPairs}
        onDone={() => setFinishPhase("summary")}
      />
    );
  }

  if (done) {
    const streak = schoolStreak(sessions, pack.date);
    const st = useProgress.getState();
    const shop = canAffordAnything(st.coins, st.squishees);
    const rollsNow = hopCreditsOf(st.activities, st.pathHopSpent, st.sessions);
    const stepsNow = st.pathStepsLeft;
    const toLessons = kind === "activity" || rollsNow > 0 || stepsNow > 0;
    return (
      <AppScene scene="hills" tabs={<AppTabs active="home" />}>
        <AppHeader />
        <div className="grid flex-1 place-items-center px-4 py-8">
        <div className="w-full text-center">
          <div className="mx-auto grid h-52 w-52 place-items-center">
            <Mascot pose="celebrate" hop size="lg" className="mx-auto" />
          </div>
          <h1 className="mt-2 font-display text-3xl">{ui.niceWalk}</h1>
          <p className="text-muted">
            {ui.of(correct, pack.items.length)} · {pack.title}
          </p>
          {kind === "daily" ? <p className="mt-1 text-sm text-star">{ui.streak(streak)}</p> : null}
          <p className="mt-4 text-sm text-teal">{ui.youEarnedCoins(coinsEarned)}</p>
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={() => navigate({ id: toLessons ? "lessons" : "home" }, { replace: true })}
          >
            {stepsNow > 0 ? ui.hopPick : rollsNow > 0 ? ui.rollDie : ui.home}
          </Button>
          {shop ? (
            <Button
              className="mt-3 w-full"
              size="lg"
              variant="secondary"
              onClick={() => navigate({ id: "shelf" }, { replace: true })}
            >
              {ui.toShelf}
            </Button>
          ) : null}
        </div>
        </div>
      </AppScene>
    );
  }

  if (!q) return null;

  const leftover = q.kind === "tenframe";
  const gate = { kind: q.kind, needsInteract: q.needsInteract, interacted, status };
  const showPanel = leftoverPanelOpen(gate);
  const showSkip = leftoverSkipOpen(gate);
  const speech = reveal
    ? leftover
      ? ui.tryAgain
      : correctSpeech(q, locale)
    : pandaLine(q, locale, pose === "oops" ? "wrong" : status, interacted);
  const showSpeech = leftover
    ? leftoverSpeechOpen({
        kind: q.kind,
        interacted,
        status: pose === "oops" ? "wrong" : status,
        reveal,
      })
    : status === "wrong" || pose === "oops" || reveal;
  const shownAnswer =
    reveal && !leftover ? (
      <p className="mt-2 text-center text-sm text-good" data-show-correct="1">
        {speech}
      </p>
    ) : reveal && leftover ? (
      <p className="sr-only" data-show-correct="1">
        {q.answer}
      </p>
    ) : null;
  const hideHeading =
    q.kind === "fluency" ||
    q.kind === "word" ||
    q.kind === "jumps" ||
    leftover ||
    (q.kind === "money" && (q.data as { mode?: string }).mode === "make");
  const board = (
    <Board
      key={q.id}
      question={q}
      value={value}
      setValue={setValue}
      interacted={interacted}
      onInteract={() => setInteracted(true)}
      status={status}
      shake={shake}
    />
  );
  const panel = showPanel ? (
    <AnswerPanel
      question={q}
      value={value}
      setValue={setValue}
      onCheck={check}
      disabled={status !== "idle" || Boolean(interactGatesSubmit(q.kind, q.needsInteract) && !interacted)}
    />
  ) : null;

  return (
    <AppScene scene="play" tabs={<AppTabs active="play" />} className="overflow-x-hidden">
      <div className="flex min-h-0 flex-1 flex-col" data-play-page="1">
        <AppHeader variant="play" />
        <div className="flex min-h-0 flex-1 flex-col px-3">
          {showSpeech ? (
            <p className="mx-auto mb-1 max-w-[14rem] rounded-[18px] bg-white/80 px-3 py-1.5 text-center text-sm">
              {speech}
            </p>
          ) : null}
          {!hideHeading ? (
            <h2 className="mb-2 text-center font-display text-xl leading-tight sm:text-2xl">
              {cardHeading(q, interacted)}
            </h2>
          ) : null}
          <div className={leftover ? "mx-auto flex min-h-0 w-full flex-1 items-center overflow-y-auto" : "min-h-0 flex-1 overflow-y-auto"}>
            <div className={leftover ? "w-full" : undefined}>{board}</div>
            {q.kind === "word" || q.prompt.length > 70 ? (
              <div className="mt-3">
                <ScratchPad />
              </div>
            ) : null}
          </div>
        </div>
        {showPanel || shownAnswer || showSkip ? (
          <div className="keypad-dock shrink-0" data-play-keys="1">
            {showPanel ? (
              <div className="mascot-dock">
                <Mascot who={who} pose={pose} hop={hop} size="sm" className="!h-full !w-full" />
                <StarPop show={star} />
              </div>
            ) : null}
            {panel}
            {shownAnswer}
            {showSkip ? (
              <button type="button" className="skip-quiet" onClick={skip}>
                {ui.skip}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="relative mx-auto mb-1 h-16 w-16">
            <Mascot who={who} pose={pose} hop={hop} size="sm" className="!h-16 !w-16" />
            <StarPop show={star} />
          </div>
        )}
      </div>
    </AppScene>
  );
}
