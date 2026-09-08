import { unitById } from "./curriculum";
import type { UnitDef } from "./types";

export type NodeStatus = "now" | "open" | "locked";

export function unitStatus(unit: UnitDef, suggestedId: string): NodeStatus {
  if (unit.id === suggestedId) return "now";
  const suggested = unitById(suggestedId);
  if (suggested && unit.number > suggested.number) return "locked";
  return "open";
}

/** Lessons and unit pages stay open. The Home map may still mark later nodes locked. */
export function isUnitOpen(_unit?: UnitDef, _suggestedId?: string): boolean {
  return true;
}
