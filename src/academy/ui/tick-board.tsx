import { useState } from "react";
import { show, t } from "../i18n";
import { ticksMatch, type TickTask } from "../games/ticks-data";
import { HandsShell } from "./hands-kit";

export function TickLine({ whole, den, mark }: { whole: 1 | 2; den: number; mark: number }) {
  const parts = Math.max(1, den * whole);
  const aria =
    whole === 1
      ? t("Number line from 0 to 1", "Recta numérica del 0 al 1")
      : t(
          `Number line from 0 to ${whole}`,
          `Recta numérica del 0 al ${whole}`,
          `Reta numérica de 0 a ${whole}`,
          `Droite numérique de 0 à ${whole}`,
          `从0到${whole}的数轴`,
          `0 से ${whole} तक संख्या रेखा`,
          `خط أعداد من 0 إلى ${whole}`,
        );
  return (
    <svg className="ac-line" viewBox="0 0 320 80" role="img" aria-label={aria}>
      <line x1="20" y1="36" x2="300" y2="36" className="ac-line-base" />
      {Array.from({ length: parts + 1 }, (_, i) => {
        const x = 20 + (280 * i) / parts;
        const text = i === 0 ? "0" : i === den ? "1" : i === parts && whole === 2 ? "2" : "";
        return (
          <g key={i}>
            <line x1={x} y1="28" x2={x} y2="44" className="ac-line-tick" />
            {text ? (
              <text x={x} y="66" textAnchor="middle">
                {text}
              </text>
            ) : null}
            {i === mark ? <circle cx={x} cy="36" r="7" className="ac-line-dot" /> : null}
          </g>
        );
      })}
    </svg>
  );
}

export function TickHands({ task, onAnswer }: { task: TickTask; onAnswer: (ok: boolean) => void }) {
  const parts = task.den * task.whole;
  const [index, setIndex] = useState(0);
  return (
    <HandsShell kind="ticks" fact={task.factKey} caption={task.speech.replace(/^।\s*/, "")} onDone={() => onAnswer(ticksMatch(task, index))}>
      <div className="ac-jump-play">
        <TickLine whole={task.whole} den={task.den} mark={index} />
        <div className="ac-num-tiles" dir="ltr">
          <button type="button" className="ac-stone" onClick={() => setIndex((n) => Math.max(0, n - 1))}>
            −
          </button>
          <button type="button" className="ac-stone" onClick={() => setIndex((n) => Math.min(parts, n + 1))}>
            +
          </button>
          <button type="button" className="ac-stone" onClick={() => setIndex(0)}>
            {show("Start over")}
          </button>
        </div>
      </div>
    </HandsShell>
  );
}
