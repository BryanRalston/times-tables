import { squisheeById } from "@/lib/squishees";
import type { Board } from "../games/boards";
import type { Visual } from "../games/types";
import type { RoundSlot } from "../round-flow";

function nameOf(id: string, fallback: string): string {
  return squisheeById(id)?.name ?? fallback;
}

export function storyLine(visual: Visual, buddyId: string, hostId: string): string {
  const buddy = nameOf(buddyId, "Peach");
  const host = nameOf(hostId, "Panda");
  switch (visual.kind) {
    case "times":
      return `${host} sets out ${visual.a} groups of ${visual.b} squishees. How many?`;
    case "add":
      if (visual.op === "+") {
        return `${buddy} has ${visual.pink} squishees. ${host} brings ${visual.teal} more. How many in all?`;
      }
      return `${buddy} has ${visual.pink + visual.teal} squishees and shares ${visual.teal} with ${host}. How many are left?`;
    case "time":
      return `${host} checks the clock. What time is it?`;
    case "money":
      if (visual.mode === "name") return `${host} holds up a coin. What coin is it?`;
      if (visual.mode === "change") return `${buddy} pays ${host}. How much change is left?`;
      if (visual.mode === "make") return `${buddy} and ${host} make the amount with coins.`;
      return `${buddy} and ${host} share the coins. How much do they have?`;
    case "sight":
      return `${host} and ${buddy} read a word together. What does it say?`;
    case "spell":
      return `${buddy} helps ${host} spell the word.`;
    case "scene":
      return sceneStory(visual.board, buddy, host);
    default: {
      const neverVisual: never = visual;
      return neverVisual;
    }
  }
}

function sceneStory(board: Board, buddy: string, host: string): string {
  switch (board.game) {
    case "count":
      return `${buddy} and ${host} count together.`;
    case "place":
      return `${host} sets out base-ten blocks. What number is that?`;
    case "shapes":
      return `${host} holds up a shape. What shape is it?`;
    case "fractions":
      return `${buddy} and ${host} share a shape. What fraction is that?`;
    case "measure":
      return `${host} measures with ${buddy}. How long is it?`;
    case "phonics":
      return `${host} says a sound for ${buddy}. What do you hear?`;
    case "problems":
      return `${buddy} and ${host} solve a story.`;
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

export function slotStory(slot: RoundSlot, buddyId: string, hostId: string): string {
  const buddy = nameOf(buddyId, "Peach");
  const host = nameOf(hostId, "Panda");
  switch (slot.kind) {
    case "choice":
      return storyLine(slot.question.visual, buddyId, hostId);
    case "clock":
      return `${host} checks the clock. What time is it?`;
    case "pay":
      return `${buddy} and ${host} share the coins. How much do they have?`;
    default: {
      const neverSlot: never = slot;
      return neverSlot;
    }
  }
}
