import { show, t } from "../i18n";
import type { Child } from "../model";
import { bossStoneState, levelStones, roundsToBoss, type Stone } from "../stones";
import { AcademyPal, cx, LockIcon } from "./bits";

type StonesKid = Pick<Child, "grade" | "levels" | "skills" | "challengeAhead" | "tiers" | "journey" | "avatarId" | "equipped">;

const DONE = () => t("Done", "Hecho", "Feito", "Fini", "完成", "पूरा", "تم");

function stoneAria(stone: Stone): string {
  const name = `${show("Level")} ${stone.num}, ${show(stone.label)}`;
  if (stone.state === "done") return `${name}. ${DONE()}`;
  if (stone.state === "now") return `${name}. ${show("You are here")}`;
  if (stone.state === "locked") return `${name}. ${show("Locked")}`;
  return name;
}

function bossWord(): string {
  return t("Boss", "Jefe", "Chefe", "Chef", "大魔王", "बॉस", "الزعيم");
}

function roundsLeftText(n: number): string {
  return n === 1
    ? show("1 more round to the boss")
    : t(`${n} more rounds to the boss`, `${n} rondas más para el jefe`, `Mais ${n} rodadas até o chefe`, `Encore ${n} manches avant le chef`, `再玩${n}轮就见大魔王`, `बॉस तक ${n} और राउंड`, `${n} جولات أخرى حتى الزعيم`);
}

/**
 * ONE path per game: its grade-open levels in order, ending in the Boss star.
 * Only one "you are here": the buddy sits on the current level, or on the Boss
 * stone once the boss is ready. Sits in the page flow, never over art or the
 * game. Flex order follows the page direction, so Arabic mirrors right to left.
 */
export function LevelStones({
  child,
  gameId,
  onPick,
  onBoss,
  open = true,
  here = false,
  className,
}: {
  child: StonesKid;
  gameId: string;
  onPick?: (level: string) => void;
  /** Tap the Boss stone when it is ready. */
  onBoss?: () => void;
  /** The island is unlocked. Locked islands show every stone locked. */
  open?: boolean;
  /** This is the island you stand on: the buddy shows on the path. */
  here?: boolean;
  className?: string;
}) {
  const levels = levelStones(child, gameId);
  if (levels.length === 0) return null;
  const stones = open ? levels : levels.map((stone) => ({ ...stone, state: "locked" as const }));
  const boss = open ? bossStoneState(child.journey, gameId, child.grade) : "locked";
  const bossNow = boss === "now";
  const left = open && here ? roundsToBoss(child.journey, gameId, child.grade) : 0;
  return (
    <div className={cx("ac-path", className)}>
      <ol className="ac-lvstones" aria-label={show("Levels")} data-game={gameId}>
        {stones.map((stone) => {
          // When the boss is ready the buddy moves to the Boss stone.
          const state = stone.state === "now" && bossNow ? "open" : stone.state;
          const buddy = state === "now" && here;
          return (
            <li key={stone.level} className={cx("ac-lvstone", `is-${state}`, buddy && "has-you")} data-level={stone.level} data-state={state}>
              <button
                type="button"
                disabled={state === "locked" || !onPick}
                aria-current={state === "now" ? "step" : undefined}
                aria-label={stoneAria({ ...stone, state })}
                onClick={() => onPick?.(stone.level)}
              >
                {buddy ? (
                  <AcademyPal id={child.avatarId} cosmetic={child.equipped} className="ac-lvstone-you" />
                ) : state === "locked" ? (
                  <LockIcon />
                ) : state === "done" ? (
                  "✓"
                ) : (
                  stone.num
                )}
              </button>
            </li>
          );
        })}
        <li className={cx("ac-lvstone", "is-boss", `is-${boss}`, bossNow && here && "has-you")} data-level="boss" data-state={boss}>
          <button
            type="button"
            disabled={!bossNow || !onBoss}
            aria-current={bossNow ? "step" : undefined}
            aria-label={`${bossWord()}. ${boss === "done" ? DONE() : bossNow ? show("You are here") : show("Locked")}`}
            onClick={() => onBoss?.()}
          >
            {bossNow && here ? <AcademyPal id={child.avatarId} cosmetic={child.equipped} className="ac-lvstone-you" /> : "★"}
          </button>
        </li>
      </ol>
      {left > 0 ? <p className="ac-lvstone-cap">{roundsLeftText(left)}</p> : null}
    </div>
  );
}
