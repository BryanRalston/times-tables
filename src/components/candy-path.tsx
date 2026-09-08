import { Lock } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { asset } from "@/lib/art";
import {
  hopAlong,
  hopLandSettle,
  hopProgressAt,
  hopTravelMs,
  hopUnitStops,
  restHopPose,
  type HopPose,
} from "@/lib/candy-hop";
import { todayIso } from "@/lib/calendar";
import { UNITS } from "@/lib/curriculum";
import {
  GRADE3_PATH_NODES,
  GRADE3_PATH_PADS,
  TALL_MAP_FILE,
  TALL_MAP_OVERLAY_DIR,
  TALL_MAP_OVERLAYS,
  TRAIL_PEEK_ARM_MS,
  TRAIL_PEEK_ARM_SPREAD_MS,
  pickTrailPeekSpot,
  trailPeekHash,
  displayUnitStars,
  fogCoverPercent,
  mapToViewPos,
  nodeIsFogged,
  overlayIsVeiled,
  overlayMotionClass,
  zoneForUnitNumber,
  zoneLabelIsFogged,
  type PathZone,
} from "@/lib/grade-path";
import { parseLocale } from "@/lib/i18n";
import { unitText } from "@/lib/labels";
import { unitStatus, type NodeStatus } from "@/lib/path";
import { unitMaxStars, unitStars, useProgress } from "@/lib/progress";
import { pathHopperId, squisheeSrc, trailPeekFace } from "@/lib/squishees";
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

function trailPeekInScroller(el: HTMLElement, root: HTMLElement): boolean {
  const er = el.getBoundingClientRect();
  const sr = root.getBoundingClientRect();
  return er.bottom > sr.top + 4 && er.top < sr.bottom - 4 && er.width > 0 && er.height > 0;
}

function TrailPeek({
  nowNumber,
  hopperId,
  hold,
}: {
  nowNumber: number;
  hopperId: string;
  hold: boolean;
}) {
  const reduce = usePrefersReducedMotion();
  const nodeRef = useRef<HTMLSpanElement>(null);
  const played = useRef(false);
  const [armed, setArmed] = useState(false);
  const iso = todayIso();
  const hash = trailPeekHash(iso, nowNumber);
  const spot = pickTrailPeekSpot(nowNumber, hash);

  useEffect(() => {
    if (played.current) return;
    if (reduce || !spot || hold) {
      if (!played.current) setArmed(false);
      return;
    }
    const el = nodeRef.current;
    const root = el?.closest(".candy-scroll");
    if (!el || !(root instanceof HTMLElement)) return;

    let timer = 0;
    let arming = false;
    const delay = TRAIL_PEEK_ARM_MS + (hash % TRAIL_PEEK_ARM_SPREAD_MS);

    const schedule = () => {
      if (played.current || arming || !trailPeekInScroller(el, root)) return;
      arming = true;
      timer = window.setTimeout(() => {
        if (played.current) return;
        played.current = true;
        setArmed(true);
      }, delay);
    };

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === "function") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) schedule();
        },
        { root, threshold: 0.12, rootMargin: "12% 0px" },
      );
      io.observe(el);
    }

    const raf = requestAnimationFrame(schedule);
    const poll = window.setTimeout(schedule, 480);
    root.addEventListener("scroll", schedule, { passive: true });
    return () => {
      io?.disconnect();
      root.removeEventListener("scroll", schedule);
      cancelAnimationFrame(raf);
      window.clearTimeout(poll);
      window.clearTimeout(timer);
    };
  }, [hash, hold, reduce, spot]);

  if (reduce || !spot) return null;
  const view = mapToViewPos(spot.map);
  const turn = trailPeekFace(hash, hopperId);
  return (
    <span
      ref={nodeRef}
      className="candy-trail-peek"
      style={{ left: `${view.x}%`, top: `${view.y}%` }}
      data-trail-peek={spot.id}
      data-peek-id={turn.id}
      data-peek-armed={armed ? "1" : "0"}
      data-peek-exited={played.current && !armed ? "1" : "0"}
      data-peek-side={spot.map.x < 50 ? "left" : "right"}
      aria-hidden
      onAnimationEnd={(e) => {
        if (!(e.target instanceof HTMLElement)) return;
        if (!e.target.classList.contains("candy-trail-peek-art")) return;
        setArmed(false);
      }}
    >
      {armed ? <MagentaImg src={squisheeSrc(turn.id)} alt="" className="candy-trail-peek-art" /> : null}
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

export type CandyPathHandle = {
  playNow: () => void;
};

export const CandyPath = forwardRef<
  CandyPathHandle,
  {
    suggestedId: string;
    standFrom?: number;
    onStart: () => void;
    onOpenUnit: (id: string) => void;
  }
>(function CandyPath({ suggestedId, standFrom, onStart, onOpenUnit }, ref) {
  const ui = useUi();
  const locale = parseLocale(useProgress((s) => s.locale));
  const owned = useProgress((s) => s.squishees);
  const setPathHopperAt = useProgress((s) => s.setPathHopperAt);
  const hopperId = pathHopperId(owned);
  const current = UNITS.find((u) => u.id === suggestedId) ?? UNITS[0]!;
  const origin = standFrom && standFrom > 0 ? standFrom : current.number;
  const originPos = mapToViewPos(GRADE3_PATH_NODES[origin - 1] ?? GRADE3_PATH_NODES[0]!);
  const settled = useRef(origin);
  const pending = useRef<(() => void) | null>(null);
  const [dest, setDest] = useState(current.number);
  const [travelFrom, setTravelFrom] = useState(origin);
  const [travel, setTravel] = useState(origin !== current.number);
  const [landing, setLanding] = useState(false);
  const [pose, setPose] = useState<HopPose>(() => restHopPose(originPos));
  const destPos = mapToViewPos(GRADE3_PATH_NODES[dest - 1] ?? GRADE3_PATH_NODES[0]!);
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
    setDest(current.number);
  }, [current.number]);

  useEffect(() => {
    const from = settled.current;
    const to = dest;
    const finish = (pad: number) => {
      settled.current = pad;
      setPathHopperAt(pad);
      setTravel(false);
      setLanding(false);
      setPose(restHopPose(mapToViewPos(GRADE3_PATH_NODES[pad - 1] ?? GRADE3_PATH_NODES[0]!)));
      const next = pending.current;
      pending.current = null;
      next?.();
    };
    if (from === to) {
      finish(to);
      return;
    }

    const stops = hopUnitStops(from, to);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTravelFrom(from);
    if (reduce || stops.length < 2) {
      finish(to);
      return;
    }

    const views = stops.map((n) => mapToViewPos(GRADE3_PATH_NODES[n - 1]!));
    const hopCount = views.length - 1;
    setTravel(true);
    setLanding(false);
    setPose(restHopPose(views[0]!));
    let raf = 0;
    let wasLand = false;
    const start = performance.now();
    const tick = (now: number) => {
      const { hopIndex, t, phase, done } = hopProgressAt(now - start, hopCount);
      if (done) {
        finish(to);
        return;
      }
      const isLand = phase === "land";
      if (isLand !== wasLand) {
        wasLand = isLand;
        setLanding(isLand);
      }
      switch (phase) {
        case "land":
          setPose(hopLandSettle(views[hopIndex + 1]!, t));
          break;
        case "air":
          setPose(hopAlong(views[hopIndex]!, views[hopIndex + 1]!, t));
          break;
        default: {
          const _never: never = phase;
          return _never;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dest, destPos.x, destPos.y, setPathHopperAt]);

  const hopThen = (to: number, then: () => void) => {
    if (settled.current === to && !travel) {
      then();
      return;
    }
    pending.current = then;
    if (dest !== to) setDest(to);
  };

  useImperativeHandle(ref, () => ({
    playNow: () => hopThen(current.number, onStart),
  }));

  const activate = (status: NodeStatus, unitId: string, unitNumber: number) => {
    switch (status) {
      case "now":
        hopThen(unitNumber, onStart);
        return;
      case "open":
        hopThen(unitNumber, () => onOpenUnit(unitId));
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
              onClick={() => activate(status, unit.id, unit.number)}
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

        <span
          className="candy-hopper-shadow"
          style={{
            left: `${pose.shadowX}%`,
            top: `${pose.shadowY}%`,
            opacity: pose.shadowOpacity,
            transform: `translate(-50%, 22%) scale(${pose.shadowScale}, ${0.62 + pose.shadowScale * 0.18})`,
          }}
          data-path-shadow={travel ? "1" : "0"}
          aria-hidden
        />
        <div
          className={cn("candy-hopper", travel && "candy-hopper-travel")}
          style={{
            left: `${pose.x}%`,
            top: `${pose.y}%`,
            transform: `translate(-50%, -62%) scale(${pose.squashX}, ${pose.squashY})`,
          }}
          data-path-hopper={hopperId}
          data-path-travel={travel ? "1" : "0"}
          data-path-land={landing ? "1" : "0"}
          data-path-hop-from={travel ? String(travelFrom) : String(dest)}
          data-path-hop-to={String(dest)}
          data-path-hop-ms={travel ? String(hopTravelMs(hopUnitStops(travelFrom, dest))) : "0"}
        >
          <MagentaImg src={squisheeSrc(hopperId)} alt="" className="candy-hopper-art" />
        </div>

        <TrailPeek nowNumber={current.number} hopperId={hopperId} hold={travel} />

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
});
