import { useEffect, useRef, useState } from "react";
import { rngRandom } from "@/lib/rng";
import { DEFAULT_START_GRADE, cleanName, todayIso, type Grade, type Save } from "../model";
import { GROWNUP_HOLD_MS, gateAnswerMatches, grownupGate } from "../grownup-gate";
import { familyBrief } from "../progress-card";
import { attemptLabel } from "../family-report";
import { masteredChips, parentBrief } from "../rewards";
import { standardLine } from "../standards";
import { gradeText, show, t } from "../i18n";
import { activeChild, addChild } from "../storage";
import { LanguageButton, withLang } from "./lang";
import { BackupPanel } from "./backup-panel";
import { BackLink, Foot, Logo, SquisheeImg, cx } from "./bits";
import { GradeChips } from "./grade-chips";
import { HistoryPanel, useWeekPrint } from "./history-panel";
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
  const { weekPrint, printWeek } = useWeekPrint();

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
          <h1>{show("Grown-ups")}</h1>
          <p>{show("Press and hold, then multiply. This keeps the charts for families.")}</p>
          {armed ? (
            <>
              <p className="ac-gate-q">
                {show("What is")} {gate.a} × {gate.b}?
              </p>
              <input
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={guess}
                onChange={(e) => setGuess(e.target.value.replace(/\D/g, "").slice(0, 4))}
                aria-label={show("Answer")}
              />
              <button type="submit" className="ac-go">
                {show("Continue")}
              </button>
            </>
          ) : (
            <button
              type="button"
              className={cx("ac-hold", holding && "is-on")}
              onPointerDown={(e) => {
                e.preventDefault();
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  /* A pointer that already ended has nothing to capture. The hold still starts. */
                }
                beginHold();
              }}
              onPointerUp={clearHold}
              onPointerCancel={clearHold}
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
              {holding ? show("Keep holding...") : show("Press and hold")}
            </button>
          )}
          {miss ? <p className="ac-hint">{show("That answer is not right.")}</p> : null}
          <BackLink>{show("Back to games")}</BackLink>
        </form>
      </div>
    );
  }

  const child = activeChild(save);
  const today = todayIso();
  const report = familyBrief(child, today);
  const card = report.card;
  const games = report.games;
  const chips = masteredChips(child.skills);
  const lessons = parentBrief(child);
  const peak = Math.max(1, ...card.dayLines.map((day) => day.seconds));
  const showPractice = card.days > 0 || card.wins.length > 0 || card.stuck.length > 0;

  return (
    <div className={cx("ac-shell ac-mid", weekPrint && "is-print-week")}>
      <header className="ac-parent-top ac-no-print">
        <h1>{show("Grown-ups")}</h1>
        <LanguageButton lang={save.lang} onLang={(lang) => onSave(withLang(save, lang))} />
      </header>
      <div className="ac-kids ac-no-print">
        {save.children.map((kid) => (
          <button
            key={kid.id}
            type="button"
            className={cx("ac-kid", kid.id === child.id && "is-on")}
            onClick={() => onSave({ ...save, activeId: kid.id })}
          >
            <SquisheeImg id={kid.avatarId} />
            <span>
              {kid.name} · {gradeText(kid.grade)}
            </span>
          </button>
        ))}
        {save.children.length < 4 ? (
          <button type="button" className="ac-kid" onClick={() => setAdding((v) => !v)}>
            {show("+ Child")}
          </button>
        ) : null}
      </div>

      {adding ? (
        <form
          className="ac-add-child ac-no-print"
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
            placeholder={show("Name")}
            aria-label={show("Child name")}
            onChange={(e) => setName(e.target.value)}
          />
          <GradeChips grade={grade} onGrade={setGrade} />
          <button type="submit" className="ac-go" disabled={!cleanName(name)}>
            {show("Add")}
          </button>
        </form>
      ) : null}

      <div className="ac-stats3 ac-no-print">
        <article className="ac-statcard" data-days={card.days}>
          <strong>{card.days}</strong>
          <span>{card.days === 1 ? show("day this week") : show("days this week")}</span>
        </article>
        <article className="ac-statcard">
          <strong>{card.minutesLabel}</strong>
          <span>{show("this week")}</span>
        </article>
        <article className="ac-statcard">
          <strong>{chips.length}</strong>
          <span>{show("skills mastered")}</span>
        </article>
      </div>

      <section className="ac-panel ac-report">
        <p className="ac-kicker">Squishee Academy</p>
        <h2>{card.headline}</h2>
        <p>{card.line}</p>
        {card.streakNote ? <p className="ac-hint">{card.streakNote}</p> : null}
        <div className="ac-bars" aria-label={show("This week")}>
          {card.dayLines.map((day) => {
            const height = day.seconds ? Math.max(12, Math.round((day.seconds / peak) * 100)) : 8;
            return (
              <div key={day.iso} className="ac-bar-col" aria-label={`${day.name}, ${day.played ? day.label : show("No practice")}`}>
                <div className="ac-bar-plot">
                  <span className={day.iso === today ? "is-today" : ""} style={{ height: `${height}%` }} />
                </div>
                <small>{day.letter}</small>
                <small className="ac-bar-min">{day.label}</small>
              </div>
            );
          })}
        </div>
        {showPractice ? (
          <>
            <h3>{show("Going well")}</h3>
            {card.wins.length > 0 ? (
              <ul className="ac-report-list">
                {card.wins.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="ac-hint">{card.winsNote}</p>
            )}
            <h3>{show("Still learning")}</h3>
            {card.stuck.length > 0 ? (
              <ul className="ac-report-list">
                {card.stuck.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="ac-hint">{card.stuckNote}</p>
            )}
          </>
        ) : null}
        <h3>{show("Tonight")}</h3>
        <p>{card.suggestion}</p>
        <p className="ac-hint">{card.deviceNote}</p>
        <div className="ac-report-actions ac-no-print">
          {card.sheetHref ? (
            <a href={card.sheetHref}>
              {card.sheetTitle
                ? t(`Print “${card.sheetTitle}”`, `Imprimir «${card.sheetTitle}»`, `Imprimir «${card.sheetTitle}»`, `Imprimer « ${card.sheetTitle} »`, `打印“${card.sheetTitle}”`, `“${card.sheetTitle}” छापो`, `اطبع «${card.sheetTitle}»`)
                : show("Print the worksheet")}
            </a>
          ) : null}
          <button type="button" onClick={printWeek}>
            {show("Print this week")}
          </button>
        </div>
      </section>

      <HistoryPanel child={child} />

      <section className="ac-panel ac-no-print" data-stories-report={report.stories.finishes}>
        <h2>{t("Stories", "Cuentos")}</h2>
        <p>{report.stories.line}</p>
        {report.stories.titles.length > 0 ? (
          <ul className="ac-report-list">
            {report.stories.titles.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="ac-panel ac-no-print">
        <h2>{show("By game")}</h2>
        {games.length === 0 ? (
          <p className="ac-hint">{t("Play a few rounds and this fills in.", "Juega unas rondas y esto se llena.")}</p>
        ) : (
          games.map((game) => (
            <div key={game.id} className="ac-game">
              <h3>
                <span>{game.title}</span>
                <strong>{game.pct}%</strong>
              </h3>
              <p className="ac-hint">{attemptLabel(game.attempts)}</p>
              <div
                className="ac-track"
                role="meter"
                aria-valuenow={game.pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={game.title}
              >
                <i className={game.pct < 70 ? "is-low" : ""} style={{ width: `${game.pct}%` }} />
              </div>
              {game.skills.map((row) => (
                <div key={row.key} className="ac-skill">
                  <span>{row.label}</span>
                  <strong>{row.pct}%</strong>
                  <div className="ac-track" aria-hidden="true">
                    <i className={row.pct < 70 ? "is-low" : ""} style={{ width: `${row.pct}%` }} />
                  </div>
                  <small>{attemptLabel(row.attempts)}</small>
                  {standardLine(row.key) ? <small className="ac-standard">{standardLine(row.key)}</small> : null}
                </div>
              ))}
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
          <p className="ac-hint">{show("Mastered skills show up after a little practice.")}</p>
        )}
      </section>

      <section className="ac-panel ac-no-print">
        <h2>
          {t(
            `What ${child.name || "your child"} is learning`,
            `Qué está aprendiendo ${child.name || "tu hijo o hija"}`, `O que ${child.name || "seu filho ou sua filha"} está aprendendo`,
          `Ce que ${child.name || "ton fils ou ta fille"} apprend`, `${child.name || "你的孩子"}正在学什么`, `${child.name || "your child"} क्या सीख रहा है`, `ماذا يتعلم ${child.name || "طفلك"}`)}
        </h2>
        {lessons.map((row) => (
          <article key={row.key} className="ac-lesson">
            <h3>{show(row.label)}</h3>
            <p>{row.learning}</p>
            <p className="ac-next">{t("Practice next", "Siguiente práctica")}: {show(row.next)}</p>
          </article>
        ))}
      </section>

      <div className="ac-no-print">
        <InstallTip />
        <BackupPanel save={save} onSave={onSave} />
        <BackLink>{show("Back to games")}</BackLink>
        <Foot />
      </div>
    </div>
  );
}

