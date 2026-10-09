import { personaOf } from "./persona";

export type BuddyPhase = "ask" | "teach" | "practice" | "feedback" | "done";
export type BuddyMood = "idle" | "cheer" | "hint" | "oops" | "dance";
export type BuddyPoint = "hint" | "example" | null;
export type BuddyLine = "cheer" | "hint" | "miss" | "dance" | "turn" | "ready" | "streak" | "count" | "work";

export interface BuddyCue {
  phase: BuddyPhase;
  ok: boolean;
  stars: number;
  hintOn: boolean;
  /** Correct answers in a row. Three or more is a streak celebration. */
  combo?: number;
  /** This card is something the buddy can count along with. */
  counting?: boolean;
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
      return { mood: "oops", point: "example", line: "work" };
    case "feedback":
      if (cue.ok && (cue.combo ?? 0) >= 3) return { mood: "dance", point: null, line: "streak" };
      return cue.ok
        ? { mood: "cheer", point: null, line: "cheer" }
        : { mood: "oops", point: "hint", line: "miss" };
    case "practice":
      return cue.hintOn
        ? { mood: "hint", point: "hint", line: "hint" }
        : { mood: "hint", point: "example", line: "turn" };
    case "ask":
      if (cue.hintOn) return { mood: "hint", point: "hint", line: "hint" };
      if ((cue.combo ?? 0) >= 3) return { mood: "cheer", point: null, line: "streak" };
      if (cue.counting) return { mood: "hint", point: null, line: "count" };
      return { mood: "idle", point: null, line: "ready" };
    default: {
      const neverPhase: never = cue.phase;
      return neverPhase;
    }
  }
}

export function bubbleText(line: BuddyLine, id: string): string {
  const persona = personaOf(id);
  switch (line) {
    case "cheer":
      return persona.line;
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
    case "streak":
      return persona.streak;
    case "count":
      return persona.count;
    case "work":
      return persona.work;
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
