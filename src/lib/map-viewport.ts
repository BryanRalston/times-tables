/** 16:9 locked radial-web art. */
export const MAP_ART_ASPECT = 16 / 9;

/** Pinch-in ceiling. Floor is cover (scale 1) so the column stays filled. */
export const MAP_PINCH_MIN = 1;
export const MAP_PINCH_MAX = 2.5;

export type MapView = { width: number; height: number };

export type MapBoard = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type MapCamera = { scale: number; x: number; y: number };

export const REST_MAP_CAMERA: MapCamera = { scale: 1, x: 0, y: 0 };

/**
 * Cover-fit the 16:9 board into `view`. Phone columns are taller than 16:9,
 * so this height-fills and overflows east/west (pinch-pan shows the rest).
 */
export function coverMapBoard(view: MapView, artAspect = MAP_ART_ASPECT): MapBoard {
  const width = Math.max(0, view.width);
  const height = Math.max(0, view.height);
  if (width <= 0 || height <= 0) return { left: 0, top: 0, width: 0, height: 0 };
  const viewAspect = width / height;
  if (viewAspect >= artAspect) {
    const h = width / artAspect;
    return { left: 0, top: (height - h) / 2, width, height: h };
  }
  const w = height * artAspect;
  return { left: (width - w) / 2, top: 0, width: w, height };
}

/**
 * Letterbox the 16:9 board into `view`. Tablet / desktop leftover is often
 * taller than 16:9 after the card grows to the dock — this keeps the rim
 * and portals on-screen with no pinch-pan.
 */
export function containMapBoard(view: MapView, artAspect = MAP_ART_ASPECT): MapBoard {
  const width = Math.max(0, view.width);
  const height = Math.max(0, view.height);
  if (width <= 0 || height <= 0) return { left: 0, top: 0, width: 0, height: 0 };
  const viewAspect = width / height;
  if (viewAspect >= artAspect) {
    const w = height * artAspect;
    return { left: (width - w) / 2, top: 0, width: w, height };
  }
  const h = width / artAspect;
  return { left: 0, top: (height - h) / 2, width, height: h };
}

export function clampMapScale(scale: number): number {
  if (!Number.isFinite(scale)) return MAP_PINCH_MIN;
  return Math.min(MAP_PINCH_MAX, Math.max(MAP_PINCH_MIN, scale));
}

/**
 * Keep the scaled board covering `view`. Origin is the view center — the
 * same point CSS `translate(-50%, -50%)` uses on `.candy-world-stage`.
 */
export function clampMapCamera(cam: MapCamera, view: MapView, board: MapBoard): MapCamera {
  const scale = clampMapScale(cam.scale);
  const sw = board.width * scale;
  const sh = board.height * scale;
  const maxX = Math.max(0, (sw - view.width) / 2);
  const maxY = Math.max(0, (sh - view.height) / 2);
  const x = Number.isFinite(cam.x) ? Math.min(maxX, Math.max(-maxX, cam.x)) : 0;
  const y = Number.isFinite(cam.y) ? Math.min(maxY, Math.max(-maxY, cam.y)) : 0;
  return { scale, x, y };
}

/**
 * Zoom about a view-space focus (pixels from the view center) so the grass
 * under a pinch stays put.
 */
export function zoomMapCamera(cam: MapCamera, focus: { x: number; y: number }, nextScale: number): MapCamera {
  const scale = clampMapScale(nextScale);
  if (cam.scale <= 0) return { scale, x: cam.x, y: cam.y };
  const k = scale / cam.scale;
  return {
    scale,
    x: focus.x - (focus.x - cam.x) * k,
    y: focus.y - (focus.y - cam.y) * k,
  };
}

export function pointerDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function pointerMid(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
