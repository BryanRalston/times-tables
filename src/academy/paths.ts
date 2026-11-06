export function sheetHref(slug: string, query = ""): string {
  const base = import.meta.env.BASE_URL || "/times-tables/academy/";
  return `${base}worksheets/${slug}/${query}`;
}

/**
 * Shared portraits, cosmetics, and wardrobe sit beside Squishee Math on GitHub
 * Pages (`/times-tables/...`). The domain build serves the same files at `/`.
 * Match `artPrefix` in vite.academy.config / academy-precache.
 */
export function artPrefix(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base === "/" || base === "" ? "" : "/times-tables";
}

export function squisheeUrl(file: string): string {
  return `${artPrefix()}/squishees/${file}`;
}

/** Poke clips and strips ship inside this build, under its base URL. */
export function squisheeMediaUrl(src: string): string {
  const file = src.split("?")[0]?.split("#")[0]?.split("/").pop() ?? "";
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}squishees/${file}`;
}

/** Fitted classic cosmetics. Domain root or `/times-tables` on Pages. */
export function cosmeticCompositeUrl(face: string, cosmeticId: string): string {
  return `${artPrefix()}/cosmetics/${face}-${cosmeticId}.png`;
}
