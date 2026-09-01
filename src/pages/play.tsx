import { useEffect, useRef, useState } from "react";
import { AnswerPanel } from "@/components/answer-panel";
import { useUi } from "@/components/chrome";
import { MiniGame } from "@/components/minigame";
import { Mascot, StarPop, type Pose } from "@/components/mascot";
import { Board } from "@/components/models";
import { ScratchPad } from "@/components/scratch";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/lib/calendar";
import { activityById, suggestedUnitId } from "@/lib/curriculum";
import { makeDailyWalk, walkLabel } from "@/lib/daily";
import { parseLocale, UI } from "@/lib/i18n";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { makeActivityRound, makeWelcomeRound } from "@/lib/questions";
import { rngFromSeed } from "@/lib/rng";
import { canAffordAnything, coinsForResult } from "@/lib/coins";
import { playCorrect, playStar, playWrong, unlockAudio } from "@/lib/sound";
import { schoolStreak } from "@/lib/streak";
import type { GraphData, ItemSource, Locale, Question } from "@/lib/types";
import { answersMatch } from "@/lib/utils";

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

function playKey(kind: Kind, activityId: string | undefined, unitId: string): string {
  if (kind === "welcome") return "welcome";
  if (kind === "activity") return activityId ?? "practice";
  return `daily:${unitId}`;
}

function buildPack(
  kind: Kind,
  activityId: string | undefined,
  classUnitId: string,
  skipWeekend: boolean,
  shaky: Record<string, number>,
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
    const found = activityById(activityId ?? "");
    const items = found
      ? makeActivityRound(found.activity, rngFromSeed(`activity:${learnerId}:${found.activity.id}:${attempt}`), undefined, locale)
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
    activityId: `daily:${walk.unit.id}`,
  };
}

function sourceLabel(src: ItemSource | undefined, locale: Locale): string | null {
  const ui = UI[locale];
  if (src === "review") return locale === "es" ? "Repaso" : locale === "pt-BR" ? "Revisão" : "Review";
  if (src === "fluency") return locale === "es" ? "Fluidez" : locale === "pt-BR" ? "Fluência" : "Fluency";
  if (src === "friday") return ui.fridayCheck;
  if (src === "fresh") return locale === "es" ? "Nuevo" : locale === "pt-BR" ? "Novo" : "New";
  return null;
}

export function PlayPage({ kind, activityId }: { kind: Kind; activityId?: string }) {
  const sessions = useProgress((s) => s.sessions);
  const markWelcome = useProgress((s) => s.markWelcome);
  const recordRound = useProgress((s) => s.recordRound);
  const recordSession = useProgress((s) => s.recordSession);
  const noteFact = useProgress((s) => s.noteFact);
  const awardCoins = useProgress((s) => s.awardCoins);

  const [pack] = useState(() => {
    const st = useProgress.getState();
    const unitGuess = suggestedUnitId(todayIso(), st.classUnitId || undefined, st.pathGrade);
    const key = playKey(kind, activityId, unitGuess);
    const attempt = st.beginPlay(key);
    const locale = parseLocale(st.locale);
    return buildPack(kind, activityId, st.classUnitId, st.skipWeekend, st.shaky, st.learnerId, attempt, locale, st.pathGrade ?? 3);
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
  const holdRef = useRef(0);
  const recorded = useRef(false);

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
    window.__G3_Q = q
      ? {
          answer: q.answer,
          needsInteract: Boolean(q.needsInteract),
          kind: q.kind,
          input: q.input,
          choices: q.choices ?? null,
          prompt: q.prompt,
          interacted,
          checkDisabled: Boolean(q.needsInteract && !interacted),
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
      if (e.key === "Enter") {
        e.preventDefault();
        check();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setValue((v) => v.slice(0, -1));
      } else if (/^\d$/.test(e.key)) {
        e.preventDefault();
        setValue((v) => (v + e.key).slice(0, 8));
      } else if (e.key === ".") {
        e.preventDefault();
        setValue((v) => (v.includes(".") ? v : `${v}.`));
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
    if (q.needsInteract && !interacted) {
      setShake((n) => n + 1);
      return;
    }
    const given = override ?? value;
    if (!given.length) return;
    if (answersMatch(given, q.answer, q.alts)) {
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setStatus("correct");
      setPose("celebrate");
      setHop(true);
      setStar(true);
      setValue(given);
      playCorrect();
      if (q.factKey) noteFact(q.factKey, true);
      holdRef.current = window.setTimeout(() => goNext(nextCorrect, misses), reduce ? 200 : 800);
    } else {
      setStatus("wrong");
      setPose("oops");
      setShake((n) => n + 1);
      playWrong();
      if (q.factKey) noteFact(q.factKey, false);
      const key = q.factKey ?? q.prompt;
      setMisses((m) => (m.includes(key) ? m : [...m, key].slice(0, 12)));
      holdRef.current = window.setTimeout(() => {
        setStatus("idle");
        setPose("think");
        setHop(false);
      }, 450);
    }
  }

  function skip() {
    if (!q || status !== "idle") return;
    const key = q.factKey ?? q.prompt;
    const nextMisses = misses.includes(key) ? misses : [...misses, key].slice(0, 12);
    setMisses(nextMisses);
    if (q.factKey) noteFact(q.factKey, false);
    goNext(correct, nextMisses);
  }

  if (!pack.items.length) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <Button onClick={() => navigate({ id: "home" })}>{ui.path}</Button>
      </div>
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
    return (
      <div className="mx-auto grid min-h-dvh max-w-lg place-items-center px-4 py-8">
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
          <Button className="mt-6 w-full" size="lg" onClick={() => navigate({ id: "home" }, { replace: true })}>
            {ui.home}
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
    );
  }

  if (!q) return null;

  const pill = sourceLabel(q.source, locale);
  const speech =
    pose === "oops"
      ? ui.tryAgain
      : status === "correct"
        ? ui.nIs(q.answer)
        : (q.hint ?? ui.takeWhatYouSee);

  return (
    <div className="mx-auto min-h-dvh max-w-lg overflow-x-hidden px-4 pb-8 pt-3">
      <header className="mb-2 flex items-center gap-2">
        <button type="button" className="text-sm text-muted" onClick={() => navigate({ id: "home" })}>
          ← {ui.home}
        </button>
        <div className="mx-2 h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-teal transition-[width] duration-300" style={{ width: `${(i / pack.items.length) * 100}%` }} />
        </div>
        <span className="text-xs tabular-nums text-muted">
          {i + 1}/{pack.items.length}
        </span>
      </header>

      <div className="flex items-end gap-2">
        <div className="relative">
          <Mascot who={who} pose={pose} hop={hop} size="md" />
          <StarPop show={star} />
        </div>
        <p className="mb-4 max-w-[14rem] rounded-[18px] border border-line bg-surface px-3 py-2 text-sm">{speech}</p>
      </div>

      {pill ? (
        <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted">{pill}</p>
      ) : null}

      {q.sol?.length ? (
        <p className="mb-1 text-center text-[11px] font-medium uppercase tracking-wide text-faint">{q.sol.join(" · ")}</p>
      ) : null}
      {q.kind === "fluency" || q.kind === "word" || q.kind === "jumps" || (q.kind === "tenframe" && "equation" in (q.data as object) && (q.data as { equation?: string }).equation === q.prompt) || (q.kind === "money" && (q.data as { mode?: string }).mode === "make") ? null : (
        <h2 className="mb-3 text-center font-display text-xl leading-tight sm:text-2xl">
          {q.kind === "graph" && (q.data as GraphData).collect && interacted && (q.data as GraphData).readPrompt
            ? (q.data as GraphData).readPrompt
            : q.prompt}
        </h2>
      )}

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

      <div className="mt-4">
        <AnswerPanel
          question={q}
          value={value}
          setValue={setValue}
          onCheck={check}
          disabled={status !== "idle" || Boolean(q.needsInteract && !interacted)}
        />
      </div>

      {q.kind === "word" || q.prompt.length > 70 ? <div className="mt-3"><ScratchPad /></div> : null}

      <button type="button" className="mt-4 w-full text-center text-xs text-faint" onClick={skip}>
        {ui.skip}
      </button>
    </div>
  );
}
