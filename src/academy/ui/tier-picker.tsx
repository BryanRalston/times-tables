import { useEffect, useState } from "react";
import { TIERS, type Tier } from "../grade-map";
import { show } from "../i18n";
import { cx } from "./bits";

export function tierLabel(tier: Tier): string {
  if (tier === "easy") return show("Easy");
  if (tier === "hard") return show("Hard");
  return show("Medium");
}

/** One, two or three rising bars. Plain shapes, no gloss. */
function TierIcon({ tier }: { tier: Tier }) {
  const lit = tier === "easy" ? 1 : tier === "medium" ? 2 : 3;
  return (
    <svg className="ac-tier-icon" viewBox="0 0 18 14" width="18" height="14" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={i * 6.5} y={10 - i * 4} width="4.5" height={4 + i * 4} rx="1.5" className={i < lit ? "is-lit" : ""} />
      ))}
    </svg>
  );
}

/** Easy, Medium, Hard for one game. Sits in the page flow, never over the game. */
export function TierPicker({ tier, onTier, compact = false }: { tier: Tier; onTier: (tier: Tier) => void; compact?: boolean }) {
  return (
    <div className={cx("ac-tiers", compact && "is-compact")} role="radiogroup" aria-label={show("Difficulty")}>
      {TIERS.map((row) => (
        <button
          key={row}
          type="button"
          role="radio"
          aria-checked={row === tier}
          data-tier={row}
          className={cx("ac-tier", row === tier && "is-on")}
          onClick={() => onTier(row)}
        >
          <TierIcon tier={row} />
          <span>{tierLabel(row)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Phones: one small chip in the top bar shows the current Easy, Medium or Hard.
 * Tapping it opens the same three choices. The pick is saved per game and grade, as with the bar.
 */
export function TierChip({ tier, onTier }: { tier: Tier; onTier: (tier: Tier) => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="ac-tier-chip-wrap">
      <button
        type="button"
        className="ac-tier-chip"
        data-tier={tier}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${show("Difficulty")}: ${tierLabel(tier)}`}
        onClick={() => setOpen((on) => !on)}
      >
        <TierIcon tier={tier} />
        <span>{tierLabel(tier)}</span>
        <svg className="ac-tier-caret" viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <>
          <button type="button" className="ac-tier-scrim" aria-label={show("Close")} onClick={() => setOpen(false)} />
          <div className="ac-tier-pop">
            <TierPicker
              tier={tier}
              onTier={(next) => {
                setOpen(false);
                onTier(next);
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
