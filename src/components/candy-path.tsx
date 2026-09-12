import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type PointerEvent } from "react";
import { useUi } from "@/components/chrome";
import { DressedSquishee } from "@/components/dressed-squishee";
import { MysteryPresent } from "@/components/mystery-present";
import { PokeToy } from "@/components/poke-toy";
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
  HOPPER_ART_ZOOM_PCT,
  HOPPER_BOARD_WIDTH_PCT,
  HOPPER_SIT_TRANSLATE,
  HOP_GLOW_BOARD_WIDTH_PCT,
  HOP_SNAP_MIN_PX,
  HOP_SNAP_PX,
  hopSnapPx,
  RADIAL_MAP_FILE,
  RADIAL_PADS,
  START_PAD,
  activePathStepsLeft,
  adjacentPadIds,
  areAdjacent,
  canStartDiceTurn,
  clampPad,
  hopCreditsOf,
  nearestHopTarget,
  portalPartner,
  radialPad,
  rollDieFace,
  type DieFace,
} from "@/lib/radial-web";
import {
  UNWRAP_HOLD_MS,
  UNWRAP_OPEN_MS,
  foundPresentPads,
  landPresent,
  type LandedPresent,
  visiblePresentPads,
} from "@/lib/presents";
import { playDice, playHop, playLand, playStar, playWarp } from "@/lib/sound";
import { pathHopperId, squisheeById } from "@/lib/squishees";
import { cn } from "@/lib/utils";

type UnwrapBeat = { pad: number; reward: LandedPresent; phase: "open" | "reveal" };

function padView(id: number) {
  return radialPad(id).map;
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

function unwrapCopy(
  reward: LandedPresent,
  ui: { youFound: (name: string) => string; youFoundCoins: (n: number) => string; surprisePresent: string },
): { name: string; line: string } {
  switch (reward.kind) {
    case "coins":
      return { name: `+${reward.coins}`, line: ui.youFoundCoins(reward.coins) };
    case "squishee": {
      const name = squisheeById(reward.squisheeId)?.name ?? ui.surprisePresent;
      return { name, line: ui.youFound(name) };
    }
    default: {
      const _never: never = reward;
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
  useProgress((s) => `${s.squishees.join("\0")}:${s.hopperId}:${s.equippedCosmetic}:${s.openedPresents.join(",")}`);
  const owned = useProgress.getState().squishees;
  const opened = useProgress.getState().openedPresents ?? [];
  const chosenHopper = useProgress.getState().hopperId;
  const equippedCosmetic = useProgress.getState().equippedCosmetic;
  const activities = useProgress((s) => s.activities);
  const hopsSpent = useProgress((s) => s.pathHopSpent);
  const storedSteps = useProgress((s) => s.pathStepsLeft);
  const sessions = useProgress((s) => s.sessions);
  const setPathHopperAt = useProgress((s) => s.setPathHopperAt);
  const startDiceTurn = useProgress((s) => s.startDiceTurn);
  const spendPathStep = useProgress((s) => s.spendPathStep);
  const landPresentPad = useProgress((s) => s.landPresentPad);
  const hopperId = pathHopperId(owned, chosenHopper);
  const [unwrap, setUnwrap] = useState<UnwrapBeat | null>(null);
  const boxedPads = visiblePresentPads(owned, opened).filter((id) => unwrap?.pad !== id);
  const foundPads = foundPresentPads(owned, opened).filter((id) => unwrap?.pad !== id);
  const boxed = new Set(boxedPads);
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
  const choices = picking ? adjacentPadIds(dest) : [];
  const boardRef = useRef<HTMLDivElement>(null);
  const tapStart = useRef<{ x: number; y: number } | null>(null);

  const maybeUnlock = (pad: number) => {
    const st = useProgress.getState();
    const reward = landPresent(pad, st.squishees, st.openedPresents);
    if (!reward) return;
    const r = landPresentPad(pad);
    if (!r.ok || !r.reward) return;
    playStar();
    setUnwrap({ pad, reward: r.reward, phase: "open" });
  };

  useEffect(() => {
    if (!unwrap) return;
    if (unwrap.phase === "open") {
      const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        setUnwrap({ ...unwrap, phase: "reveal" });
        return;
      }
      const t = window.setTimeout(() => setUnwrap((u) => (u ? { ...u, phase: "reveal" } : u)), UNWRAP_OPEN_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setUnwrap(null), UNWRAP_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [unwrap]);

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
      maybeUnlock(pad);
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
      maybeUnlock(pad);
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

  const isPrimaryBoardTap = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return false;
    if (e.pointerType === "mouse") return e.button === 0;
    return true;
  };

  const onBoardPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!picking || !isPrimaryBoardTap(e)) return;
    tapStart.current = { x: e.clientX, y: e.clientY };
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onBoardPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!picking || !e.isPrimary) return;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    const start = tapStart.current;
    tapStart.current = null;
    const board = boardRef.current;
    if (!start || !board) return;
    const rect = board.getBoundingClientRect();
    const snap = hopSnapPx(rect);
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > snap) return;
    const hit = nearestHopTarget(e.clientX, e.clientY, rect, choices, dest, snap);
    if (hit != null) chooseHop(hit);
  };

  const onBoardPointerCancel = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
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
      data-present-count={String(boxedPads.length)}
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
          ref={boardRef}
          className="candy-overlay"
          data-hop-board="1"
          data-hop-pick={picking ? "1" : "0"}
          data-dice-invite={inviting ? "1" : "0"}
          data-dice-steps={String(steps)}
          data-hop-snap={String(HOP_SNAP_PX)}
          data-hop-snap-min={String(HOP_SNAP_MIN_PX)}
          data-hopper-fit="pad"
          style={{
            ["--hop-tile" as string]: `${HOPPER_BOARD_WIDTH_PCT}%`,
            ["--hop-art-zoom" as string]: `${HOPPER_ART_ZOOM_PCT}%`,
            ["--hop-glow" as string]: `${HOP_GLOW_BOARD_WIDTH_PCT}%`,
            ["--hop-glow-fill" as string]: `${(HOP_GLOW_BOARD_WIDTH_PCT / HOPPER_BOARD_WIDTH_PCT) * 100}%`,
          }}
          onPointerDown={onBoardPointerDown}
          onPointerUp={onBoardPointerUp}
          onPointerCancel={onBoardPointerCancel}
        >
        {boxedPads.map((id) => {
          const view = padView(id);
          return (
            <span
              key={`present-${id}`}
              className="candy-present"
              style={{ left: `${view.x}%`, top: `${view.y}%` }}
              data-pad-present="1"
              data-present-pad={String(id)}
              aria-hidden
            >
              <MysteryPresent />
            </span>
          );
        })}
        {foundPads.map((id) => {
          const view = padView(id);
          return (
            <span
              key={`found-${id}`}
              className="candy-present candy-present-found"
              style={{ left: `${view.x}%`, top: `${view.y}%` }}
              data-pad-present-found="1"
              data-present-pad={String(id)}
              aria-hidden
            >
              <MysteryPresent found />
            </span>
          );
        })}
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
              aria-label={
                choice ? (boxed.has(pad.id) ? `${ui.hopOne}, ${ui.surprisePresent}` : ui.hopOne) : undefined
              }
              onClick={() => chooseHop(pad.id)}
            >
              <span className="candy-node-disc" />
            </button>
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
            transform: `${HOPPER_SIT_TRANSLATE} scale(${pose.squashX}, ${pose.squashY})`,
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
          <span className="candy-hopper-fit" aria-hidden>
            <DressedSquishee id={hopperId} cosmetic={equippedCosmetic} imgClassName="candy-hopper-art" />
          </span>
        </div>
        {unwrap ? (
          <button
            type="button"
            className="candy-unwrap"
            style={{ left: `${padView(unwrap.pad).x}%`, top: `${padView(unwrap.pad).y}%` }}
            data-present-unwrap={unwrap.phase}
            aria-label={unwrap.phase === "reveal" ? unwrapCopy(unwrap.reward, ui).line : ui.surprisePresent}
            data-present-kind={unwrap.reward.kind}
            onClick={() => setUnwrap(null)}
          >
            {unwrap.phase === "open" ? (
              <MysteryPresent opening size="shelf" />
            ) : unwrap.reward.kind === "coins" ? (
              <>
                <img
                  src={asset("candy-zones/overlays/coin-stack.png")}
                  alt=""
                  className="h-20 w-20 object-contain"
                  data-present-coins={String(unwrap.reward.coins)}
                  draggable={false}
                />
                <span className="candy-unwrap-name">+{unwrap.reward.coins}</span>
                <span className="candy-unwrap-line">{ui.youFoundCoins(unwrap.reward.coins)}</span>
              </>
            ) : (
              <>
                <PokeToy
                  id={unwrap.reward.squisheeId}
                  size="sm"
                  cheer
                  className="h-20 w-20 overflow-visible rare-glow"
                />
                <span className="candy-unwrap-name">{squisheeById(unwrap.reward.squisheeId)?.name}</span>
                <span className="candy-unwrap-line">
                  {ui.youFound(squisheeById(unwrap.reward.squisheeId)?.name ?? "")}
                </span>
              </>
            )}
          </button>
        ) : null}
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
