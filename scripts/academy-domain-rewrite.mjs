/** Rewrite Academy root-relative /times-tables/ URLs for the squisheeacademy.com build. */
export function rewriteDomainSource(code) {
  return code
    .replaceAll("https://bryanralston.github.io/times-tables/academy/", "https://squisheeacademy.com/")
    .replaceAll("/times-tables/academy/", "/")
    .replace(/(?<![\w.])\/times-tables\//g, "/");
}

export function hasRootTimesTablesPath(code) {
  return /(?<![\w.])\/times-tables\//.test(code);
}
