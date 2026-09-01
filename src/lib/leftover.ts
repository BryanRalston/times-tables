export function isLeftoverFrame(kind: string): boolean {
  return kind === "tenframe";
}

export function leftoverHoldMs(): number {
  return 2000;
}

/** CSS `.take-out` is 280ms; keypad stays closed until that why-move finishes. */
export function leftoverWhyMoveMs(): number {
  return 400;
}

export function leftoverPanelOpen(args: {
  kind: string;
  needsInteract?: boolean;
  interacted: boolean;
  status: "idle" | "correct" | "wrong";
}): boolean {
  if (!isLeftoverFrame(args.kind)) return true;
  if (args.status === "correct") return false;
  if (args.needsInteract && !args.interacted) return false;
  return true;
}

export function leftoverSkipOpen(args: {
  kind: string;
  needsInteract?: boolean;
  interacted: boolean;
  status: "idle" | "correct" | "wrong";
}): boolean {
  if (args.needsInteract && !args.interacted) return false;
  if (isLeftoverFrame(args.kind) && args.status !== "idle") return false;
  return true;
}

export function cardHeading(
  q: { kind: string; prompt: string; data?: unknown },
  interacted: boolean,
): string {
  if (q.kind !== "graph") return q.prompt;
  const d = (q.data ?? {}) as { collect?: boolean; readPrompt?: string };
  if (d.collect && !interacted) return q.prompt;
  if (d.collect && interacted && d.readPrompt) return d.readPrompt;
  return q.prompt;
}

export function splitCounted<T extends { key: string }>(
  items: T[],
  counted: Record<string, boolean>,
): { rest: T[]; pile: T[] } {
  const rest: T[] = [];
  const pile: T[] = [];
  for (const item of items) {
    if (counted[item.key]) pile.push(item);
    else rest.push(item);
  }
  return { rest, pile };
}
