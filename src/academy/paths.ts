export function sheetHref(slug: string, query = ""): string {
  const base = import.meta.env.BASE_URL || "/times-tables/academy/";
  return `${base}worksheets/${slug}/${query}`;
}

export function squisheeUrl(file: string): string {
  return `/times-tables/squishees/${file}`;
}

/** Poke clips and strips sit beside the portraits. Academy's base URL does not host them. */
export function squisheeMediaUrl(src: string): string {
  const file = src.split("?")[0]?.split("#")[0]?.split("/").pop() ?? "";
  return squisheeUrl(file);
}

/** Fitted outfit art lives with Squishee Math, not under the academy base URL. */
export function cosmeticCompositeUrl(face: string, cosmeticId: string): string {
  return `/times-tables/cosmetics/${face}-${cosmeticId}.png`;
}
