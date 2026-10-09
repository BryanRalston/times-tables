import { COIN_CENTS, type CoinKind, type CoinPile } from "../games/money-model";
import { cx } from "./bits";

const LOOK: Record<Exclude<CoinKind, "dollar">, { r: number; fill: string; edge: string; mark: string }> = {
  penny: { r: 18, fill: "#e39a6a", edge: "#a85b32", mark: "1" },
  nickel: { r: 22, fill: "#d7e0e8", edge: "#7e93a4", mark: "5" },
  dime: { r: 14, fill: "#f4f7fb", edge: "#8ea6b8", mark: "10" },
  quarter: { r: 26, fill: "#eef3f8", edge: "#6e8496", mark: "25" },
};

function CoinFace({ kind }: { kind: CoinKind }) {
  if (kind === "dollar") {
    return (
      <svg className="ac-coin is-dollar" viewBox="0 0 86 48" data-cents={COIN_CENTS.dollar} aria-hidden="true">
        <rect x="2" y="2" width="82" height="44" rx="8" fill="#c8f0d4" stroke="#217a45" strokeWidth="3" />
        <rect x="8" y="8" width="70" height="32" rx="4" fill="none" stroke="#7dcaa0" strokeWidth="2" />
        <text x="43" y="31" textAnchor="middle">
          $1
        </text>
      </svg>
    );
  }
  const look = LOOK[kind];
  return (
    <svg className={cx("ac-coin", `is-${kind}`)} viewBox="0 0 64 64" data-cents={COIN_CENTS[kind]} aria-hidden="true">
      <circle cx="32" cy="32" r={look.r} fill={look.fill} stroke={look.edge} strokeWidth="3" />
      {kind === "quarter" ? (
        <circle cx="32" cy="32" r={look.r - 4} fill="none" stroke={look.edge} strokeWidth="1.5" strokeDasharray="2 2" />
      ) : null}
      <text x="32" y="37" textAnchor="middle">
        {look.mark}
      </text>
    </svg>
  );
}

const ORDER: CoinKind[] = ["dollar", "quarter", "dime", "nickel", "penny"];

export function CoinRow({ pile, large, label }: { pile: CoinPile; large?: boolean; label?: string }) {
  const faces: CoinKind[] = [];
  for (const kind of ORDER) {
    for (let i = 0; i < pile[kind]; i++) faces.push(kind);
  }
  return (
    <span className={cx("ac-coin-row", large && "is-lg")} role="img" aria-label={label ?? "coins"}>
      {faces.map((kind, i) => (
        <CoinFace key={`${kind}-${i}`} kind={kind} />
      ))}
    </span>
  );
}
