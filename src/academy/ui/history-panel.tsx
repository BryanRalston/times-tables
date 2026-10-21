import { useEffect, useState } from "react";
import { skillHistoryReport } from "../history-report";
import { show } from "../i18n";
import type { Child } from "../model";

export function HistoryPanel({
  child,
}: {
  child: Pick<Child, "skills" | "secondsByDay" | "history" | "roundsByMonth" | "foldedMonth">;
}) {
  const report = skillHistoryReport(child);
  return (
    <section className="ac-panel ac-report ac-history" data-history={report.months.length}>
      <h2>{show("Month by month")}</h2>
      {report.foldedNote ? <p className="ac-hint">{report.foldedNote}</p> : null}
      {report.months.length === 0 ? (
        <p className="ac-hint">{show("Play a few rounds and the months fill in.")}</p>
      ) : (
        report.months.map((month) => (
          <article key={month.key} className="ac-month" data-month={month.key}>
            <h3>
              <span>{month.title}</span>
              {month.summary ? <small>{month.summary}</small> : null}
            </h3>
            {month.emptyNote ? <p className="ac-hint">{month.emptyNote}</p> : null}
            {month.skills.map((skill) => (
              <div key={skill.key} className="ac-skill" data-skill={skill.key}>
                <span>{skill.label}</span>
                <strong>{skill.pct}%</strong>
                <div
                  className="ac-track"
                  role="meter"
                  aria-valuenow={skill.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={skill.label}
                >
                  <i className={skill.pct < 70 ? "is-low" : ""} style={{ width: `${skill.pct}%` }} />
                </div>
                <small>{skill.line}</small>
                {skill.standardLabel ? <small className="ac-standard">{skill.standardLabel}</small> : null}
              </div>
            ))}
            {month.moreNote ? <p className="ac-hint">{month.moreNote}</p> : null}
          </article>
        ))
      )}
      <div className="ac-report-actions ac-no-print">
        <button type="button" onClick={() => window.print()}>
          {show("Print the report")}
        </button>
      </div>
    </section>
  );
}

/** Hide the month history for a moment so "Print this week" stays the week. */
export function useWeekPrint(): { weekPrint: boolean; printWeek: () => void } {
  const [weekPrint, setWeekPrint] = useState(false);

  useEffect(() => {
    if (!weekPrint) return;
    const timer = window.setTimeout(() => window.print(), 40);
    const done = () => setWeekPrint(false);
    window.addEventListener("afterprint", done);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", done);
    };
  }, [weekPrint]);

  return { weekPrint, printWeek: () => setWeekPrint(true) };
}
