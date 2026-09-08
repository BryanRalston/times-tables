import { Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { UNITS } from "@/lib/curriculum";
import {
  GRADE3_PATH_NODES,
  displayUnitStars,
  fogCoverPercent,
  nodeIsFogged,
  pathSprinkles,
  pathSvgD,
  zoneForUnitNumber,
  zoneIsFogged,
  type PathZone,
} from "@/lib/grade-path";
import { parseLocale } from "@/lib/i18n";
import { unitText } from "@/lib/labels";
import { unitStatus, type NodeStatus } from "@/lib/path";
import { unitMaxStars, unitStars, useProgress } from "@/lib/progress";
import { pathHopperId, squisheeSrc } from "@/lib/squishees";
import { cn } from "@/lib/utils";

function zoneLabel(zone: PathZone, ui: ReturnType<typeof useUi>): string {
  switch (zone) {
    case "meadow":
      return ui.zoneMeadow;
    case "cove":
      return ui.zoneCove;
    case "forest":
      return ui.zoneForest;
    default: {
      const _never: never = zone;
      return _never;
    }
  }
}

function openTone(zone: PathZone, n: number): string {
  if (n % 2 === 0) return "candy-node-yellow";
  switch (zone) {
    case "meadow":
      return "candy-node-green";
    case "cove":
      return "candy-node-orange";
    case "forest":
      return "candy-node-lilac";
    default: {
      const _never: never = zone;
      return _never;
    }
  }
}

function nodeTone(status: NodeStatus, zone: PathZone, n: number): string {
  switch (status) {
    case "now":
      return "candy-node-now";
    case "open":
      return openTone(zone, n);
    case "locked":
      return "candy-node-locked";
    default: {
      const _never: never = status;
      return _never;
    }
  }
}

function TenFrameBed({
  filled,
  hue,
  className,
}: {
  filled: number;
  hue: "pink" | "purple" | "gold";
  className: string;
}) {
  return (
    <div className={cn("tf-bed", className)} aria-hidden>
      <div className="tf-grid">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cn("tf-cell", i < filled && `tf-dot tf-dot-${hue}`)} />
        ))}
      </div>
    </div>
  );
}

function PieTree({ slices, className }: { slices: string; className: string }) {
  return (
    <div className={cn("pie-tree", className)} aria-hidden>
      <span className="pie-crown" style={{ background: slices }} />
      <span className="pie-trunk" />
    </div>
  );
}

function Sailboat({ className }: { className: string }) {
  return (
    <div className={cn("sailboat", className)} aria-hidden>
      <span className="sailboat-sail" />
      <span className="sailboat-hull" />
    </div>
  );
}

export function CandyPath({
  suggestedId,
  onStart,
  onOpenUnit,
}: {
  suggestedId: string;
  onStart: () => void;
  onOpenUnit: (id: string) => void;
}) {
  const ui = useUi();
  const locale = parseLocale(useProgress((s) => s.locale));
  const owned = useProgress((s) => s.squishees);
  const hopperId = pathHopperId(owned);
  const trail = pathSvgD();
  const sprinkles = pathSprinkles();
  const prevSuggested = useRef(suggestedId);
  const [travel, setTravel] = useState(false);

  const current = UNITS.find((u) => u.id === suggestedId) ?? UNITS[0]!;
  const currentPos = GRADE3_PATH_NODES[current.number - 1] ?? GRADE3_PATH_NODES[0]!;
  const fogH = fogCoverPercent(current.number);

  useEffect(() => {
    const node = document.querySelector<HTMLElement>("[data-path-status='now']");
    const scroller = node?.closest(".candy-scroll");
    if (node && scroller instanceof HTMLElement) {
      const nr = node.getBoundingClientRect();
      const sr = scroller.getBoundingClientRect();
      scroller.scrollTo({
        top: scroller.scrollTop + (nr.top - sr.top) - sr.height * 0.42,
        behavior: "auto",
      });
    }
    if (prevSuggested.current === suggestedId) return;
    prevSuggested.current = suggestedId;
    setTravel(true);
    const t = window.setTimeout(() => setTravel(false), 780);
    return () => window.clearTimeout(t);
  }, [suggestedId]);

  const activate = (status: NodeStatus, unitId: string) => {
    switch (status) {
      case "now":
        onStart();
        return;
      case "open":
        onOpenUnit(unitId);
        return;
      case "locked":
        return;
      default: {
        const _never: never = status;
        return _never;
      }
    }
  };

  return (
    <div className="candy-map" data-grade-path="1" data-path-tall="1">
      <div className="candy-sky" aria-hidden />
      <div
        className={cn("candy-zone candy-zone-forest", zoneIsFogged("forest", current.number) && "candy-zone-dim")}
        data-path-zone="forest"
        aria-hidden
      />
      <div
        className={cn("candy-zone candy-zone-cove", zoneIsFogged("cove", current.number) && "candy-zone-dim")}
        data-path-zone="cove"
        aria-hidden
      />
      <div
        className={cn("candy-zone candy-zone-meadow", zoneIsFogged("meadow", current.number) && "candy-zone-dim")}
        data-path-zone="meadow"
        aria-hidden
      />

      <div className="candy-land" aria-hidden>
        <span className="candy-flower candy-flower-a" />
        <span className="candy-flower candy-flower-b" />
        <span className="candy-flower candy-flower-c" />
        <span className="candy-flower candy-flower-d" />
        <TenFrameBed filled={10} hue="purple" className="tf-bed-a" />
        <TenFrameBed filled={8} hue="pink" className="tf-bed-b" />
        <TenFrameBed filled={6} hue="gold" className="tf-bed-c" />
        <TenFrameBed filled={9} hue="purple" className="tf-bed-d" />
        <span className="cove-water" />
        <span className="cove-sand" />
        <span className="cove-pier" />
        <span className="cove-piling cove-piling-a" />
        <span className="cove-piling cove-piling-b" />
        <Sailboat className="sailboat-a" />
        <Sailboat className="sailboat-b" />
        <span className="cove-palm" />
        <span className="gold-stack gold-stack-a" />
        <span className="gold-stack gold-stack-b" />
        <span className="gold-stack gold-stack-c" />
        <span className="gold-stack gold-stack-d" />
        <span className="pine pine-a" />
        <span className="pine pine-b" />
        <span className="pine pine-c" />
        <span className="pine pine-d" />
        <PieTree
          className="pie-tree-a"
          slices="conic-gradient(#ff8ec8 0 90deg, #8ee0ff 90deg 180deg, #ffe27a 180deg 270deg, #b8f08a 270deg 360deg)"
        />
        <PieTree className="pie-tree-b" slices="conic-gradient(#c9a6ff 0 180deg, #ffb3d9 180deg 360deg)" />
        <PieTree
          className="pie-tree-c"
          slices="conic-gradient(#7ed0ff 0 45deg, #ffd36a 45deg 90deg, #ff8ec8 90deg 180deg, #9be08a 180deg 270deg, #c9a6ff 270deg 360deg)"
        />
        <PieTree className="pie-tree-d" slices="conic-gradient(#ffb36a 0 120deg, #8ee0ff 120deg 240deg, #ff8ec8 240deg 360deg)" />
      </div>

      <svg className="candy-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <path className="candy-trail-glow" d={trail} />
        <path className="candy-trail-fill" d={trail} />
        <path className="candy-trail-dots" d={trail} />
        {sprinkles.map((s, i) => (
          <circle
            key={i}
            className="candy-sprinkle"
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={`hsl(${s.hue} 78% 64%)`}
          />
        ))}
      </svg>

      <p className={cn("candy-sign candy-sign-meadow", zoneIsFogged("meadow", current.number) && "candy-sign-fog")}>
        {zoneLabel("meadow", ui)}
      </p>
      <p className={cn("candy-sign candy-sign-cove", zoneIsFogged("cove", current.number) && "candy-sign-fog")}>
        {zoneLabel("cove", ui)}
      </p>
      <p className={cn("candy-sign candy-sign-forest", zoneIsFogged("forest", current.number) && "candy-sign-fog")}>
        {zoneLabel("forest", ui)}
      </p>

      {UNITS.map((unit, i) => {
        const pos = GRADE3_PATH_NODES[i]!;
        const status = unitStatus(unit, suggestedId);
        const zone = zoneForUnitNumber(unit.number);
        const stars = displayUnitStars(unitStars(unit.id), unitMaxStars(unit.id));
        const short = unitText(unit, locale).short;
        const fogged = nodeIsFogged(unit.number, current.number);
        const locked = status === "locked" || fogged;
        return (
          <button
            key={unit.id}
            type="button"
            className={cn("candy-node", nodeTone(status, zone, unit.number))}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            data-path-unit={unit.id}
            data-path-status={status}
            data-path-zone={zone}
            data-path-stars={stars}
            data-path-fog={fogged ? "1" : "0"}
            disabled={locked}
            aria-disabled={locked}
            aria-label={`${ui.unitN(unit.number)}. ${short}${status === "now" ? `, ${ui.now}` : ""}${locked ? `, ${ui.pathLocked}` : ""}`}
            onClick={() => activate(status, unit.id)}
          >
            <span className="candy-node-disc">{fogged ? "" : unit.number}</span>
            {fogged || status === "locked" ? (
              <Lock className="candy-lock" aria-hidden />
            ) : (
              <span className="candy-stars" aria-hidden>
                {[0, 1, 2].map((s) => (
                  <span key={s} className="candy-star candy-star-on">
                    ★
                  </span>
                ))}
              </span>
            )}
          </button>
        );
      })}

      <div
        className={cn("candy-hopper", travel && "candy-hopper-travel")}
        style={{ left: `${currentPos.x}%`, top: `${currentPos.y}%` }}
        data-path-hopper={hopperId}
        data-path-travel={travel ? "1" : "0"}
      >
        <MagentaImg src={squisheeSrc(hopperId)} alt="" className="candy-hopper-art" />
      </div>

      {fogH > 0 ? (
        <div className="candy-fog" data-candy-fog="1" style={{ height: `${fogH}%` }} aria-hidden>
          <span className="candy-fog-cloud candy-fog-cloud-a" />
          <span className="candy-fog-cloud candy-fog-cloud-b" />
          <span className="candy-fog-cloud candy-fog-cloud-c" />
        </div>
      ) : null}
      {fogH > 0 ? <p className="sr-only">{ui.pathFogAhead}</p> : null}
    </div>
  );
}
