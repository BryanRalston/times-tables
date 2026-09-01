import { ART } from "@/lib/art";
import { cn } from "@/lib/utils";

export type Pose = "wave" | "think" | "celebrate" | "oops" | "star";

const NIX: Record<Pose, string> = {
  wave: ART.nixWave,
  think: ART.nixThink,
  celebrate: ART.nixCelebrate,
  oops: ART.nixOops,
  star: ART.nixStar,
};

export function Mascot({
  who = "nix",
  pose = "wave",
  hop = false,
  size = "md",
  className,
}: {
  who?: "nix" | "rem";
  pose?: Pose;
  hop?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const src = who === "rem" ? (pose === "celebrate" || pose === "star" ? ART.remCelebrate : ART.remIdle) : NIX[pose];
  const label = who === "rem" ? "Rem" : "Nix";
  return (
    <img
      src={src}
      alt={label}
      draggable={false}
      className={cn(
        "pointer-events-none select-none object-contain",
        size === "sm" && "h-20 w-20",
        size === "md" && "h-32 w-32",
        size === "lg" && "h-44 w-44 sm:h-52 sm:w-52",
        hop && "hop",
        !hop && pose === "wave" && "idle-bob",
        className,
      )}
    />
  );
}

export function StarPop({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="star-pop pointer-events-none absolute -right-2 top-0 text-2xl text-star" aria-hidden>
      ★
    </span>
  );
}
