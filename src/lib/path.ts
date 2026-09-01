import { unitById } from "./curriculum";
import type { UnitDef } from "./types";

export type NodeStatus = "today" | "open" | "locked";

export function unitStatus(unit: UnitDef, suggestedId: string): NodeStatus {
  if (unit.id === suggestedId) return "today";
  const sug = unitById(suggestedId);
  if (!sug) return unit.number <= 1 ? "open" : "locked";
  return unit.number < sug.number ? "open" : "locked";
}

export function isUnitOpen(unit: UnitDef, suggestedId: string): boolean {
  return unitStatus(unit, suggestedId) !== "locked";
}
