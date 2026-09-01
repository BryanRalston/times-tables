import { useEffect, useMemo, useState } from "react";
import { MagentaImg } from "@/components/magenta-video";
import { SquashOnPoke } from "@/components/poke-toy";
import { dealMini, pickMiniKind, type MatchDeal, type PokeDeal, type WhoHidDeal } from "@/lib/minigames";
import { rngFromSeed } from "@/lib/rng";
import { playCorrect, playTap, playWrong } from "@/lib/sound";
import { squisheeById, squisheeSrc } from "@/lib/squishees";
import { cn } from "@/lib/utils";

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

function ToyFace({ id, className }: { id: string; className?: string }) {
  return <MagentaImg src={squisheeSrc(id)} alt="" className={cn("h-20 w-20 object-contain sm:h-24 sm:w-24", className)} />;
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
              className={cn(
                "grid min-h-24 place-items-center rounded-[20px] border p-2",
                found.includes(c.id) ? "border-good bg-good-soft" : "border-line bg-surface",
              )}
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

  useEffect(() => {
    const t = window.setTimeout(() => setRevealed(false), 1000);
    return () => window.clearTimeout(t);
  }, []);

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
        {deal.shown.map((id) => (
          <span
            key={id}
            className={cn(
              "grid h-24 w-24 place-items-center rounded-[20px] border border-line bg-surface",
              !revealed && id === deal.missing && "opacity-0",
            )}
          >
            <ToyFace id={id} />
          </span>
        ))}
      </div>
      {revealed ? null : (
        <div className="flex justify-center gap-3">
          {deal.choices.map((id) => (
            <button
              key={id}
              type="button"
              className={cn(
                "grid place-items-center rounded-[20px] border border-line bg-surface p-2",
                wrong === id && "border-bad",
              )}
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

  function tap(id: string) {
    setPoke(id);
    if (id === deal.target) {
      playCorrect();
      window.setTimeout(onDone, 400);
    } else {
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
            className="grid place-items-center rounded-[20px] border border-line bg-surface p-2"
            onClick={() => tap(id)}
            aria-label={squisheeById(id)?.name ?? id}
          >
            <SquashOnPoke active={poke === id} onRest={() => setPoke(null)}>
              <ToyFace id={id} />
            </SquashOnPoke>
          </button>
        ))}
      </div>
    </>
  );
}
