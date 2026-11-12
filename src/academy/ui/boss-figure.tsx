import type { CSSProperties } from "react";
import { squisheeById } from "@/lib/squishees";
import { lookForCosmetic, type BossLook } from "../bosses";
import { headFit } from "../head-fit";
import { squisheeUrl } from "../paths";
import { AcademyPal, cx } from "./bits";
import { Squishy } from "./squishy";
import arenaScene from "../art/boss/arena.webp";
import summitScene from "../art/boss/summit.webp";
import clockHat from "../art/boss/hats/clock.webp";
import crownHat from "../art/boss/hats/crown.webp";
import helmHat from "../art/boss/hats/helm.webp";
import scholarHat from "../art/boss/hats/scholar.webp";
import wizardHat from "../art/boss/hats/wizard.webp";

export type BossMood = "arrive" | "idle" | "hit" | "dizzy" | "raspberry" | "friendly";

/** Painted backdrop behind every boss. Grade 5 Summit gets the mountain peak. */
export function bossSceneUrl(gameId?: string): string {
  return gameId === "summit" ? summitScene : arenaScene;
}

export type BossHat = "wizard" | "scholar" | "crown" | "helm" | "clock";

const HAT_ART: Record<BossHat, string> = {
  wizard: wizardHat,
  scholar: scholarHat,
  crown: crownHat,
  helm: helmHat,
  clock: clockHat,
};

/** Painted hat for a boss look. Professor Quill (Grade 5 Summit) wears the scholar cap. */
export function bossHat(look: BossLook, gameId?: string): BossHat {
  if (gameId === "summit") return "scholar";
  switch (look) {
    case "spell":
      return "wizard";
    case "crown":
    case "coins":
    case "cape":
      return "crown";
    case "armor":
      return "helm";
    case "clock":
      return "clock";
    default: {
      const neverLook: never = look;
      return neverLook;
    }
  }
}

/**
 * How each hat is worn, measured from the hat art's alpha:
 * base = width of the band or brim that touches the head (fraction of the hat image),
 * cx = that band's center, fit = band width over head width (a little past edge to edge),
 * cover = how much of the head's height the hat wraps down over.
 */
const HAT_FIT: Record<BossHat, { base: number; cx: number; fit: number; cover: number }> = {
  wizard: { base: 0.95, cx: 0.5, fit: 1.3, cover: 0.18 },
  scholar: { base: 0.62, cx: 0.5, fit: 1.12, cover: 0.22 },
  crown: { base: 0.87, cx: 0.5, fit: 1.05, cover: 0.2 },
  helm: { base: 0.98, cx: 0.5, fit: 1.05, cover: 0.25 },
  clock: { base: 0.92, cx: 0.5, fit: 1.3, cover: 0.18 },
};

/** Eyes this close to the head top (frog) get the hat tucked behind them. */
const EYES_ON_TOP = 0.06;
/** Space kept between the brim and the eye line, as a fraction of the art. */
const EYE_CLEARANCE = 0.015;

export interface HatSeat {
  style: CSSProperties;
  /** Drawn behind the face so eye bumps sit in front of the hat. */
  behind: boolean;
}

/**
 * Wear a hat on one squishee's head, as a box inside its square art. The hat
 * wraps down over the top of the head to just above the eyes, and is scaled to
 * the head width. Eyes at the very top (frog) get the hat tucked behind them.
 */
export function hatSeat(faceId: string, hat: BossHat): HatSeat {
  const head = headFit(faceId);
  const fit = HAT_FIT[hat];
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
  const width = Math.min(0.75, (head.w * fit.fit) / fit.base);
  const left = pct(head.cx - width * fit.cx);
  const eye = head.eye;
  if (eye !== null && eye - head.top < EYES_ON_TOP) {
    return { style: { left, top: pct(eye + 0.05), width: pct(width) }, behind: true };
  }
  // Eyes sit near the middle of the head, so the head is about twice as tall as top-to-eye.
  const headHeight = eye !== null ? 2.2 * (eye - head.top) : 0.8 * head.w;
  let seat = head.top + fit.cover * headHeight;
  if (eye !== null) seat = Math.min(seat, eye - EYE_CLEARANCE);
  return { style: { left, top: pct(seat), width: pct(width) }, behind: false };
}

function hatForCosmetic(cosmeticId: string, look: BossLook): BossHat {
  return cosmeticId === "summit-cape" ? "scholar" : bossHat(look);
}

/** Small extras that are not the hat: Sir Coinsworth's coins and the cape clasp. */
function Gear({ look, gold }: { look: BossLook; gold: boolean }) {
  const metal = gold ? "#ffe08a" : "#f0b429";
  switch (look) {
    case "coins":
      return (
        <>
          <circle cx="46" cy="150" r="16" fill="#ffe08a" stroke="#c98412" strokeWidth="4" />
          <circle cx="154" cy="150" r="16" fill="#ffe08a" stroke="#c98412" strokeWidth="4" />
          <text x="46" y="155" textAnchor="middle" fontSize="14" fill="#c98412">
            $
          </text>
          <text x="154" y="155" textAnchor="middle" fontSize="14" fill="#c98412">
            $
          </text>
        </>
      );
    case "cape":
      return (
        <>
          <path d="M86 168h28l-4 22h-20Z" fill="#fff" />
          <circle cx="100" cy="176" r="6" fill={metal} />
        </>
      );
    case "crown":
    case "armor":
    case "clock":
    case "spell":
      return null;
    default: {
      const neverLook: never = look;
      return neverLook;
    }
  }
}

function Sparkles() {
  return (
    <span className="ac-sparkles" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export function BossFigure({
  face,
  look,
  mood = "idle",
  crown = false,
  name,
  size = "fight",
  gameId,
}: {
  face: string;
  look: BossLook;
  mood?: BossMood;
  crown?: boolean;
  name?: string;
  size?: "fight" | "hero";
  /** Picks the painted scene; Summit gets the mountain. */
  gameId?: string;
}) {
  const s = squisheeById(face);
  const src = squisheeUrl(s?.file ?? "peach.png");
  const hat = bossHat(look, gameId);
  const seat = hatSeat(face, hat);
  return (
    <div className={cx("ac-boss", `is-${look}`, `is-${mood}`, `is-${size}`, crown && "is-gold")} data-mood={mood} data-look={look}>
      <img className="ac-boss-scene" src={bossSceneUrl(gameId)} alt="" aria-hidden="true" draggable={false} width={560} height={560} />
      <span className={cx("ac-boss-head", seat.behind && "is-behind")} aria-hidden="true">
        <img className={cx("ac-boss-hat", `is-${hat}`)} src={HAT_ART[hat]} alt="" draggable={false} style={seat.style} />
      </span>
      <Squishy id={face} className="ac-boss-face">
        <img src={src} alt={name ?? ""} draggable={false} />
      </Squishy>

      {look === "coins" || look === "cape" ? (
        <svg className="ac-boss-gear" viewBox="0 0 200 240" aria-hidden="true">
          <Gear look={look} gold={crown || mood === "friendly"} />
        </svg>
      ) : null}
      {mood === "raspberry" ? <span className="ac-razz">pbbbt!</span> : null}
      {mood === "hit" || mood === "dizzy" ? <Sparkles /> : null}
      {mood === "friendly" ? (
        <span className="ac-hearts" aria-hidden="true">
          ♥
        </span>
      ) : null}
    </div>
  );
}

/**
 * The boss hat on a pal wearing a boss look. On a plain pal it sits on the head,
 * measured per squishee; when the pal already wears an outfit it moves to the corner.
 */
export function LookBadge({
  look,
  cosmeticId = "",
  faceId,
  place = "corner",
  fitClass,
}: {
  look: BossLook;
  cosmeticId?: string;
  faceId?: string;
  place?: "corner" | "head";
  fitClass?: string;
}) {
  const hat = hatForCosmetic(cosmeticId, look);
  if (place === "head" && faceId) {
    const seat = hatSeat(faceId, hat);
    return (
      <span className={cx("ac-pal-head", fitClass, seat.behind && "is-behind")} aria-hidden="true">
        <img className={cx("ac-look-hat", `is-${hat}`)} src={HAT_ART[hat]} alt="" draggable={false} style={seat.style} />
      </span>
    );
  }
  return <img className={cx("ac-look-badge", `is-${hat}`)} src={HAT_ART[hat]} alt="" aria-hidden="true" draggable={false} />;
}

export function PalWithLook({
  id,
  cosmetic,
  lookId,
  className,
  label,
}: {
  id: string;
  cosmetic?: string;
  lookId?: string;
  className?: string;
  label?: string;
}) {
  const look = lookId ? lookForCosmetic(lookId) : null;
  return (
    <span className="ac-pal-look">
      <AcademyPal id={id} cosmetic={cosmetic} className={className} label={label} />
      {look ? (
        <LookBadge
          look={look}
          cosmeticId={lookId}
          faceId={id}
          place={cosmetic ? "corner" : "head"}
          fitClass={className?.split(" ")[0] ? `for-${className.split(" ")[0]}` : undefined}
        />
      ) : null}
    </span>
  );
}
