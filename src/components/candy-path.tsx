import { Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { asset } from "@/lib/art";
import { hopAlong, hopProgressAt, hopTravelMs, hopUnitStops, restHopPose, type HopPose } from "@/lib/candy-hop";
import { UNITS } from "@/lib/curriculum";
import {
  GRADE3_PATH_NODES,
  GRADE3_PATH_PADS,
  TALL_MAP_FILE,
  displayUnitStars,
  fogCoverPercent,
  mapToViewPos,
  nodeIsFogged,
  zoneForUnitNumber,
  zoneLabelIsFogged,
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
  const current = UNITS.find((u) => u.id === suggestedId) ?? UNITS[0]!;
  const restPos = mapToViewPos(GRADE3_PATH_NODES[current.number - 1] ?? GRADE3_PATH_NODES[0]!);
  const prevNumber = useRef(current.number);
  const [travelFrom, setTravelFrom] = useState(current.number);
  const [travel, setTravel] = useState(false);
  const [pose, setPose] = useState<HopPose>(() => restHopPose(restPos));
  const fogH = fogCoverPercent(current.number);

  useEffect(() => {
    const node = document.querySelector<HTMLElement>("[data-path-status='now']");
    const scroller = node?.closest(".candy-scroll");
    if (node && scroller instanceof HTMLElement) {
      const nr = node.getBoundingClientRect();
      const sr = scroller.getBoundingClientRect();
      scroller.scrollTo({
        top: scroller.scrollTop + (nr.top - sr.top) - sr.height * 0.42,
        behavior: prevNumber.current === current.number ? "auto" : "smooth",
      });
    }

    const from = prevNumber.current;
    const to = current.number;
    if (from === to) {
      setPose(restHopPose(restPos));
      return;
    }

    const stops = hopUnitStops(from, to);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    prevNumber.current = to;
    setTravelFrom(from);
    if (reduce || stops.length < 2) {
      setPose(restHopPose(restPos));
      setTravel(false);
      return;
    }

    const views = stops.map((n) => mapToViewPos(GRADE3_PATH_NODES[n - 1]!));
    const hopCount = views.length - 1;
    setTravel(true);
    setPose(restHopPose(views[0]!));
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const { hopIndex, t, done } = hopProgressAt(now - start, hopCount);
      if (done) {
        setPose(restHopPose(views[views.length - 1]!));
        setTravel(false);
        return;
      }
      setPose(hopAlong(views[hopIndex]!, views[hopIndex + 1]!, t));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [suggestedId, current.number, restPos.x, restPos.y]);

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
    <div className="candy-map" data-grade-path="1" data-path-tall="1" data-candy-world="1">
      <div className="candy-world" aria-hidden>
        <img
          className="candy-world-art"
          src={asset(TALL_MAP_FILE)}
          alt=""
          decoding="async"
          data-candy-tall-map="1"
        />
      </div>

      <div className="candy-overlay">
        <p className={cn("candy-sign candy-sign-meadow", zoneLabelIsFogged("meadow", current.number) && "candy-sign-fog")}>
          {zoneLabel("meadow", ui)}
        </p>
        <p className={cn("candy-sign candy-sign-cove", zoneLabelIsFogged("cove", current.number) && "candy-sign-fog")}>
          {zoneLabel("cove", ui)}
        </p>
        <p className={cn("candy-sign candy-sign-forest", zoneLabelIsFogged("forest", current.number) && "candy-sign-fog")}>
          {zoneLabel("forest", ui)}
        </p>

        {GRADE3_PATH_PADS.map((pad) => {
          const unit = UNITS[pad.unitNumber - 1];
          if (!unit) return null;
          const view = mapToViewPos(pad.map);
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
              className={cn("candy-node candy-node-bare", nodeTone(status, zone, unit.number))}
              style={{ left: `${view.x}%`, top: `${view.y}%` }}
              data-path-unit={unit.id}
              data-path-pad="1"
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
          style={{
            left: `${pose.x}%`,
            top: `${pose.y}%`,
            transform: `translate(-50%, -62%) scale(${pose.squashX}, ${pose.squashY})`,
          }}
          data-path-hopper={hopperId}
          data-path-travel={travel ? "1" : "0"}
          data-path-hop-from={travel ? String(travelFrom) : String(current.number)}
          data-path-hop-to={String(current.number)}
          data-path-hop-ms={travel ? String(hopTravelMs(hopUnitStops(travelFrom, current.number))) : "0"}
        >
          <MagentaImg src={squisheeSrc(hopperId)} alt="" className="candy-hopper-art" />
        </div>

        {fogH > 0 ? (
          <div className="candy-fog" data-candy-fog="1" data-candy-mist="1" style={{ height: `${fogH}%` }} aria-hidden>
            <span className="candy-fog-mist candy-fog-mist-a" />
            <span className="candy-fog-mist candy-fog-mist-b" />
          </div>
        ) : null}
        {fogH > 0 ? <p className="sr-only">{ui.pathFogAhead}</p> : null}
      </div>
    </div>
  );
}
