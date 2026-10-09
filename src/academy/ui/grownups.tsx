import { useEffect, useRef, useState } from "react";
import { rngRandom } from "@/lib/rng";
import {
  DEFAULT_START_GRADE,
  WEEKDAY_LETTERS,
  WEEKDAY_NAMES,
  cleanName,
  gradeLabel,
  mondayIndex,
  todayIso,
  weekDates,
  type Grade,
  type Save,
} from "../model";
import { GROWNUP_HOLD_MS, gateAnswerMatches, grownupGate } from "../questions";
import { weeklyCard } from "../progress-card";
import { sheetHref } from "../games/registry";
import {
  formatMinutes,
  masteredChips,
  parentBrief,
  practiceTip,
  secondsThisWeek,
  skillBars,
} from "../rewards";
import { activeChild, addChild } from "../storage";
import { BackupPanel } from "./backup-panel";
import { BackLink, Flame, Foot, Logo, SquisheeImg, cx } from "./bits";
import { InstallTip } from "./install-tip";

const GATE_KEY = "squishee-academy-gate";

function gateOpen(): boolean {
  try {
    return sessionStorage.getItem(GATE_KEY) === "ok";
  } catch {
    return false;
  }
}

export function GrownupsScreen({ save, onSave }: { save: Save; onSave: (save: Save) => void }) {
  const [open, setOpen] = useState(gateOpen);
  const [gate, setGate] = useState(() => grownupGate(rngRandom()));
  const [guess, setGuess] = useState("");
  const [miss, setMiss] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<Grade>(DEFAULT_START_GRADE);
  const [armed, setArmed] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, []);

  function clearHold() {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }

  function beginHold() {
    if (armed) return;
    clearHold();
    setHolding(true);
    setMiss(false);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      setArmed(true);
    }, GROWNUP_HOLD_MS);
  }

  if (!open) {
    return (
      <div className="ac-shell ac-mid">
        <header className="ac-top">
          <Logo />
        </header>
        <form
          className="ac-gate"
          onSubmit={(e) => {
            e.preventDefault();
            if (!armed || !guess) return;
            if (gateAnswerMatches(gate, guess)) {
              try {
                sessionStorage.setItem(GATE_KEY, "ok");
              } catch {
                /* session storage can be blocked; the gate still opens this visit */
              }
              setOpen(true);
              return;
            }
            setMiss(true);
            setGuess("");
            setArmed(false);
            setGate(grownupGate(rngRandom()));
          }}
        >
          <h1>Grown-ups</h1>
          <p>Press and hold, then multiply. This keeps the charts for families.</p>
          {armed ? (
            <>
              <p className="ac-gate-q">
                What is {gate.a} × {gate.b}?
              </p>
              <input
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={guess}
                onChange={(e) => setGuess(e.target.value.replace(/\D/g, "").slice(0, 4))}
                aria-label="Answer"
              />
              <button type="submit" className="ac-go">
                Continue
              </button>
            </>
          ) : (
            <button
              type="button"
              className={cx("ac-hold", holding && "is-on")}
              onPointerDown={(e) => {
                e.preventDefault();
                beginHold();
              }}
              onPointerUp={clearHold}
              onPointerCancel={clearHold}
              onPointerLeave={clearHold}
              onContextMenu={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (e.repeat) return;
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  beginHold();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === " " || e.key === "Enter") clearHold();
              }}
            >
              {holding ? "Keep holding..." : "Press and hold"}
            </button>
          )}
          {miss ? <p className="ac-hint">That answer is not right.</p> : null}
          <BackLink>Back to games</BackLink>
        </form>
      </div>
    );
  }

  const child = activeChild(save);
  const today = todayIso();
  const days = weekDates(today);
  const seconds = days.map((day) => child.secondsByDay[day] ?? 0);
  const peak = Math.max(1, ...seconds);
  const todayIndex = mondayIndex(today);
  const bars = skillBars(child.skills);
  const chips = masteredChips(child.skills);
  const lessons = parentBrief(child);
  const tip = practiceTip(child.name, child.skills);
  const weekSeconds = secondsThisWeek(child.secondsByDay, today);
  const card = weeklyCard(child, today);
  const sheet =
    tip.factor != null ? sheetHref("times", `?factor=${tip.factor}`) : sheetHref("times");

  return (
    <div className="ac-shell ac-mid">
      <header className="ac-parent-top">
        <h1>Grown-ups</h1>
      </header>
      <InstallTip />

      <div className="ac-kids">
        {save.children.map((kid) => (
          <button
            key={kid.id}
            type="button"
            className={cx("ac-kid", kid.id === child.id && "is-on")}
            onClick={() => onSave({ ...save, activeId: kid.id })}
          >
            <SquisheeImg id={kid.avatarId} />
            <span>
              {kid.name} · {gradeLabel(kid.grade)}
            </span>
          </button>
        ))}
        {save.children.length < 4 ? (
          <button type="button" className="ac-kid" onClick={() => setAdding((v) => !v)}>
            + Child
          </button>
        ) : null}
      </div>

      {adding ? (
        <form
          className="ac-add-child"
          onSubmit={(e) => {
            e.preventDefault();
            const next = addChild(save, name, grade);
            if (next !== save) onSave(next);
            setName("");
            setAdding(false);
          }}
        >
          <input
            value={name}
            maxLength={12}
            placeholder="Name"
            aria-label="Child name"
            onChange={(e) => setName(e.target.value)}
          />
          <GradeChips grade={grade} onGrade={setGrade} />
          <button type="submit" className="ac-go" disabled={!cleanName(name)}>
            Add
          </button>
        </form>
      ) : null}

      <div className="ac-stats3">
        <article className="ac-statcard">
          <strong>
            <Flame /> {child.streak}
          </strong>
          <span>day streak</span>
        </article>
        <article className="ac-statcard">
          <strong>{formatMinutes(weekSeconds)}</strong>
          <span>this week</span>
        </article>
        <article className="ac-statcard">
          <strong>{chips.length}</strong>
          <span>skills mastered</span>
        </article>
      </div>

      <section className="ac-panel ac-week-card">
        <h2>Progress card</h2>
        <p>{card.line}</p>
        <p className="ac-hint">
          Streak {card.streak} · {card.mastered} skills mastered
        </p>
      </section>

      <section className="ac-panel">
        <h2>This week</h2>
        <div className="ac-bars">
          {days.map((day, i) => {
            const height = seconds[i] ? Math.max(12, Math.round((seconds[i]! / peak) * 100)) : 8;
            return (
              <div key={day} className="ac-bar-col">
                <span
                  className={i === todayIndex ? "is-today" : ""}
                  style={{ height: `${height}%` }}
                  title={`${WEEKDAY_NAMES[i]} ${formatMinutes(seconds[i] ?? 0)}`}
                />
                <small>{WEEKDAY_LETTERS[i]}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="ac-panel">
        <h2>What {child.name || "your child"} is learning</h2>
        {lessons.map((row) => (
          <article key={row.key} className="ac-lesson">
            <h3>{row.label}</h3>
            <p>{row.learning}</p>
            <p className="ac-next">Practice next: {row.next}</p>
          </article>
        ))}
      </section>

      <section className="ac-panel">
        <h2>Skills</h2>
        {bars.length === 0 ? (
          <p className="ac-hint">Play a few rounds and this fills in.</p>
        ) : (
          bars.map((row) => (
            <div key={row.key} className="ac-skill">
              <span>{row.label}</span>
              <strong>{row.pct}%</strong>
              <div className="ac-track" aria-hidden="true">
                <i className={row.pct < 70 ? "is-low" : ""} style={{ width: `${row.pct}%` }} />
              </div>
            </div>
          ))
        )}
        {chips.length > 0 ? (
          <div className="ac-chips">
            {chips.map((chip) => (
              <span key={chip} className="ac-chip">
                ✓ {chip}
              </span>
            ))}
          </div>
        ) : (
          <p className="ac-hint">Mastered skills show up after a little practice.</p>
        )}
        <div className="ac-tip">
          <p>{tip.text}</p>
          <a href={sheet}>Print the worksheet</a>
        </div>
      </section>

      <BackupPanel save={save} onSave={onSave} />
      <BackLink>Back to games</BackLink>
      <Foot />
    </div>
  );
}

export function GradeChips({
  grade,
  onGrade,
  className,
}: {
  grade: Grade;
  onGrade: (grade: Grade) => void;
  className?: string;
}) {
  const grades: Grade[] = ["K", "1", "2", "3"];
  return (
    <div className={cx("ac-grades", className)} role="group" aria-label="Grade">
      {grades.map((g) => (
        <button key={g} type="button" className={cx("ac-grade", grade === g && "is-on")} onClick={() => onGrade(g)}>
          {g === "K" ? "K" : g}
        </button>
      ))}
    </div>
  );
}
