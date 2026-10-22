import type { Grade } from "../model";
import { getLocale, gradeText, show } from "../i18n";
import { cx } from "./bits";

function chipLabel(grade: Grade): string {
  if (getLocale() === "hi") return gradeText(grade);
  if (grade === "PK") return "Pre-K";
  if (grade === "K") return "K";
  return grade;
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
  const grades: Grade[] = ["PK", "K", "1", "2", "3", "4"];
  return (
    <div className={cx("ac-grades", className)} role="group" aria-label={show("Grade")}>
      {grades.map((g) => (
        <button key={g} type="button" className={cx("ac-grade", grade === g && "is-on")} onClick={() => onGrade(g)}>
          {chipLabel(g)}
        </button>
      ))}
    </div>
  );
}
