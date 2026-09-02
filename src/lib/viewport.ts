export const PHONE_MAX_PX = 767;

type Media = { matchMedia?: (q: string) => { matches: boolean }; innerWidth?: number };

export function isPhoneViewport(width?: number): boolean {
  if (typeof width === "number" && Number.isFinite(width)) return width <= PHONE_MAX_PX;
  const g = globalThis as typeof globalThis & Media;
  try {
    if (typeof g.matchMedia === "function") {
      return g.matchMedia(`(max-width: ${PHONE_MAX_PX}px)`).matches;
    }
    if (typeof g.innerWidth === "number") return g.innerWidth <= PHONE_MAX_PX;
  } catch {
    /* ignore */
  }
  return true;
}
