import { bossPhaseLabel, type BossPhase } from "../boss-battle";
import type { IslandBoss } from "../bosses";
import { BossFigure, type BossMood } from "./boss-figure";
import { SquisheeImg, cx } from "./bits";

export function BossIntro({ boss, crown, onStart }: { boss: IslandBoss; crown: boolean; onStart: () => void }) {
  return (
    <div className="ac-boss-intro" role="dialog" aria-label={`${boss.name} appears`} data-boss-intro={boss.gameId}>
      <p className="ac-boss-kicker">{crown ? "Gold Crown rematch" : "Boss battle"}</p>
      <BossFigure face={boss.face} look={boss.look} mood="arrive" crown={crown} name={boss.name} size="hero" />
      <p className="ac-boss-banner">{boss.name}</p>
      <p className="ac-boss-taunt">{boss.taunt}</p>
      <button type="button" className="ac-go" onClick={onStart}>
        Let's play
      </button>
    </div>
  );
}

export function BossHud({
  boss,
  energy,
  maxEnergy,
  mood,
  buddyId,
  phase,
  crown,
}: {
  boss: IslandBoss;
  energy: number;
  maxEnergy: number;
  mood: BossMood;
  buddyId: string;
  phase: BossPhase;
  crown: boolean;
}) {
  const pct = maxEnergy <= 0 ? 0 : Math.max(0, Math.min(1, energy / maxEnergy));
  return (
    <div className="ac-boss-hud" data-boss-hud={boss.gameId} data-boss-phase={phase} data-boss-energy={energy}>
      <div
        className="ac-boss-meter"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={maxEnergy}
        aria-valuenow={energy}
        aria-label={`${boss.name} energy`}
      >
        <span style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="ac-boss-row">
        <SquisheeImg id={buddyId} className={cx("ac-buddy", (mood === "hit" || mood === "dizzy") && "is-attack")} label="" />
        <BossFigure face={boss.face} look={boss.look} mood={mood} crown={crown} name="" size="fight" />
      </div>
      {phase === "rally" ? null : <p className={cx("ac-phase-banner", phase === "super" && "is-super")}>{bossPhaseLabel(phase)}</p>}
    </div>
  );
}
