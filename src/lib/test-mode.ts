// remove before publish
import { parsePathGrade, type PathGrade } from "./types";

/** Persist key on the device save. Delete with this module. */
export const TEST_MODE = "testMode";

export function parseTestMode(v: unknown): boolean {
  return v === true;
}

export function isTestMode(flag: unknown): boolean {
  return parseTestMode(flag);
}

/** Adjacent Lessons hops without a banked roll or leftover die steps. */
export function testFreeMove(flag: unknown): boolean {
  return isTestMode(flag);
}

/** Grade 4 preview is held unless Test mode is on. */
export function testAllowsGrade4(flag: unknown): boolean {
  return isTestMode(flag);
}

export function holdPathGrade(flag: unknown, pathGrade: PathGrade | unknown): PathGrade {
  return testAllowsGrade4(flag) ? parsePathGrade(pathGrade) : 3;
}
