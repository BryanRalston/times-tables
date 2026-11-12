import { t } from "../i18n";
import { cx } from "../ui/bits";
import type { AddBoard, ShareBoard, TimesBoard } from "./boards";
import { decimalThink, hundredthsText, hundredthsWord, placeParts, tenthsWord } from "./grade5-ops";
import { AreaModel } from "./scene-ui";
import { MINUS, TIMES } from "./types";

/**
 * Grade 5 slice 3 pictures. Plain, calm boards: an area model of partial
 * products, a division area model, and a place-value column chart. Math stays
 * left to right in every language. Nothing here sits on top of the squishee.
 */

/** Area model: one column per place part of `a`, one row per place part of `b`. Each cell is a partial product. */
export function BigMultiArt({ board, reveal }: { board: TimesBoard; reveal: boolean }) {
  const cols = placeParts(board.a);
  const rows = placeParts(board.b);
  return (
    <div className="ac-g5-area" dir="ltr" aria-hidden="true" style={{ gridTemplateColumns: `auto repeat(${cols.length}, 1fr)` }}>
      <span className="ac-g5-corner">{TIMES}</span>
      {cols.map((col) => (
        <span key={`c${col}`} className="ac-g5-head">
          {col}
        </span>
      ))}
      {rows.map((row) => [
        <span key={`r${row}`} className="ac-g5-head is-row">
          {row}
        </span>,
        ...cols.map((col, i) => (
          <span key={`${row}-${col}`} className={cx("ac-g5-cell", i % 2 === 0 ? "is-a" : "is-b", reveal && "is-shown")}>
            {reveal ? row * col : `${col} ${TIMES} ${row}`}
          </span>
        )),
      ])}
    </div>
  );
}

/** Division as a missing side: area `total`, one side `plates`. Each block is divisor × a place chunk of the quotient. */
export function LongDivArt({ board, reveal }: { board: ShareBoard; reveal: boolean }) {
  const d = board.plates;
  const parts = placeParts(board.each);
  const pieces = [...parts.map((part) => part * d), ...(board.leftover > 0 ? [board.leftover] : [])];
  return (
    <div className="ac-g5-div" dir="ltr" aria-hidden="true">
      <p className="ac-g5-div-total">
        <b>{board.total}</b>
        <span>÷</span>
        <b>{d}</b>
      </p>
      <div className="ac-g5-div-row">
        <span className="ac-g5-div-side">{d}</span>
        <div className="ac-g5-div-blocks">
          {parts.map((part, i) => (
            <span key={part} className={cx("ac-g5-div-block", i === 0 ? "is-a" : "is-b")} style={{ flexGrow: Math.max(part, 3) }}>
              <small>
                {d} {TIMES} {reveal ? part : "?"}
              </small>
              <b>{reveal ? part * d : "?"}</b>
            </span>
          ))}
          {board.leftover > 0 ? (
            <span className="ac-g5-div-block is-left">
              <small>{t("left", "sobran", "sobram", "reste", "余", "शेष", "الباقي")}</small>
              <b>{reveal ? board.leftover : "?"}</b>
            </span>
          ) : null}
        </div>
      </div>
      {reveal ? <p className="ac-g5-div-sum">{`${pieces.join(" + ")} = ${board.total}`}</p> : null}
    </div>
  );
}

function digitsOf(h: number, tensCol: boolean): string[] {
  const whole = Math.floor(h / 100);
  const frac = h % 100;
  const tens = Math.floor(whole / 10);
  const ones = whole % 10;
  return [tensCol ? (tens > 0 ? String(tens) : "") : "", String(ones), String(Math.floor(frac / 10)), String(frac % 10)];
}

/** Place-value columns for + and −: the points line up in one column. */
function DecimalColumns({ board, reveal }: { board: AddBoard; reveal: boolean }) {
  const tensCol = Math.max(board.left, board.right, board.result) >= 1000;
  const heads = [
    tensCol ? t("tens", "decenas", "dezenas", "dizaines", "十位", "दहाई", "عشرات") : "",
    t("ones", "unidades", "unidades", "unités", "个位", "इकाई", "آحاد"),
    t("tenths", "décimos", "décimos", "dixièmes", "十分位", "दशांश", "أعشار"),
    t("hundredths", "centésimos", "centésimos", "centièmes", "百分位", "शतांश", "من المئة"),
  ];
  const rows: { sign: string; cells: string[]; answer?: boolean }[] = [
    { sign: "", cells: digitsOf(board.left, tensCol) },
    { sign: board.op === "+" ? "+" : MINUS, cells: digitsOf(board.right, tensCol) },
    { sign: "=", cells: reveal ? digitsOf(board.result, tensCol) : ["", "?", "?", "?"].map((c, i) => (i === 0 && tensCol ? "?" : c)), answer: true },
  ];
  const cols = tensCol ? [0, 1, 2, 3] : [1, 2, 3];
  return (
    <div className="ac-g5-cols" dir="ltr" aria-hidden="true" style={{ gridTemplateColumns: `28px repeat(${cols.length}, 1fr)` }}>
      <span />
      {cols.map((c) => (
        <span key={`h${c}`} className={cx("ac-g5-cols-head", c === 2 && "has-point")}>
          {heads[c]}
        </span>
      ))}
      {rows.map((row, r) => [
        <span key={`s${r}`} className="ac-g5-cols-sign">
          {row.sign}
        </span>,
        ...cols.map((c) => (
          <span key={`${r}-${c}`} className={cx("ac-g5-cols-digit", c === 2 && "has-point", row.answer && "is-answer", row.answer && reveal && "is-shown")}>
            {row.cells[c] || "\u00a0"}
          </span>
        )),
      ])}
    </div>
  );
}

/** × and ÷: count in tenths or hundredths, do the whole-number fact, then put the point back. */
function DecimalThink({ board, reveal }: { board: AddBoard; reveal: boolean }) {
  const think = decimalThink(board);
  const word = board.unit === 10 ? tenthsWord() : hundredthsWord();
  const sign = board.op === "÷" ? "÷" : TIMES;
  const tenthsGrid = board.op === "×" && board.right % 100 !== 0 && board.left < 100 && board.right < 100;
  return (
    <div className="ac-g5-think" dir="ltr" aria-hidden="true">
      {tenthsGrid ? <AreaModel num={board.left / 10} den={10} num2={board.right / 10} den2={10} /> : null}
      <p className="ac-g5-think-word">{t(`Think in ${word}`, `Piensa en ${word}`, `Pense em ${word}`, `Pense en ${word}`, `想成${word}`, `${word} में सोचो`, `فكّر بـ${word}`)}</p>
      <p className="ac-g5-think-line">
        <span>{think.left}</span>
        <span className="ac-op">{sign}</span>
        <span>{think.right}</span>
        <span className="ac-op">=</span>
        <span className={cx("ac-blank", reveal && "is-shown")}>{reveal ? think.result : "?"}</span>
      </p>
      {reveal ? <p className="ac-g5-think-back">{hundredthsText(board.result)}</p> : null}
    </div>
  );
}

export function DecimalOpsArt({ board, reveal }: { board: AddBoard; reveal: boolean }) {
  if (board.op === "+" || board.op === "-") return <DecimalColumns board={board} reveal={reveal} />;
  return <DecimalThink board={board} reveal={reveal} />;
}
