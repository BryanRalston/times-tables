import { useEffect, useMemo, useState } from "react";
import { MagentaImg } from "@/components/magenta-video";
import { SquashOnPoke } from "@/components/poke-toy";
import { dealMini, pickMiniKind, type MatchDeal, type PokeDeal, type WhoHidDeal } from "@/lib/minigames";
import { rngFromSeed } from "@/lib/rng";
import { playCorrect, playTap, playWrong } from "@/lib/sound";
import { squisheeById, squisheeSrc } from "@/lib/squishees";
import { cn } from "@/lib/utils";

const TAP = "grid min-h-[96px] min-w-[96px] max-h-[112px] max-w-[112px] place-items-center overflow-hidden rounded-[20px] border p-2";

export function MiniGame({
  seed,
  owned,
  skipLabel,
  pokePrompt,
  whoHidLabel,
  matchLabel,
  onDone,
}: {
  seed: string;
  owned: string[];
  skipLabel: string;
  pokePrompt: (name: string) => string;
  whoHidLabel: string;
  matchLabel: string;
  onDone: () => void;
}) {
  const kind = useMemo(() => pickMiniKind(seed), [seed]);
  const deal = useMemo(() => dealMini(kind, owned, rngFromSeed(`${seed}:deal`)), [kind, owned, seed]);

  return (
    <div className="mx-auto grid min-h-dvh max-w-lg place-items-center px-4 py-8">
      <div className="w-full text-center">
        {deal.kind === "match" ? (
          <MatchPlay deal={deal} title={matchLabel} onDone={onDone} />
        ) : deal.kind === "who-hid" ? (
          <WhoHidPlay deal={deal} title={whoHidLabel} onDone={onDone} />
        ) : (
          <PokePlay deal={deal} title={pokePrompt(squisheeById(deal.target)?.name ?? deal.target)} onDone={onDone} />
        )}
        <button type="button" className="mt-6 text-sm text-faint" onClick={onDone}>
          {skipLabel}
        </button>
      </div>
    </div>
  );
}

function ToyFace({ id, className, onLoad }: { id: string; className?: string; onLoad?: () => void }) {
  return (
    <span className={cn("inline-grid h-20 w-20 place-items-center overflow-hidden sm:h-24 sm:w-24", className)}>
      <MagentaImg
        src={squisheeSrc(id)}
        alt=""
        className="h-full w-full object-contain"
        onLoad={onLoad}
      />
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
      <div className="mx-auto grid max-w-xs grid-cols-2 gap-3">
        {deal.cards.map((c) => {
          const show = up.includes(c.id) || found.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className={cn(TAP, found.includes(c.id) ? "border-good bg-good-soft" : "border-line bg-surface")}
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

function WhoHidPlay({ deal, title, onDone }: { deal: WhoHidDeal; title: string; onDone: () => void }) {
  const [revealed, setRevealed] = useState(true);
  const [wrong, setWrong] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const need = deal.shown.length;
    const tick = window.setInterval(() => {
      const waited = Date.now() - started;
      if (waited >= 2200 && (loaded >= need || waited >= 4000)) {
        setRevealed(false);
        window.clearInterval(tick);
      }
    }, 80);
    return () => window.clearInterval(tick);
  }, [deal.shown.length, loaded]);

  function pick(id: string) {
    if (revealed) return;
    if (id === deal.missing) {
      playCorrect();
      window.setTimeout(onDone, 350);
    } else {
      setWrong(id);
      playWrong();
    }
  }

  return (
    <>
      <h1 className="mb-4 font-display text-2xl">{title}</h1>
      <div className="mb-5 flex justify-center gap-3">
        {deal.shown.map((id) =>
          !revealed && id === deal.missing ? (
            <span
              key={id}
              className="grid min-h-[96px] min-w-[96px] place-items-center rounded-[20px] border border-dashed border-line bg-bg-warm"
              aria-hidden
            />
          ) : (
            <span key={id} className={cn(TAP, "border-line bg-surface")}>
              <ToyFace id={id} onLoad={() => setLoaded((n) => n + 1)} />
            </span>
          ),
        )}
      </div>
      {revealed ? null : (
        <div className="flex justify-center gap-3">
          {deal.choices.map((id) => (
            <button
              key={id}
              type="button"
              className={cn(TAP, "border-line bg-surface", wrong === id && "border-bad")}
              onClick={() => pick(id)}
              aria-label={squisheeById(id)?.name ?? id}
            >
              <SquashOnPoke active={wrong === id} onRest={() => setWrong(null)}>
                <ToyFace id={id} />
              </SquashOnPoke>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function PokePlay({ deal, title, onDone }: { deal: PokeDeal; title: string; onDone: () => void }) {
  const [poke, setPoke] = useState<string | null>(null);
  const [miss, setMiss] = useState<string | null>(null);

  function tap(id: string) {
    setPoke(id);
    if (id === deal.target) {
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
      <div className="flex justify-center gap-3">
        {deal.choices.map((id) => (
          <button
            key={id}
            type="button"
            className={cn(TAP, "border-line bg-surface", miss === id && "border-bad")}
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
