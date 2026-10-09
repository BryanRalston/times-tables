export type BuddyPhase = "ask" | "teach" | "practice" | "feedback" | "done";
export type BuddyMood = "idle" | "cheer" | "hint" | "oops" | "dance";
export type BuddyPoint = "hint" | "example" | null;
export type BuddyLine = "cheer" | "hint" | "miss" | "dance" | "turn" | "ready";

export interface BuddyCue {
  phase: BuddyPhase;
  ok: boolean;
  stars: number;
  hintOn: boolean;
}

export interface BuddyReaction {
  mood: BuddyMood;
  point: BuddyPoint;
  line: BuddyLine;
}

export function buddyReaction(cue: BuddyCue): BuddyReaction {
  switch (cue.phase) {
    case "done":
      return cue.stars >= 3
        ? { mood: "dance", point: null, line: "dance" }
        : { mood: "cheer", point: null, line: "cheer" };
    case "teach":
      return { mood: "oops", point: "example", line: "miss" };
    case "feedback":
      return cue.ok
        ? { mood: "cheer", point: null, line: "cheer" }
        : { mood: "oops", point: "hint", line: "miss" };
    case "practice":
      return cue.hintOn
        ? { mood: "hint", point: "hint", line: "hint" }
        : { mood: "hint", point: "example", line: "turn" };
    case "ask":
      return cue.hintOn
        ? { mood: "hint", point: "hint", line: "hint" }
        : { mood: "idle", point: null, line: "ready" };
    default: {
      const neverPhase: never = cue.phase;
      return neverPhase;
    }
  }
}

export function bubbleText(line: BuddyLine, catchphrase: string): string {
  switch (line) {
    case "cheer":
      return catchphrase;
    case "hint":
      return "The hint can help.";
    case "miss":
      return "Let's look together.";
    case "dance":
      return "Three stars!";
    case "turn":
      return "Your turn!";
    case "ready":
      return "";
    default: {
      const neverLine: never = line;
      return neverLine;
    }
  }
}

/** Reduced motion keeps the pose and skips the dance. */
export function buddyMotion(reduced: boolean): "reduce" | "ok" {
  return reduced ? "reduce" : "ok";
}
