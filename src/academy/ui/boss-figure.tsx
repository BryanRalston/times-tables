import { squisheeById } from "@/lib/squishees";
import { lookForCosmetic, type BossLook } from "../bosses";
import { squisheeUrl } from "../paths";
import { AcademyPal, cx } from "./bits";

export type BossMood = "arrive" | "idle" | "hit" | "dizzy" | "raspberry" | "friendly";

function capeFill(look: BossLook): string {
  switch (look) {
    case "crown":
      return "#ff7eb3";
    case "cape":
      return "#b48cff";
    case "armor":
      return "#7ad7c8";
    case "clock":
      return "#f0b429";
    case "coins":
      return "#ffd56a";
    case "spell":
      return "#c9b6ff";
    default: {
      const neverLook: never = look;
      return neverLook;
    }
  }
}

function Cape({ look }: { look: BossLook }) {
  const fill = capeFill(look);
  return (
    <>
      <path d="M78 78c-28 8-52 48-58 92 22-10 40-8 58 4 10-28 14-62 0-96Z" fill={fill} />
      <path d="M122 78c28 8 52 48 58 92-22-10-40-8-58 4-10-28-14-62 0-96Z" fill={fill} />
      <path d="M70 92h60l8 78H62Z" fill={fill} opacity="0.9" />
      <path d="M100 96c8 18 8 36 0 70 8-34 16-52 28-70H72c12 18 20 36 28 70Z" fill="#fff" opacity="0.35" />
    </>
  );
}

function Gear({ look, gold }: { look: BossLook; gold: boolean }) {
  const metal = gold ? "#ffe08a" : "#f0b429";
  switch (look) {
    case "crown":
    case "coins":
      return (
        <>
          <Crown metal={metal} />
          {look === "coins" ? (
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
          ) : null}
        </>
      );
    case "cape":
      return (
        <>
          <Crown metal={metal} />
          <path d="M86 168h28l-4 22h-20Z" fill="#fff" />
          <circle cx="100" cy="176" r="6" fill={metal} />
        </>
      );
    case "armor":
      return (
        <>
          <path d="M62 118h22l8 16H70Z" fill="#fff6ea" stroke="#3c2448" strokeWidth="4" />
          <path d="M138 118h-22l-8 16h22Z" fill="#fff6ea" stroke="#3c2448" strokeWidth="4" />
          <path d="M78 70h44l8 18H70Z" fill="#ff8fbe" stroke="#3c2448" strokeWidth="4" />
          <circle cx="100" cy="78" r="6" fill={metal} />
        </>
      );
    case "clock":
      return (
        <>
          <circle cx="100" cy="62" r="22" fill="#fffdfb" stroke="#3c2448" strokeWidth="4" />
          <circle cx="100" cy="62" r="3" fill="#3c2448" />
          <path d="M100 62V48" stroke="#3c2448" strokeWidth="3" strokeLinecap="round" />
          <path d="M100 62l10 6" stroke="#e4377e" strokeWidth="3" strokeLinecap="round" />
          <path d="M70 48h60" stroke="#3c2448" strokeWidth="6" strokeLinecap="round" />
        </>
      );
    case "spell":
      return (
        <>
          <path d="M78 78l22-28 22 28H78Z" fill="#7c6cff" stroke="#3c2448" strokeWidth="4" />
          <path d="M100 36l3 8 8 2-8 3-3 8-3-8-8-3 8-2Z" fill="#ffe08a" />
          <path d="M64 150l8 6 2 8-8-4-8 2 2-8Z" fill="#fff" />
          <path d="M140 146l6 5 2 7-6-3-6 2 1-7Z" fill="#fff" />
        </>
      );
    default: {
      const neverLook: never = look;
      return neverLook;
    }
  }
}

function Crown({ metal }: { metal: string }) {
  return (
    <path
      d="M68 86l10-22 10 14 12-20 12 20 10-14 10 22H68Z"
      fill={metal}
      stroke="#3c2448"
      strokeWidth="4"
      strokeLinejoin="round"
    />
  );
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
}: {
  face: string;
  look: BossLook;
  mood?: BossMood;
  crown?: boolean;
  name?: string;
  size?: "fight" | "hero";
}) {
  const s = squisheeById(face);
  const src = squisheeUrl(s?.file ?? "peach.png");
  return (
    <div className={cx("ac-boss", `is-${look}`, `is-${mood}`, `is-${size}`, crown && "is-gold")} data-mood={mood} data-look={look}>
      <svg className="ac-boss-cape" viewBox="0 0 200 240" aria-hidden="true">
        <Cape look={look} />
      </svg>
      <img className="ac-boss-face" src={src} alt={name ?? ""} draggable={false} />
      <svg className="ac-boss-gear" viewBox="0 0 200 240" aria-hidden="true">
        <Gear look={look} gold={crown || mood === "friendly"} />
      </svg>
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

function MiniLook({ look }: { look: BossLook }) {
  switch (look) {
    case "clock":
      return (
        <>
          <circle cx="32" cy="18" r="12" fill="#fffdfb" stroke="#3c2448" strokeWidth="3" />
          <path d="M32 18V10M32 18l7 4" stroke="#3c2448" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "armor":
      return <path d="M14 16h36l6 14H8Z" fill="#ff8fbe" stroke="#3c2448" strokeWidth="3" strokeLinejoin="round" />;
    case "spell":
      return <path d="M32 2l4 10h10l-8 6 3 11-9-6-9 6 3-11-8-6h10Z" fill="#ffe08a" stroke="#3c2448" strokeWidth="2" />;
    case "cape":
    case "crown":
    case "coins":
      return <path d="M8 30l8-16 7 10 9-16 9 16 7-10 8 16Z" fill="#f0b429" stroke="#3c2448" strokeWidth="2" strokeLinejoin="round" />;
    default: {
      const neverLook: never = look;
      return neverLook;
    }
  }
}

export function LookBadge({ look }: { look: BossLook }) {
  return (
    <svg className="ac-look-badge" viewBox="0 0 64 36" aria-hidden="true">
      <MiniLook look={look} />
    </svg>
  );
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
      {look ? <LookBadge look={look} /> : null}
    </span>
  );
}
