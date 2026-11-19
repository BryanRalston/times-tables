/**
 * When a new card appears, its answers must be on screen. Cards start at the top. If the
 * answer tiles, letter tiles, or Check button still end below the screen (a very small
 * phone, big text), the page scrolls just far enough to show them. If the answers
 * themselves are taller than the screen, the first answer lines up near the top.
 */

/** What can be tapped to answer a card. */
export const ANSWER_TARGETS =
  ".ac-stage-main .ac-choices button, .ac-stage-main .ac-tile, .ac-stage-main .ac-slot, .ac-stage-main .ac-check, .ac-stage-main .ac-cookie-bank, .ac-stage-main .ac-plate, .ac-stage-main .ac-graph-token, .ac-stage-main .ac-hands-layout button";

export interface Box {
  top: number;
  bottom: number;
}

/**
 * How far to scroll down (in px) so every answer box fits in a viewport of `height`.
 * Boxes are in page coordinates. Returns the current scroll when nothing needs to move.
 */
export function scrollToShow(answers: readonly Box[], height: number, scrollY: number, margin = 12): number {
  if (answers.length === 0 || height <= 0) return scrollY;
  const bottom = Math.max(...answers.map((box) => box.bottom));
  const top = Math.min(...answers.map((box) => box.top));
  if (bottom + margin <= scrollY + height && top >= scrollY) return scrollY;
  const want = Math.min(bottom + margin - height, top - margin);
  return Math.max(0, Math.round(want));
}

/** Scrolls the page so the current card's answers are in view. Safe to call any time. */
export function revealAnswers(doc: Document = document): void {
  const win = doc.defaultView;
  if (!win) return;
  const boxes: Box[] = [];
  for (const el of doc.querySelectorAll<HTMLElement>(ANSWER_TARGETS)) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    boxes.push({ top: rect.top + win.scrollY, bottom: rect.bottom + win.scrollY });
  }
  const next = scrollToShow(boxes, win.innerHeight, win.scrollY);
  if (Math.abs(next - win.scrollY) > 1) win.scrollTo({ top: next, behavior: "auto" });
}
