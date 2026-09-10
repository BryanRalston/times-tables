import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { asset } from "@/lib/art";
import {
  hopAirMsList,
  hopAlong,
  hopLandSettle,
  hopProgressAt,
  hopTravelMs,
  hopUnitStops,
  pathHopSfxKind,
  restHopPose,
  type HopPhase,
  type HopPose,
} from "@/lib/candy-hop";
import { todayIso } from "@/lib/calendar";
import { UNITS } from "@/lib/curriculum";
import {
  TALL_MAP_FILE,
  TRAIL_PEEK_ARM_MS,
  TRAIL_PEEK_ARM_SPREAD_MS,
  pickTrailPeekSpot,
  trailPeekHash,
  mapToViewPos,
} from "@/lib/grade-path";
import { parseLocale } from "@/lib/i18n";
import { unitText } from "@/lib/labels";
import { unitStatus } from "@/lib/path";
import { useProgress } from "@/lib/progress";
import {
  RADIAL_PADS,
  START_PAD,
  adjacentPadIds,
  areAdjacent,
  clampPad,
  hopCreditsOf,
  portalPartner,
  radialPad,
} from "@/lib/radial-web";
import { playHop, playLand, playPeek } from "@/lib/sound";
import { pathHopperId, squisheeSrc, trailPeekFace } from "@/lib/squishees";
import { cn } from "@/lib/utils";

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
        playPeek();
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

function padView(id: number) {
  return mapToViewPos(radialPad(id).map);
}

export type CandyPathHandle = {
  playNow: () => void;
};

export const CandyPath = forwardRef<
  CandyPathHandle,
  {
    suggestedId: string;
    standFrom?: number;
    standTo?: number;
    hopCredits?: number;
    onStart: () => void;
    onOpenUnit: (id: string) => void;
  }
>(function CandyPath({ suggestedId, standFrom, standTo, hopCredits, onStart, onOpenUnit }, ref) {
  const ui = useUi();
  const locale = parseLocale(useProgress((s) => s.locale));
  const owned = useProgress((s) => s.squishees);
  const activities = useProgress((s) => s.activities);
  const hopsSpent = useProgress((s) => s.pathHopSpent);
  const setPathHopperAt = useProgress((s) => s.setPathHopperAt);
  const spendPathHop = useProgress((s) => s.spendPathHop);
  const hopperId = pathHopperId(owned);
  const current = UNITS.find((u) => u.id === suggestedId) ?? UNITS[0]!;
  const origin = standFrom && standFrom > 0 ? clampPad(standFrom) : START_PAD;
  const requested = standTo && standTo > 0 ? clampPad(standTo) : origin;
  const target = requested === origin || areAdjacent(origin, requested) ? requested : origin;
  const originPos = padView(origin);
  const settled = useRef(origin);
  const [dest, setDest] = useState(target);
  const [travelFrom, setTravelFrom] = useState(origin);
  const [travel, setTravel] = useState(origin !== target && areAdjacent(origin, target));
  const [landing, setLanding] = useState(false);
  const [pose, setPose] = useState<HopPose>(() => restHopPose(originPos));
  const destPos = padView(dest);
  const credits = hopCredits ?? hopCreditsOf(activities, hopsSpent);
  const choices = credits > 0 && !travel ? adjacentPadIds(dest) : [];

  useEffect(() => {
    const hopper = document.querySelector<HTMLElement>("[data-path-hopper]");
    const scroller = hopper?.closest(".candy-scroll");
    if (hopper && scroller instanceof HTMLElement) {
      const hr = hopper.getBoundingClientRect();
      const sr = scroller.getBoundingClientRect();
      const deltaY = hr.top - (sr.top + sr.height * 0.46);
      const deltaX = hr.left - (sr.left + sr.width * 0.46);
      if (Math.abs(deltaY) >= 5 || Math.abs(deltaX) >= 5) {
        if (travel) {
          scroller.scrollTop += deltaY * 0.28;
          scroller.scrollLeft += deltaX * 0.28;
        } else {
          scroller.scrollTop += deltaY;
          scroller.scrollLeft += deltaX;
        }
      }
    }
  }, [pose.y, travel]);

  useEffect(() => {
    const from = settled.current;
    const to = dest;
    const finish = (pad: number, entered: boolean) => {
      let land = pad;
      if (entered) {
        const pair = portalPartner(pad);
        if (pair) land = pair;
      }
      settled.current = land;
      setPathHopperAt(land);
      setDest(land);
      setTravel(false);
      setLanding(false);
      setPose(restHopPose(padView(land)));
    };
    if (from === to) {
      finish(to, false);
      return;
    }

    const stops = hopUnitStops(from, to);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTravelFrom(from);
    if (reduce || stops.length < 2) {
      finish(from, false);
      return;
    }

    const views = stops.map((n) => padView(n));
    const hopCount = views.length - 1;
    const airMs = hopAirMsList(stops);
    setTravel(true);
    setLanding(false);
    setPose(restHopPose(views[0]!));
    let raf = 0;
    let wasLand = false;
    let prevSfx: { hopIndex: number; phase: HopPhase } | null = null;
    const start = performance.now();
    const tick = (now: number) => {
      const { hopIndex, t, phase, done } = hopProgressAt(now - start, hopCount, airMs);
      if (done) {
        finish(to, true);
        return;
      }
      const isLand = phase === "land";
      if (isLand !== wasLand) {
        wasLand = isLand;
        setLanding(isLand);
      }
      const sfx = pathHopSfxKind(prevSfx, { hopIndex, phase, done });
      switch (sfx) {
        case "hop":
          playHop(hopIndex, hopCount);
          break;
        case "land":
          playLand(hopIndex, hopCount);
          break;
        case null:
          break;
        default: {
          const _never: never = sfx;
          return _never;
        }
      }
      prevSfx = { hopIndex, phase };
      switch (phase) {
        case "land":
          setPose(hopLandSettle(views[hopIndex + 1]!, t));
          break;
        case "air":
          setPose(hopAlong(views[hopIndex]!, views[hopIndex + 1]!, t, false));
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

  const chooseHop = (to: number) => {
    if (travel || credits <= 0) return;
    if (!areAdjacent(settled.current, to)) return;
    spendPathHop();
    setDest(to);
  };

  useImperativeHandle(ref, () => ({
    playNow: () => onStart(),
  }));

  return (
    <div
      className="candy-map"
      data-grade-path="1"
      data-radial-web="1"
      data-candy-world="1"
      data-candy-radial-map="1"
      data-hop-credits={String(credits)}
    >
      <div className="candy-world" aria-hidden>
        <img
          className="candy-world-art"
          src={asset(TALL_MAP_FILE)}
          alt=""
          decoding="async"
          data-candy-radial-map-art="1"
        />
      </div>

      <div className="candy-overlay">
        {RADIAL_PADS.map((pad) => {
          const view = mapToViewPos(pad.map);
          const choice = choices.includes(pad.id);
          const here = pad.id === dest && !travel;
          return (
            <button
              key={pad.id}
              type="button"
              className={cn(
                "candy-node candy-node-bare candy-node-radial",
                choice && "candy-node-choice",
                here && "candy-node-here",
              )}
              style={{ left: `${view.x}%`, top: `${view.y}%` }}
              data-path-pad="1"
              data-pad-id={String(pad.id)}
              data-pad-choice={choice ? "1" : "0"}
              data-pad-portal={pad.portal ? "1" : "0"}
              disabled={!choice}
              aria-disabled={!choice}
              aria-label={choice ? ui.hopOne : undefined}
              onClick={() => chooseHop(pad.id)}
            >
              <span className="candy-node-disc" />
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
            transform: `translate(-50%, -108%) scale(${pose.squashX}, ${pose.squashY})`,
          }}
          data-path-hopper={hopperId}
          data-path-travel={travel ? "1" : "0"}
          data-path-land={landing ? "1" : "0"}
          data-path-hop-from={travel ? String(travelFrom) : String(dest)}
          data-path-hop-to={String(dest)}
          data-path-hop-ms={travel ? String(hopTravelMs(hopUnitStops(travelFrom, dest))) : "0"}
          data-path-clear-obstacle="0"
        >
          <MagentaImg src={squisheeSrc(hopperId)} alt="" className="candy-hopper-art" />
        </div>

        <TrailPeek nowNumber={current.number} hopperId={hopperId} hold={travel} />
      </div>

      <div className="candy-unit-rail" data-unit-rail="1">
        {UNITS.map((unit) => {
          const status = unitStatus(unit, suggestedId);
          const short = unitText(unit, locale).short;
          return (
            <button
              key={unit.id}
              type="button"
              className={cn("candy-unit-chip", status === "now" && "candy-unit-chip-now")}
              data-path-unit={unit.id}
              data-path-status={status === "locked" ? "open" : status}
              aria-label={`${ui.unitN(unit.number)}. ${short}${status === "now" ? `, ${ui.now}` : ""}`}
              onClick={() => (status === "now" ? onStart() : onOpenUnit(unit.id))}
            >
              {unit.number}
            </button>
          );
        })}
      </div>
    </div>
  );
});
