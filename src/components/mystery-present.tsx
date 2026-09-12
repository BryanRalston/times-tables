import { MagentaImg } from "@/components/magenta-video";
import { asset } from "@/lib/art";
import { PRESENT_BOX_FILE, PRESENT_OPEN_FILE } from "@/lib/presents";
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
  const state = found ? "found" : opening ? "open" : "1";
  const glow = size === "map" && !found && !opening;
  return (
    <span
      className={cn(
        "mystery-present",
        size === "shelf" && "mystery-present-shelf",
        found && "mystery-present-found",
        opening && "mystery-present-open",
      )}
      data-mystery-present={state}
      data-present-art="vinyl"
      aria-hidden
    >
      {glow ? <span className="mystery-present-glow" /> : null}
      <MagentaImg
        src={asset(found || opening ? PRESENT_OPEN_FILE : PRESENT_BOX_FILE)}
        alt=""
        className="mystery-present-art"
      />
    </span>
  );
}
