import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type PointerEvent } from "react";
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
  warpPose,
  warpProgressAt,
  type HopPhase,
  type HopPose,
} from "@/lib/candy-hop";
import { UNITS } from "@/lib/curriculum";
import { parseLocale } from "@/lib/i18n";
import { unitText } from "@/lib/labels";
import { unitStatus } from "@/lib/path";
import { useProgress } from "@/lib/progress";
import {
  HOP_SNAP_PX,
  RADIAL_MAP_FILE,
  RADIAL_PADS,
  START_PAD,
  adjacentPadIds,
  areAdjacent,
  clampPad,
  hopCreditsOf,
  nearestHopTarget,
  portalPartner,
  radialPad,
} from "@/lib/radial-web";
import { playHop, playLand, playWarp } from "@/lib/sound";
import { pathHopperId, squisheeSrc } from "@/lib/squishees";
import { cn } from "@/lib/utils";

function padView(id: number) {
  return radialPad(id).map;
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
  const sessions = useProgress((s) => s.sessions);
  const setPathHopperAt = useProgress((s) => s.setPathHopperAt);
  const spendPathHop = useProgress((s) => s.spendPathHop);
  const hopperId = pathHopperId(owned);
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
  const [warp, setWarp] = useState<{ from: number; to: number } | null>(null);
  const [hopperOpacity, setHopperOpacity] = useState(1);
  const warpRef = useRef<{ from: number; to: number } | null>(null);
  const destPos = padView(dest);
  const credits = hopCredits ?? hopCreditsOf(activities, hopsSpent, sessions);
  const picking = credits > 0 && !travel && !warp;
  const choices = picking ? adjacentPadIds(dest) : [];
  const boardRef = useRef<HTMLDivElement>(null);
  const tapStart = useRef<{ x: number; y: number } | null>(null);

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
    const settlePad = (pad: number) => {
      settled.current = pad;
      setPathHopperAt(pad);
      setDest(pad);
      setTravel(false);
      setLanding(false);
      setPose(restHopPose(padView(pad)));
    };
    const finishHop = (pad: number, entered: boolean) => {
      const pair = entered ? portalPartner(pad) : undefined;
      if (pair && pair !== pad) {
        settled.current = pad;
        setTravel(false);
        setLanding(false);
        setPose(restHopPose(padView(pad)));
        setDest(pad);
        const next = { from: pad, to: pair };
        warpRef.current = next;
        setWarp(next);
        return;
      }
      settlePad(pad);
    };
    if (from === to) {
      if (warpRef.current) return;
      settlePad(to);
      return;
    }

    const stops = hopUnitStops(from, to);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTravelFrom(from);
    if (reduce || stops.length < 2) {
      finishHop(from, false);
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
        finishHop(to, true);
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

  useEffect(() => {
    if (!warp) return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const landWarp = (pad: number) => {
      warpRef.current = null;
      settled.current = pad;
      setPathHopperAt(pad);
      setDest(pad);
      setPose(restHopPose(padView(pad)));
      setHopperOpacity(1);
      setWarp(null);
    };
    if (reduce) {
      landWarp(warp.to);
      return;
    }
    playWarp();
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const { t, phase, done, opacity } = warpProgressAt(now - start);
      if (done) {
        landWarp(warp.to);
        playLand(0, 1);
        return;
      }
      setHopperOpacity(opacity);
      setPose(warpPose(padView(warp.from), padView(warp.to), phase, t));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [warp, setPathHopperAt]);

  const chooseHop = (to: number) => {
    if (travel || warp || credits <= 0) return;
    if (!areAdjacent(settled.current, to)) return;
    spendPathHop();
    setDest(to);
  };

  const onBoardPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!picking || e.button !== 0) return;
    tapStart.current = { x: e.clientX, y: e.clientY };
  };

  const onBoardPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!picking || e.button !== 0) return;
    const start = tapStart.current;
    tapStart.current = null;
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) return;
    const board = boardRef.current;
    if (!board) return;
    const hit = nearestHopTarget(e.clientX, e.clientY, board.getBoundingClientRect(), choices, dest);
    if (hit != null) chooseHop(hit);
  };

  const onBoardPointerCancel = () => {
    tapStart.current = null;
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
      <div className="candy-world">
        <img
          className="candy-world-art"
          src={asset(RADIAL_MAP_FILE)}
          alt=""
          decoding="async"
          data-candy-radial-map-art="1"
          aria-hidden
        />
        <div
          ref={boardRef}
          className="candy-overlay"
          data-hop-board="1"
          data-hop-pick={picking ? "1" : "0"}
          data-hop-snap={String(HOP_SNAP_PX)}
          onPointerDown={onBoardPointerDown}
          onPointerUp={onBoardPointerUp}
          onPointerCancel={onBoardPointerCancel}
        >
        {RADIAL_PADS.map((pad) => {
          const view = pad.map;
          const choice = choices.includes(pad.id);
          const enterable = choice && pad.portal;
          const here = pad.id === dest && !travel && !warp;
          const quiet = picking && !choice && !here;
          return (
            <button
              key={pad.id}
              type="button"
              className={cn(
                "candy-node candy-node-bare candy-node-radial",
                pad.portal && "candy-node-portal",
                choice && "candy-node-choice",
                enterable && "candy-node-enterable",
                here && "candy-node-here",
                quiet && "candy-node-quiet",
              )}
              style={{ left: `${view.x}%`, top: `${view.y}%` }}
              data-path-pad="1"
              data-pad-id={String(pad.id)}
              data-pad-choice={choice ? "1" : "0"}
              data-pad-portal={pad.portal ? "1" : "0"}
              data-pad-enterable={enterable ? "1" : "0"}
              data-pad-here={here ? "1" : "0"}
              data-pad-quiet={quiet ? "1" : "0"}
              disabled={!choice}
              aria-disabled={!choice}
              aria-label={choice ? ui.hopOne : undefined}
              onClick={() => chooseHop(pad.id)}
            >
              <span className="candy-node-disc" />
            </button>
          );
        })}

        {warp ? (
          <>
            <span
              className="candy-warp-fx"
              style={{ left: `${padView(warp.from).x}%`, top: `${padView(warp.from).y}%` }}
              data-path-warp-fx="from"
              aria-hidden
            />
            <span
              className="candy-warp-fx"
              style={{ left: `${padView(warp.to).x}%`, top: `${padView(warp.to).y}%` }}
              data-path-warp-fx="to"
              aria-hidden
            />
          </>
        ) : null}

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
          className={cn("candy-hopper", (travel || warp) && "candy-hopper-travel", !travel && !warp && "candy-hopper-here")}
          style={{
            left: `${pose.x}%`,
            top: `${pose.y}%`,
            opacity: hopperOpacity,
            transform: `translate(-50%, -108%) scale(${pose.squashX}, ${pose.squashY})`,
          }}
          data-path-hopper={hopperId}
          data-path-travel={travel ? "1" : "0"}
          data-path-warp={warp ? "1" : "0"}
          data-path-land={landing ? "1" : "0"}
          data-path-hop-from={travel ? String(travelFrom) : String(dest)}
          data-path-hop-to={String(dest)}
          data-path-hop-ms={travel ? String(hopTravelMs(hopUnitStops(travelFrom, dest))) : "0"}
          data-path-clear-obstacle="0"
        >
          <MagentaImg src={squisheeSrc(hopperId)} alt="" className="candy-hopper-art" />
        </div>
        </div>
      </div>

      <div className="candy-unit-rail" data-unit-rail="1">
        {UNITS.map((unit) => {
          const status = unitStatus(unit, suggestedId);
          const short = unitText(unit, locale).short;
          const chipStatus = status === "locked" ? "open" : status;
          return (
            <button
              key={unit.id}
              type="button"
              className={cn("candy-unit-chip", status === "now" && "candy-unit-chip-now")}
              data-path-unit={unit.id}
              data-path-status={chipStatus}
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
