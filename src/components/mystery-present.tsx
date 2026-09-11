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
  return (
    <span
      className={cn(
        "mystery-present",
        size === "shelf" && "mystery-present-shelf",
        found && "mystery-present-found",
        opening && "mystery-present-open",
      )}
      data-mystery-present={state}
      aria-hidden
    >
      <span className="mystery-present-box" />
      <span className="mystery-present-ribbon" />
      <span className="mystery-present-lid" />
      <span className="mystery-present-bow" />
    </span>
  );
}
