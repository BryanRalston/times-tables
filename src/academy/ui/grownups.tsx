import { useState } from "react";
import { rngRandom } from "@/lib/rng";
import {
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
import { grownupGate } from "../questions";
import { sheetHref } from "../games/registry";
import {
  formatMinutes,
  masteredChips,
  practiceTip,
  secondsThisWeek,
  skillBars,
} from "../rewards";
import { activeChild, addChild } from "../storage";
import { BackLink, Flame, FreeNote, Logo, SquisheeImg, cx } from "./bits";

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
  const [grade, setGrade] = useState<Grade>("K");

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
            if (Number(guess) === gate.answer) {
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
            setGate(grownupGate(rngRandom()));
          }}
        >
          <h1>Grown-ups</h1>
          <p>Ask a grown-up to answer. This keeps the charts for families.</p>
          <p className="ac-gate-q">
            What is {gate.a} + {gate.b}?
          </p>
          <input
            inputMode="numeric"
            autoComplete="off"
            value={guess}
            onChange={(e) => setGuess(e.target.value.replace(/\D/g, "").slice(0, 3))}
            aria-label="Answer"
          />
          <button type="submit" className="ac-go">
            Continue
          </button>
          {miss ? <p className="ac-hint">Try again.</p> : null}
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
  const tip = practiceTip(child.name, child.skills);
  const weekSeconds = secondsThisWeek(child.secondsByDay, today);
  const sheet =
    tip.factor != null ? sheetHref("times", `?factor=${tip.factor}`) : sheetHref("times");

  return (
    <div className="ac-shell ac-mid">
      <header className="ac-parent-top">
        <h1>Grown-ups</h1>
      </header>

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

      <BackLink>Back to games</BackLink>
      <FreeNote />
    </div>
  );
}

export function GradeChips({ grade, onGrade }: { grade: Grade; onGrade: (grade: Grade) => void }) {
  const grades: Grade[] = ["K", "1", "2", "3"];
  return (
    <div className="ac-grades" role="group" aria-label="Grade">
      {grades.map((g) => (
        <button key={g} type="button" className={cx("ac-grade", grade === g && "is-on")} onClick={() => onGrade(g)}>
          {g === "K" ? "K" : g}
        </button>
      ))}
    </div>
  );
}
