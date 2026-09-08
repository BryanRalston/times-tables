import { Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { asset } from "@/lib/art";
import { hopAlong, hopProgressAt, hopTravelMs, hopUnitStops, restHopPose, type HopPose } from "@/lib/candy-hop";
import { todayIso } from "@/lib/calendar";
import { UNITS } from "@/lib/curriculum";
import {
  GRADE3_PATH_NODES,
  GRADE3_PATH_PADS,
  TALL_MAP_FILE,
  TALL_MAP_OVERLAY_DIR,
  TALL_MAP_OVERLAYS,
  TRAIL_PEEK_SPOTS,
  displayUnitStars,
  fogCoverPercent,
  mapToViewPos,
  nodeIsFogged,
  overlayIsVeiled,
  overlayMotionClass,
  zoneForUnitNumber,
  zoneIsFogged,
  zoneLabelIsFogged,
  type PathZone,
} from "@/lib/grade-path";
import { parseLocale } from "@/lib/i18n";
import { unitText } from "@/lib/labels";
import { unitStatus, type NodeStatus } from "@/lib/path";
import { unitMaxStars, unitStars, useProgress } from "@/lib/progress";
import { peekTurn, pathHopperId, squisheeSrc } from "@/lib/squishees";
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

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}

function trailPeekHash(iso: string, nowNumber: number): number {
  let h = 2166136261;
  for (let i = 0; i < iso.length; i++) h = Math.imul(h ^ iso.charCodeAt(i), 16777619);
  return (h + nowNumber * 131) >>> 0;
}

function TrailPeek({ nowNumber }: { nowNumber: number }) {
  const reduce = usePrefersReducedMotion();
  const [armed, setArmed] = useState(false);
  const iso = todayIso();
  const hash = trailPeekHash(iso, nowNumber);
  const clear = TRAIL_PEEK_SPOTS.filter((s) => !zoneIsFogged(s.zone, nowNumber));
  const spot = clear.length ? clear[hash % clear.length] : undefined;

  useEffect(() => {
    if (reduce || !spot) {
      setArmed(false);
      return;
    }
    const t = window.setTimeout(() => setArmed(true), 3000 + (hash % 2600));
    return () => window.clearTimeout(t);
  }, [hash, reduce, spot]);

  if (reduce || !armed || !spot) return null;
  const view = mapToViewPos(spot.map);
  const turn = peekTurn(hash % 19);
  return (
    <span
      className="candy-trail-peek"
      style={{ left: `${view.x}%`, top: `${view.y}%` }}
      data-trail-peek={spot.id}
      data-peek-id={turn.id}
      aria-hidden
      onAnimationEnd={(e) => {
        if (!(e.target instanceof HTMLElement)) return;
        if (!e.target.classList.contains("candy-trail-peek-art")) return;
        setArmed(false);
      }}
    >
      <MagentaImg src={squisheeSrc(turn.id)} alt="" className="candy-trail-peek-art" />
    </span>
  );
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
    const hopper = document.querySelector<HTMLElement>("[data-path-hopper]");
    const scroller = hopper?.closest(".candy-scroll");
    if (hopper && scroller instanceof HTMLElement) {
      const hr = hopper.getBoundingClientRect();
      const sr = scroller.getBoundingClientRect();
      const delta = hr.top - (sr.top + sr.height * 0.46);
      if (Math.abs(delta) >= 5) {
        if (travel) scroller.scrollTop += delta * 0.28;
        else scroller.scrollTop += delta;
      }
    }
  }, [pose.y, travel]);

  useEffect(() => {
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

        {TALL_MAP_OVERLAYS.map((prop) => {
          const view = mapToViewPos(prop.map);
          const veiled = overlayIsVeiled(prop.map.y, current.number);
          return (
            <span
              key={prop.id}
              className={cn("candy-prop", overlayMotionClass(prop.motion), veiled && "candy-prop-veil")}
              style={{ left: `${view.x}%`, top: `${view.y}%`, width: `${prop.width}%` }}
              data-candy-prop={prop.id}
              data-candy-prop-zone={prop.zone}
              data-candy-prop-veil={veiled ? "1" : "0"}
              aria-hidden
            >
              <img src={asset(`${TALL_MAP_OVERLAY_DIR}/${prop.file}`)} alt="" draggable={false} decoding="async" />
            </span>
          );
        })}

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

        <TrailPeek nowNumber={current.number} />

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
