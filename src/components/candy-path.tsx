import { Lock } from "lucide-react";
import { useEffect } from "react";
import { useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { UNITS } from "@/lib/curriculum";
import {
  GRADE3_PATH_NODES,
  displayUnitStars,
  pathSvgD,
  zoneForUnitNumber,
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

function openTone(zone: PathZone): string {
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

function nodeTone(status: NodeStatus, zone: PathZone): string {
  switch (status) {
    case "now":
      return "candy-node-now";
    case "open":
      return openTone(zone);
    case "locked":
      return "candy-node-locked";
    default: {
      const _never: never = status;
      return _never;
    }
  }
}

function TenFrameBush({ filled, hue, className }: { filled: number; hue: "pink" | "purple" | "gold"; className: string }) {
  return (
    <div className={cn("tf-bush", className)} aria-hidden>
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

  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-path-status='now']");
    el?.scrollIntoView({ block: "center", behavior: "auto" });
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

  const current = UNITS.find((u) => u.id === suggestedId) ?? UNITS[0]!;
  const currentPos = GRADE3_PATH_NODES[current.number - 1] ?? GRADE3_PATH_NODES[0]!;

  return (
    <div className="candy-map" data-grade-path="1">
      <div className="candy-sky" aria-hidden />
      <div className="candy-zone candy-zone-forest" data-path-zone="forest" aria-hidden />
      <div className="candy-zone candy-zone-cove" data-path-zone="cove" aria-hidden />
      <div className="candy-zone candy-zone-meadow" data-path-zone="meadow" aria-hidden />

      <div className="candy-land" aria-hidden>
        <span className="candy-flower candy-flower-a" />
        <span className="candy-flower candy-flower-b" />
        <span className="candy-flower candy-flower-c" />
        <TenFrameBush filled={8} hue="purple" className="tf-bush-a" />
        <TenFrameBush filled={6} hue="pink" className="tf-bush-b" />
        <TenFrameBush filled={10} hue="gold" className="tf-bush-c" />
        <span className="cove-water" />
        <span className="cove-pier" />
        <span className="cove-boat cove-boat-a" />
        <span className="cove-boat cove-boat-b" />
        <span className="cove-palm" />
        <span className="gold-stack gold-stack-a" />
        <span className="gold-stack gold-stack-b" />
        <span className="gold-stack gold-stack-c" />
        <span className="pine pine-a" />
        <span className="pine pine-b" />
        <span className="pine pine-c" />
        <PieTree
          className="pie-tree-a"
          slices="conic-gradient(#ff8ec8 0 90deg, #8ee0ff 90deg 180deg, #ffe27a 180deg 270deg, #b8f08a 270deg 360deg)"
        />
        <PieTree
          className="pie-tree-b"
          slices="conic-gradient(#c9a6ff 0 180deg, #ffb3d9 180deg 360deg)"
        />
        <PieTree
          className="pie-tree-c"
          slices="conic-gradient(#7ed0ff 0 45deg, #ffd36a 45deg 90deg, #ff8ec8 90deg 180deg, #9be08a 180deg 270deg, #c9a6ff 270deg 360deg)"
        />
      </div>

      <svg className="candy-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <path className="candy-trail-glow" d={trail} />
        <path className="candy-trail-fill" d={trail} />
        <path className="candy-trail-dots" d={trail} />
      </svg>

      <p className="candy-sign candy-sign-meadow">{zoneLabel("meadow", ui)}</p>
      <p className="candy-sign candy-sign-cove">{zoneLabel("cove", ui)}</p>
      <p className="candy-sign candy-sign-forest">{zoneLabel("forest", ui)}</p>

      {UNITS.map((unit, i) => {
        const pos = GRADE3_PATH_NODES[i]!;
        const status = unitStatus(unit, suggestedId);
        const zone = zoneForUnitNumber(unit.number);
        const stars = displayUnitStars(unitStars(unit.id), unitMaxStars(unit.id));
        const short = unitText(unit, locale).short;
        const locked = status === "locked";
        return (
          <button
            key={unit.id}
            type="button"
            className={cn("candy-node", nodeTone(status, zone))}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            data-path-unit={unit.id}
            data-path-status={status}
            data-path-zone={zone}
            disabled={locked}
            aria-disabled={locked}
            aria-label={`${ui.unitN(unit.number)}. ${short}${status === "now" ? `, ${ui.now}` : ""}${locked ? `, ${ui.pathLocked}` : ""}`}
            onClick={() => activate(status, unit.id)}
          >
            <span className="candy-node-disc">{unit.number}</span>
            {locked ? (
              <Lock className="candy-lock" aria-hidden />
            ) : (
              <span className="candy-stars" aria-hidden>
                {[0, 1, 2].map((s) => (
                  <span key={s} className={cn("candy-star", s < stars && "candy-star-on")}>
                    ★
                  </span>
                ))}
              </span>
            )}
          </button>
        );
      })}

      <div
        className="candy-hopper"
        style={{ left: `${currentPos.x}%`, top: `${currentPos.y}%` }}
        data-path-hopper={hopperId}
      >
        <MagentaImg src={squisheeSrc(hopperId)} alt="" className="candy-hopper-art" />
      </div>

      <button type="button" className="candy-start" onClick={onStart}>
        {ui.start}
      </button>
    </div>
  );
}
