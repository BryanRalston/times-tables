import type { BalanceBoard } from "./boards";
import { equationText, leftText } from "./balance-data";
import { mathText } from "./grade5";
import scaleBeam from "../art/scale/beam.webp";
import scaleCap from "../art/scale/cap.webp";
import scalePan from "../art/scale/pan.webp";
import scaleStand from "../art/scale/stand.webp";

export type ScaleTilt = "left" | "level" | "right" | "ask";

/** After a pick, a too-big x makes the left pan drop; a too-small x lifts it. */
export function scaleTilt(board: BalanceBoard, reveal: boolean, picked: string | null): ScaleTilt {
  if (!reveal || picked == null || picked === String(board.x)) return reveal ? "level" : "ask";
  const n = Number(picked);
  if (!Number.isFinite(n)) return "right";
  return n > board.x ? "left" : "right";
}

function beamRotate(tilt: ScaleTilt): number {
  if (tilt === "level") return 0;
  if (tilt === "left") return -8;
  if (tilt === "ask") return 4;
  return 8;
}

/**
 * Imagine-painted squishee-style scale, in pieces so the beam can tip
 * while the pans stay upright and keep their labels readable.
 */
export function BalanceScale({
  board,
  tilt,
}: {
  board: BalanceBoard;
  tilt: ScaleTilt;
}) {
  const angle = beamRotate(tilt);
  const left = mathText(leftText(board));
  const right = mathText(String(board.q));
  const label = mathText(equationText(board));
  const tiltStyle = { ["--tilt" as string]: `${angle}deg` };
  return (
    <div className={`ac-scale is-${tilt}`} dir="ltr" data-tilt={tilt} aria-label={label} style={tiltStyle}>
      <img className="ac-scale-stand" src={scaleStand} alt="" draggable={false} />
      <div className="ac-scale-beam">
        <img className="ac-scale-beam-art" src={scaleBeam} alt="" draggable={false} />
        <div className="ac-scale-pan is-left">
          <img className="ac-scale-pan-art" src={scalePan} alt="" draggable={false} />
          <span className="ac-scale-val">{left}</span>
        </div>
        <div className="ac-scale-pan is-right">
          <img className="ac-scale-pan-art" src={scalePan} alt="" draggable={false} />
          <span className="ac-scale-val">{right}</span>
        </div>
      </div>
      <img className="ac-scale-cap" src={scaleCap} alt="" draggable={false} />
    </div>
  );
}

export function BalanceEquation({ board }: { board: BalanceBoard }) {
  return (
    <p className="ac-scale-eq" dir="ltr" data-equation="yes">
      {mathText(equationText(board))}
    </p>
  );
}
