import type { Grade } from "../model";
import { show } from "../i18n";
import { cx } from "./bits";

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
          {g === "PK" ? "Pre-K" : g === "K" ? "K" : g}
        </button>
      ))}
    </div>
  );
}
