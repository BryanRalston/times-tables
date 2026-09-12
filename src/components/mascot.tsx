import { DressedSquishee } from "@/components/dressed-squishee";
import { wearList } from "@/lib/cosmetics";
import { pathHopperId } from "@/lib/squishees";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export type Pose = "wave" | "think" | "celebrate" | "oops" | "star";

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
  useProgress((s) => `${s.squishees.join("\0")}:${s.hopperId}:${wearList(s).join(",")}`);
  const owned = useProgress.getState().squishees;
  const chosen = useProgress.getState().hopperId;
  const cosmetic = wearList(useProgress.getState());
  const id = who === "rem" ? "owl" : pathHopperId(owned, chosen);
  const squash = hop || pose === "celebrate" || pose === "star";
  return (
    <DressedSquishee
      id={id}
      cosmetic={who === "rem" ? "" : cosmetic}
      className={cn(
        "pointer-events-none select-none",
        size === "sm" && "h-20 w-20",
        size === "md" && "h-32 w-32",
        size === "lg" && "h-44 w-44 sm:h-52 sm:w-52",
        squash && "squash",
        !squash && pose === "wave" && "idle-bob",
        className,
      )}
      imgClassName="h-full w-full object-contain"
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
