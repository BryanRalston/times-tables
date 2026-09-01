import { useEffect, useRef, useState } from "react";
import { AnswerPanel } from "@/components/answer-panel";
import { MagentaVideo } from "@/components/magenta-video";
import { Mascot, StarPop, type Pose } from "@/components/mascot";
import { Board } from "@/components/models";
import { ScratchPad } from "@/components/scratch";
import { Button } from "@/components/ui/button";
import { ART } from "@/lib/art";
import { todayIso } from "@/lib/calendar";
import { activityById } from "@/lib/curriculum";
import { makeDailyWalk, walkLabel } from "@/lib/daily";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { makeActivityRound, makeWelcomeRound } from "@/lib/questions";
import { playCorrect, playStar, playWrong, unlockAudio } from "@/lib/sound";
import { schoolStreak } from "@/lib/streak";
import type { ItemSource, Question } from "@/lib/types";
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

function buildPack(kind: Kind, activityId: string | undefined, classUnitId: string, skipWeekend: boolean, shaky: Record<string, number>): Pack {
  const date = todayIso();
  if (kind === "welcome") {
    return {
      title: "What's hiding",
      items: makeWelcomeRound(),
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
    const items = found ? makeActivityRound(found.activity) : [];
    return {
      title: found?.activity.title ?? "Practice",
      items,
      unitId: found?.unit.id ?? "u1",
      date,
      schoolDay: 0,
      fresh: items.length,
      review: 0,
      activityId: activityId ?? "practice",
    };
  }
  const walk = makeDailyWalk({ date, classUnitId: classUnitId || undefined, skipWeekend, shaky });
  return {
    title: walkLabel(walk),
    items: walk.items,
    unitId: walk.unit.id,
    date: walk.date,
    schoolDay: walk.schoolDay,
    fresh: walk.fresh,
    review: walk.review,
    activityId: `daily:${walk.unit.id}`,
  };
}

function sourceLabel(src?: ItemSource): string | null {
  if (src === "review") return "Review";
  if (src === "fluency") return "Fluency";
  if (src === "friday") return "Friday";
  if (src === "fresh") return "New";
  return null;
}

export function PlayPage({ kind, activityId }: { kind: Kind; activityId?: string }) {
  const classUnitId = useProgress((s) => s.classUnitId);
  const skipWeekend = useProgress((s) => s.skipWeekend);
  const shaky = useProgress((s) => s.shaky);
  const sessions = useProgress((s) => s.sessions);
  const markWelcome = useProgress((s) => s.markWelcome);
  const recordRound = useProgress((s) => s.recordRound);
  const recordSession = useProgress((s) => s.recordSession);
  const noteFact = useProgress((s) => s.noteFact);

  const [pack] = useState(() => buildPack(kind, activityId, classUnitId, skipWeekend, shaky));
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [interacted, setInteracted] = useState(false);
  const [shake, setShake] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [misses, setMisses] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [hop, setHop] = useState(false);
  const [star, setStar] = useState(false);
  const [pose, setPose] = useState<Pose>("think");
  const holdRef = useRef(0);
  const recorded = useRef(false);

  const q = pack.items[i];
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const who = q?.source === "review" ? "rem" : "nix";

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
    setInteracted(false);
    setHop(false);
    setStar(false);
    setPose("think");
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
    playStar();
    setPose("star");
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
    if (q.needsInteract && !interacted) return;
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
        <Button onClick={() => navigate({ id: "home" })}>Path</Button>
      </div>
    );
  }

  if (done) {
    const streak = schoolStreak(sessions, pack.date);
    return (
      <div className="paper-grid mx-auto grid min-h-dvh max-w-lg place-items-center px-4 py-8">
        <div className="w-full text-center">
          <div className="relative mx-auto h-52 w-52">
            <Mascot pose="celebrate" hop size="lg" className="mx-auto" />
            {!reduce ? <MagentaVideo src={ART.nixCelebrateVid} className="absolute inset-0" /> : null}
          </div>
          <h1 className="mt-2 font-display text-3xl">Nice walk</h1>
          <p className="text-muted">
            {correct} of {pack.items.length} · {pack.title}
          </p>
          {kind === "daily" ? <p className="mt-1 text-sm text-star">School-day streak {streak}</p> : null}
          <Button className="mt-6 w-full" size="lg" onClick={() => navigate({ id: "home" }, { replace: true })}>
            Home
          </Button>
        </div>
      </div>
    );
  }

  if (!q) return null;

  const gated = Boolean(q.needsInteract && !interacted);
  const pill = sourceLabel(q.source);
  const speech =
    pose === "oops"
      ? "Try again."
      : status === "correct"
        ? `n is ${q.answer}.`
        : who === "rem"
          ? "Review with Rem."
          : (q.hint ?? "Take what you can see.");

  return (
    <div className="paper-grid mx-auto min-h-dvh max-w-lg overflow-x-hidden px-4 pb-8 pt-3">
      <header className="mb-2 flex items-center gap-2">
        <button type="button" className="text-sm text-muted" onClick={() => navigate({ id: "home" })}>
          ← Home
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

      <h2 className="mb-3 text-center font-display text-xl leading-tight sm:text-2xl">{q.prompt}</h2>

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
        {gated ? <p className="mb-2 text-center text-sm text-muted">Take what you can see first.</p> : null}
        <AnswerPanel question={q} value={value} setValue={setValue} onCheck={check} disabled={status !== "idle" || gated} />
      </div>

      {q.kind === "word" || q.prompt.length > 70 ? <div className="mt-3"><ScratchPad /></div> : null}

      <button type="button" className="mt-4 w-full text-center text-xs text-faint" onClick={skip}>
        Skip
      </button>
    </div>
  );
}
