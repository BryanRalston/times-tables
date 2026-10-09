export function sheetHref(slug: string, query = ""): string {
  const base = import.meta.env.BASE_URL || "/times-tables/academy/";
  return `${base}worksheets/${slug}/${query}`;
}

export function squisheeUrl(file: string): string {
  return `/times-tables/squishees/${file}`;
}
