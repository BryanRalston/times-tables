import { asset } from "@/lib/art";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function MysteryPresent({
  found = false,
  opening = false,
  size = "map",
}: {
  found?: boolean;
  opening?: boolean;
  size?: "map" | "shelf";
}) {
  const soundOn = useProgress((s) => s.soundOn !== false);
  const state = found ? "found" : opening ? "open" : "1";
  return (
    <span
      className={cn(
        "mystery-present",
        size === "shelf" && "mystery-present-shelf",
        found && "mystery-present-found",
        opening && "mystery-present-open",
        !found && !opening && soundOn && "mystery-present-live",
      )}
      data-mystery-present={state}
      data-present-art="vinyl"
      aria-hidden
    >
      <span className="mystery-present-glow" />
      <img
        className="mystery-present-art"
        src={asset("art/mystery-gift.png")}
        alt=""
        decoding="async"
        draggable={false}
      />
    </span>
  );
}
