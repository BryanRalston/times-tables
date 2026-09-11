import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useUi } from "@/components/chrome";
import { MagentaImg } from "@/components/magenta-video";
import { SquashOnPoke } from "@/components/poke-toy";
import {
  applyWhoHidPick,
  dealMini,
  pickMiniKind,
  whoHidShowsFace,
  type HopDeal,
  type MatchDeal,
  type PeekDeal,
  type PokeDeal,
  type TwinDeal,
  type WhoHidDeal,
  type WhoHidStage,
} from "@/lib/minigames";
import { rngFromSeed } from "@/lib/rng";
import { playCorrect, playHop, playLand, playPeek, playTap, playWrong } from "@/lib/sound";
import { pathHopperId, squisheeById, squisheeSrc } from "@/lib/squishees";
import { cn } from "@/lib/utils";

function qaMiniKind(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("mini");
}

export function MiniGame({
  seed,
  owned,
  skipLabel,
  pokePrompt,
  whoHidLabel,
  matchLabel,
  peekLabel,
  twinLabel,
  hopLabel,
  onDone,
  whoStage,
}: {
  seed: string;
  owned: string[];
  skipLabel: string;
  pokePrompt: (name: string) => string;
  whoHidLabel: string;
  matchLabel: string;
  peekLabel?: string;
  twinLabel?: string;
  hopLabel?: string;
  onDone: () => void;
  whoStage?: WhoHidStage;
}) {
  const ui = useUi();
  const hopperId = pathHopperId(owned);
  const kind = useMemo(() => pickMiniKind(seed, qaMiniKind()), [seed]);
  const deal = useMemo(() => dealMini(kind, owned, rngFromSeed(`${seed}:deal`), hopperId), [hopperId, kind, owned, seed]);

  let play: ReactNode;
  switch (deal.kind) {
    case "match":
      play = <MatchPlay deal={deal} title={matchLabel} onDone={onDone} />;
      break;
    case "who-hid":
      play = <WhoHidPlay deal={deal} title={whoHidLabel} onDone={onDone} startStage={whoStage} />;
      break;
    case "poke":
      play = <PokePlay deal={deal} title={pokePrompt(squisheeById(deal.target)?.name ?? deal.target)} onDone={onDone} />;
      break;
    case "peek":
      play = <PeekPlay deal={deal} title={peekLabel ?? ui.findPeek} onDone={onDone} />;
      break;
    case "twin":
      play = <TwinPlay deal={deal} title={twinLabel ?? ui.matchTwins} onDone={onDone} />;
      break;
    case "hop":
      play = <HopPlay deal={deal} title={hopLabel ?? ui.quickHop} onDone={onDone} />;
      break;
    default: {
      const _never: never = deal;
      return _never;
    }
  }

  return (
    <div className="mini-desk mx-auto grid min-h-dvh max-w-lg place-items-center px-4 py-8" data-mini-kind={deal.kind}>
      <div className="w-full text-center">
        {play}
        <button type="button" className="mt-6 text-sm text-faint" onClick={onDone}>
          {skipLabel}
        </button>
      </div>
    </div>
  );
}

function ToyFace({ id, className, onLoad }: { id: string; className?: string; onLoad?: () => void }) {
  return (
    <span className={cn("mini-face", className)}>
      <MagentaImg src={squisheeSrc(id)} alt="" className="h-full w-full object-contain" onLoad={onLoad} />
    </span>
  );
}

function ToySilhouette({ id }: { id: string }) {
  return (
    <span className="mini-face squishee-silhouette" aria-hidden>
      <MagentaImg src={squisheeSrc(id)} alt="" className="h-full w-full object-contain" />
    </span>
  );
}

function HideHole() {
  return (
    <span className="mini-hole" aria-hidden>
      <span className="mini-hole-mound" />
    </span>
  );
}

function MatchPlay({ deal, title, onDone }: { deal: MatchDeal; title: string; onDone: () => void }) {
  const [up, setUp] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [lock, setLock] = useState(false);

  function tap(id: string) {
    if (lock || found.includes(id) || up.includes(id)) return;
    playTap();
    const next = [...up, id];
    if (next.length < 2) {
      setUp(next);
      return;
    }
    const a = deal.cards.find((c) => c.id === next[0]);
    const b = deal.cards.find((c) => c.id === next[1]);
    if (a && b && a.toy === b.toy) {
      const nextFound = [...found, a.id, b.id];
      setFound(nextFound);
      setUp([]);
      playCorrect();
      if (nextFound.length >= deal.cards.length) window.setTimeout(onDone, 450);
    } else {
      setUp(next);
      setLock(true);
      playWrong();
      window.setTimeout(() => {
        setUp([]);
        setLock(false);
      }, 500);
    }
  }

  return (
    <>
      <h1 className="mb-4 font-display text-2xl">{title}</h1>
      <div className="mini-grid-2">
        {deal.cards.map((c) => {
          const show = up.includes(c.id) || found.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className={cn("mini-tap", found.includes(c.id) && "mini-tap-good")}
              onClick={() => tap(c.id)}
              aria-label={show ? (squisheeById(c.toy)?.name ?? c.toy) : "card"}
            >
              {show ? <ToyFace id={c.toy} /> : <span className="font-display text-3xl text-faint">?</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

function WhoHidPlay({
  deal,
  title,
  onDone,
  startStage,
}: {
  deal: WhoHidDeal;
  title: string;
  onDone: () => void;
  startStage?: WhoHidStage;
}) {
  const ui = useUi();
  const [stage, setStage] = useState<WhoHidStage>(startStage ?? "remember");
  const [wrong, setWrong] = useState<string | null>(null);
  const [hit, setHit] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    if (startStage === "choose") return;
    const started = Date.now();
    const need = deal.shown.length;
    const tick = window.setInterval(() => {
      const waited = Date.now() - started;
      if (waited >= 2200 && (loaded >= need || waited >= 4000)) {
        setStage("choose");
        window.clearInterval(tick);
      }
    }, 80);
    return () => window.clearInterval(tick);
  }, [deal.shown.length, loaded, startStage]);

  function pick(id: string) {
    if (stage !== "choose" || locked) return;
    applyWhoHidPick(
      deal.missing,
      id,
      () => {
        setLocked(true);
        setHit(id);
        playCorrect();
        window.setTimeout(onDone, 650);
      },
      () => {
        setWrong(id);
        playWrong();
        window.setTimeout(() => setWrong(null), 420);
      },
    );
  }

  return (
    <>
      <h1 className="mb-4 font-display text-2xl">{stage === "remember" ? ui.rememberToys : title}</h1>
      {stage === "remember" ? (
        <div className="mini-taps" data-who-stage="remember">
          {deal.shown.map((id, i) => (
            <span key={`shown-${i}-${id}`} data-who-slot={`shown-${i}`} className="mini-tap">
              <ToyFace id={id} onLoad={() => setLoaded((n) => n + 1)} />
            </span>
          ))}
        </div>
      ) : (
        <div className="mini-taps" data-who-stage="choose" aria-label={title}>
          {deal.shown.map((id, i) => {
            const open = whoHidShowsFace("choose", id, hit);
            return (
              <button
                key={`choice-${i}-${id}`}
                data-who-slot={`choice-${i}`}
                data-who-hole={open ? "open" : "shut"}
                type="button"
                className={cn("mini-tap", wrong === id && "mini-tap-bad shake", hit === id && "mini-tap-good")}
                onClick={() => pick(id)}
                aria-label={open ? (squisheeById(id)?.name ?? id) : ui.hidingSpot(i + 1)}
              >
                <SquashOnPoke active={wrong === id || hit === id} className="grid h-full w-full place-items-center">
                  {open ? <ToyFace id={id} /> : <HideHole />}
                </SquashOnPoke>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function PokePlay({ deal, title, onDone }: { deal: PokeDeal; title: string; onDone: () => void }) {
  const [poke, setPoke] = useState<string | null>(null);
  const [miss, setMiss] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  function tap(id: string) {
    if (locked) return;
    setPoke(id);
    if (id === deal.target) {
      setLocked(true);
      playCorrect();
      window.setTimeout(onDone, 400);
    } else {
      setMiss(id);
      playWrong();
    }
  }

  return (
    <>
      <h1 className="mb-4 font-display text-2xl">{title}</h1>
      <div className="mini-taps">
        {deal.choices.map((id) => (
          <button
            key={id}
            type="button"
            className={cn("mini-tap", miss === id && "mini-tap-bad")}
            onClick={() => tap(id)}
            aria-label={squisheeById(id)?.name ?? id}
          >
            <SquashOnPoke
              active={poke === id}
              onRest={() => {
                setPoke(null);
                if (miss === id) setMiss(null);
              }}
            >
              <ToyFace id={id} />
            </SquashOnPoke>
          </button>
        ))}
      </div>
    </>
  );
}

function PeekPlay({ deal, title, onDone }: { deal: PeekDeal; title: string; onDone: () => void }) {
  const ui = useUi();
  const [hit, setHit] = useState(false);
  const [miss, setMiss] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  function tap(i: number) {
    if (locked) return;
    playTap();
    if (i === deal.peekIndex) {
      setLocked(true);
      setHit(true);
      playPeek();
      playCorrect();
      window.setTimeout(onDone, 550);
      return;
    }
    setMiss(i);
    playWrong();
    window.setTimeout(() => setMiss(null), 420);
  }

  return (
    <>
      <h1 className="mb-4 font-display text-2xl">{title}</h1>
      <div className="mini-grid-2" data-mini-peek="1">
        {Array.from({ length: deal.spots }, (_, i) => {
          const peeking = i === deal.peekIndex;
          const open = hit && peeking;
          return (
            <button
              key={`peek-${i}`}
              type="button"
              data-peek-spot={i}
              data-peeking={peeking ? "1" : "0"}
              className={cn("mini-tap", miss === i && "mini-tap-bad shake", open && "mini-tap-good")}
              onClick={() => tap(i)}
              aria-label={peeking ? (squisheeById(deal.peeker)?.name ?? title) : ui.hidingSpot(i + 1)}
            >
              {open ? (
                <ToyFace id={deal.peeker} />
              ) : peeking ? (
                <span className="mini-peek-wrap">
                  <HideHole />
                  <span className="mini-peek-face">
                    <ToyFace id={deal.peeker} />
                  </span>
                </span>
              ) : (
                <HideHole />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

function TwinPlay({ deal, title, onDone }: { deal: TwinDeal; title: string; onDone: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [miss, setMiss] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  function tap(id: string, toy: string) {
    if (locked || picked.includes(id)) return;
    playTap();
    if (toy !== deal.hopper) {
      setMiss(id);
      playWrong();
      window.setTimeout(() => setMiss(null), 420);
      return;
    }
    const next = [...picked, id];
    setPicked(next);
    if (next.length >= 2) {
      setLocked(true);
      playCorrect();
      window.setTimeout(onDone, 450);
    }
  }

  return (
    <>
      <h1 className="mb-4 font-display text-2xl">{title}</h1>
      <div className="mini-hopper-ref" data-twin-hopper={deal.hopper}>
        <ToyFace id={deal.hopper} />
      </div>
      <div className="mini-taps" data-mini-twin="1">
        {deal.cards.map((c) => {
          const open = picked.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              data-twin-card={c.id}
              className={cn("mini-tap", open && "mini-tap-good", miss === c.id && "mini-tap-bad shake")}
              onClick={() => tap(c.id, c.toy)}
              aria-label={open ? (squisheeById(c.toy)?.name ?? c.toy) : "silhouette"}
            >
              {open ? <ToyFace id={c.toy} /> : <ToySilhouette id={c.toy} />}
            </button>
          );
        })}
      </div>
    </>
  );
}

function HopPlay({ deal, title, onDone }: { deal: HopDeal; title: string; onDone: () => void }) {
  const [landed, setLanded] = useState(false);
  const [miss, setMiss] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  function tap(i: number) {
    if (locked) return;
    if (i === deal.target) {
      setLocked(true);
      setLanded(true);
      playHop(0, 1);
      playLand(0, 1);
      playCorrect();
      window.setTimeout(onDone, 500);
      return;
    }
    setMiss(i);
    playWrong();
    window.setTimeout(() => setMiss(null), 420);
  }

  return (
    <>
      <h1 className="mb-4 font-display text-2xl">{title}</h1>
      <div className="mini-hopper-ref" data-hop-piece={deal.hopper}>
        <ToyFace id={deal.hopper} />
      </div>
      <div className="mini-pads" data-mini-hop="1">
        {Array.from({ length: deal.pads }, (_, i) => {
          const glow = i === deal.target;
          return (
            <button
              key={`pad-${i}`}
              type="button"
              data-hop-pad={i}
              data-hop-glow={glow ? "1" : "0"}
              className={cn("mini-pad", glow && "mini-pad-glow", landed && glow && "mini-pad-land", miss === i && "shake")}
              onClick={() => tap(i)}
              aria-label={glow ? title : `pad ${i + 1}`}
            >
              {landed && glow ? <ToyFace id={deal.hopper} /> : null}
            </button>
          );
        })}
      </div>
    </>
  );
}
