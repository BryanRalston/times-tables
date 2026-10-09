export function sheetHref(slug: string, query = ""): string {
  const base = import.meta.env.BASE_URL || "/times-tables/academy/";
  return `${base}worksheets/${slug}/${query}`;
}

export function squisheeUrl(file: string): string {
  return `/times-tables/squishees/${file}`;
}

/** Fitted outfit art lives with Squishee Math, not under the academy base URL. */
export function cosmeticCompositeUrl(face: string, cosmeticId: string): string {
  return `/times-tables/cosmetics/${face}-${cosmeticId}.png`;
}
