import { t } from "../i18n";
import type { FractionBoard, PatternBoard, VariableBoard } from "./boards";
import { fractionText, powerProduct, powerText } from "./grade6";
import { FractionBar } from "./scene-ui";

function ExprLine({ text }: { text: string }) {
  return (
    <p className="ac-big-num ac-g6-expr" dir="ltr">
      {text}
    </p>
  );
}

export function ExprEvalArt({ board }: { board: VariableBoard }) {
  // The question already names the expression on a match card, so do not repeat it.
  if (board.ask === "match") return null;
  return (
    <div className="ac-g6-eval">
      <ExprLine text={board.expr ?? ""} />
      {board.letter && board.a > 0 ? (
        <p className="ac-g6-when" dir="ltr">
          {board.letter} = {board.a}
        </p>
      ) : null}
    </div>
  );
}

export function ExponentsArt({ board }: { board: VariableBoard }) {
  const expr = board.expr ?? "";
  const [base, exp] = expr.split("^").map(Number);
  const safeBase = Number.isFinite(base) ? base : 2;
  const safeExp = Number.isFinite(exp) && exp > 0 ? exp : 2;
  return (
    <div className="ac-g6-exp">
      <p className="ac-big-num ac-g6-expr" dir="ltr">
        {safeBase}
        <sup>{safeExp}</sup>
      </p>
      <p className="ac-g6-when" dir="ltr">
        {powerProduct(safeBase, safeExp)}
      </p>
    </div>
  );
}

export function FracDivArt({ board }: { board: Extract<FractionBoard, { mode: "fracDiv" }> }) {
  const pieces = board.den === 1 ? board.num * board.den2 : (board.num * board.den2) / board.den;
  const total = board.den === 1 ? board.num * board.den2 : board.den2;
  const showFine = Number.isInteger(pieces) && Number.isInteger(total) && total >= pieces && total <= 16;
  return (
    <div className="ac-g6-div">
      <div className="ac-g6-div-row">
        {board.den === 1
          ? Array.from({ length: board.num }, (_, i) => <FractionBar key={i} num={1} den={1} />)
          : <FractionBar num={board.num} den={board.den} />}
        <p className="ac-frac-name">{fractionText(board.num, board.den)}</p>
      </div>
      {showFine ? (
        <div className="ac-g6-div-row">
          <FractionBar num={pieces} den={total} />
          <p className="ac-frac-name">
            {t(
              `${pieces} of ${fractionText(board.num2, board.den2)}`,
              `${pieces} de ${fractionText(board.num2, board.den2)}`,
              `${pieces} de ${fractionText(board.num2, board.den2)}`,
              `${pieces} de ${fractionText(board.num2, board.den2)}`,
              `${pieces} 个 ${fractionText(board.num2, board.den2)}`,
              `${pieces} ${fractionText(board.num2, board.den2)}`,
              `${pieces} من ${fractionText(board.num2, board.den2)}`,
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function GcfLcmArt({ board }: { board: PatternBoard }) {
  const fact = board.factor;
  if (!fact) return null;
  const word =
    fact.kind === "gcf"
      ? t("Greatest common factor", "Máximo común divisor", "Máximo divisor comum", "Plus grand commun diviseur", "最大公因数", "महत्तम समापवर्तक", "العامل المشترك الأكبر")
      : t("Least common multiple", "Mínimo común múltiplo", "Mínimo múltiplo comum", "Plus petit commun multiple", "最小公倍数", "लघुत्तम समापवर्त्य", "المضاعف المشترك الأصغر");
  return (
    <div className="ac-g6-factor">
      <p className="ac-g6-factor-word">{word}</p>
      <p className="ac-big-num ac-g6-expr" dir="ltr">
        {fact.a}
        <span className="ac-g6-and"> & </span>
        {fact.b}
      </p>
    </div>
  );
}

export function powerLabel(expr: string): string {
  const [base, exp] = expr.split("^").map(Number);
  if (!Number.isFinite(base) || !Number.isFinite(exp)) return expr;
  return powerText(base, exp);
}
