import type { UnitDef } from "./types";

export type NodeStatus = "now" | "open";

export function unitStatus(unit: UnitDef, suggestedId: string): NodeStatus {
  return unit.id === suggestedId ? "now" : "open";
}

export function isUnitOpen(_unit?: UnitDef, _suggestedId?: string): boolean {
  return true;
}
