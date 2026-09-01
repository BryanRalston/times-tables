import { MagentaImg } from "@/components/magenta-video";
import { squisheeSrc } from "@/lib/squishees";
import { cn } from "@/lib/utils";

export type Pose = "wave" | "think" | "celebrate" | "oops" | "star";

const POSE_ID: Record<Pose, string> = {
  wave: "frog",
  think: "cat",
  celebrate: "panda",
  oops: "shark",
  star: "peach",
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
  const id = who === "rem" ? "owl" : POSE_ID[pose];
  const squash = hop || pose === "celebrate" || pose === "star";
  return (
    <MagentaImg
      src={squisheeSrc(id)}
      alt=""
      className={cn(
        "pointer-events-none select-none",
        size === "sm" && "h-20 w-20",
        size === "md" && "h-32 w-32",
        size === "lg" && "h-44 w-44 sm:h-52 sm:w-52",
        squash && "squash",
        !squash && pose === "wave" && "idle-bob",
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
