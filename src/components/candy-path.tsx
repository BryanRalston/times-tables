import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type PointerEvent } from "react";
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
  DICE_TUMBLE_MS,
  HOP_DIR_SNAP_DEG,
  RADIAL_MAP_FILE,
  RADIAL_PADS,
  START_PAD,
  activePathStepsLeft,
  areAdjacent,
  canStartDiceTurn,
  clampPad,
  hopCreditsOf,
  hopDirs,
  nearestHopDir,
  portalPartner,
  radialPad,
  rollDieFace,
  type DieFace,
  type HopCardinal,
  type HopDir,
} from "@/lib/radial-web";
import { playDice, playHop, playLand, playWarp } from "@/lib/sound";
import { pathHopperId, squisheeSrc } from "@/lib/squishees";
import { cn } from "@/lib/utils";

function padView(id: number) {
  return radialPad(id).map;
}

function hopDirKind(dir: HopDir): HopCardinal | "angle" {
  switch (dir.cardinal) {
    case "up":
    case "down":
    case "left":
    case "right":
      return dir.cardinal;
    case null:
      return "angle";
    default: {
      const _never: never = dir.cardinal;
      return _never;
    }
  }
}

function diePips(face: DieFace): { x: number; y: number }[] {
  switch (face) {
    case 1:
      return [{ x: 50, y: 50 }];
    case 2:
      return [
        { x: 30, y: 30 },
        { x: 70, y: 70 },
      ];
    case 3:
      return [
        { x: 28, y: 28 },
        { x: 50, y: 50 },
        { x: 72, y: 72 },
      ];
    default: {
      const _never: never = face;
      return _never;
    }
  }
}

function KidDie({ face, tumbling }: { face: DieFace; tumbling: boolean }) {
  return (
    <div
      className={cn("candy-die", tumbling && "candy-die-tumble")}
      data-path-die="1"
      data-die-face={String(face)}
      data-die-tumble={tumbling ? "1" : "0"}
      aria-hidden
    >
      {diePips(face).map((p, i) => (
        <span key={i} className="candy-die-pip" style={{ left: `${p.x}%`, top: `${p.y}%` }} />
      ))}
    </div>
  );
}

export type CandyPathHandle = {
  playNow: () => void;
  rollDie: () => void;
};

export const CandyPath = forwardRef<
  CandyPathHandle,
  {
    suggestedId: string;
    standFrom?: number;
    standTo?: number;
    hopCredits?: number;
    stepsLeft?: number;
    freeMove?: boolean;
    railUnits?: typeof UNITS;
    onStart: () => void;
    onOpenUnit: (id: string) => void;
  }
>(function CandyPath({ suggestedId, standFrom, standTo, hopCredits, stepsLeft, freeMove = false, railUnits, onStart, onOpenUnit }, ref) {
  const ui = useUi();
  const locale = parseLocale(useProgress((s) => s.locale));
  const owned = useProgress((s) => s.squishees);
  const activities = useProgress((s) => s.activities);
  const hopsSpent = useProgress((s) => s.pathHopSpent);
  const storedSteps = useProgress((s) => s.pathStepsLeft);
  const sessions = useProgress((s) => s.sessions);
  const setPathHopperAt = useProgress((s) => s.setPathHopperAt);
  const startDiceTurn = useProgress((s) => s.startDiceTurn);
  const spendPathStep = useProgress((s) => s.spendPathStep);
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
  const steps = stepsLeft ?? activePathStepsLeft(hopsSpent, storedSteps);
  const [rolling, setRolling] = useState<DieFace | null>(null);
  const [tumbleFace, setTumbleFace] = useState<DieFace>(1);
  const inviting = !freeMove && canStartDiceTurn(credits, steps) && !travel && !warp && rolling == null;
  const picking = (freeMove || steps > 0) && !travel && !warp && rolling == null;
  const dirs = picking ? hopDirs(dest) : [];
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

  useEffect(() => {
    if (rolling == null) return;
    const faces: DieFace[] = [1, 2, 3, 2, 1, 3, rolling];
    let i = 0;
    setTumbleFace(faces[0]!);
    const tick = window.setInterval(() => {
      i += 1;
      setTumbleFace(faces[Math.min(i, faces.length - 1)]!);
      if (i >= faces.length - 1) window.clearInterval(tick);
    }, 90);
    const done = window.setTimeout(() => setRolling(null), DICE_TUMBLE_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [rolling]);

  const beginRoll = () => {
    if (freeMove || rolling != null || travel || warp || !canStartDiceTurn(credits, steps)) return;
    const face = rollDieFace();
    if (!startDiceTurn(face)) return;
    playDice();
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    setRolling(face);
    setTumbleFace(1);
  };

  const chooseHop = (to: number) => {
    if (travel || warp || rolling != null || (!freeMove && steps <= 0)) return;
    if (!areAdjacent(settled.current, to)) return;
    if (!freeMove) spendPathStep();
    setDest(to);
  };

  const onDpadPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!picking || e.button !== 0) return;
    tapStart.current = { x: e.clientX, y: e.clientY };
  };

  const onDpadPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!picking || e.button !== 0) return;
    const start = tapStart.current;
    tapStart.current = null;
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) return;
    const onBtn = e.target instanceof Element && e.target.closest("[data-hop-to]");
    if (onBtn) return;
    const hopper = e.currentTarget.closest("[data-path-hopper]");
    if (!(hopper instanceof HTMLElement)) return;
    const box = hopper.getBoundingClientRect();
    const hit = nearestHopDir(box.left + box.width / 2, box.top + box.height / 2, e.clientX, e.clientY, dirs);
    if (hit != null) chooseHop(hit);
  };

  const onDpadPointerCancel = () => {
    tapStart.current = null;
  };

  useImperativeHandle(ref, () => ({
    playNow: () => onStart(),
    rollDie: () => beginRoll(),
  }));

  return (
    <div
      className="candy-map"
      data-grade-path="1"
      data-radial-web="1"
      data-radial-fill="1"
      data-candy-world="1"
      data-candy-radial-map="1"
      data-hop-credits={String(credits)}
      data-dice-invite={inviting ? "1" : "0"}
      data-dice-steps={String(steps)}
      data-test-free-move={freeMove ? "1" : "0"}
    >
      <div className="candy-world">
        <div className="candy-world-stage" data-radial-stage="1">
        <img
          className="candy-world-art"
          src={asset(RADIAL_MAP_FILE)}
          alt=""
          decoding="async"
          data-candy-radial-map-art="1"
          aria-hidden
        />
        <div
          className="candy-overlay"
          data-hop-board="1"
          data-hop-pick={picking ? "1" : "0"}
          data-dice-invite={inviting ? "1" : "0"}
          data-dice-steps={String(steps)}
          data-hop-snap={String(HOP_DIR_SNAP_DEG)}
        >
        {RADIAL_PADS.map((pad) => {
          const view = pad.map;
          const here = pad.id === dest && !travel && !warp;
          return (
            <span
              key={pad.id}
              className={cn("candy-node candy-node-bare candy-node-radial", here && "candy-node-here")}
              style={{ left: `${view.x}%`, top: `${view.y}%` }}
              data-path-pad="1"
              data-pad-id={String(pad.id)}
              data-pad-portal={pad.portal ? "1" : "0"}
              data-pad-here={here ? "1" : "0"}
              aria-hidden
            >
              <span className="candy-node-disc" />
            </span>
          );
        })}

        {rolling != null ? <KidDie face={tumbleFace} tumbling /> : null}

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
          {picking ? (
            <div
              className="candy-dpad"
              data-hop-dpad="1"
              data-hop-dirs={String(dirs.length)}
              onPointerDown={onDpadPointerDown}
              onPointerUp={onDpadPointerUp}
              onPointerCancel={onDpadPointerCancel}
            >
              {dirs.map((dir) => {
                const kind = hopDirKind(dir);
                const aim: CSSProperties = {
                  transform: `translate(-50%, -50%) rotate(${dir.bearing}deg) translateY(-2.85rem)`,
                };
                return (
                  <button
                    key={dir.id}
                    type="button"
                    className={cn("candy-dpad-btn", kind !== "angle" && "candy-dpad-cardinal", dir.portal && "candy-dpad-portal")}
                    style={aim}
                    data-hop-dir={kind}
                    data-hop-bearing={dir.bearing.toFixed(1)}
                    data-hop-to={String(dir.id)}
                    data-hop-portal={dir.portal ? "1" : "0"}
                    aria-label={ui.hopOne}
                    onClick={() => chooseHop(dir.id)}
                  >
                    <span className="candy-dpad-chevron" aria-hidden />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        </div>
        </div>
      </div>

      <div className="candy-unit-rail" data-unit-rail="1">
        {(railUnits ?? UNITS).map((unit) => {
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
