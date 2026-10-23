/** Cookieless page-view counter for the squisheeacademy.com build only. */

export const GOATCOUNTER_SRC = "//gc.zgo.at/count.js";
export const GOATCOUNTER_ENDPOINT = "https://squisheeacademy.goatcounter.com/count";

/**
 * Loads the GoatCounter snippet only when the browser is not asking to opt out.
 * The script is async and created after the check, so a blocked or offline host
 * fails quietly and does not hold up the page.
 */
export function visitorCounterScript(): string {
  return `<script>
(function () {
  try {
    var nav = navigator;
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl === true) return;
    var el = document.createElement("script");
    el.async = true;
    el.src = ${JSON.stringify(GOATCOUNTER_SRC)};
    el.setAttribute("data-goatcounter", ${JSON.stringify(GOATCOUNTER_ENDPOINT)});
    document.head.appendChild(el);
  } catch (e) {}
})();
</script>`;
}

/** Insert the loader once, before </body>. Files that are not documents are left alone. */
export function withVisitorCounter(html: string): string {
  if (!html.includes("</body>")) return html;
  if (html.includes(GOATCOUNTER_SRC)) return html;
  return html.replace("</body>", `${visitorCounterScript()}\n</body>`);
}
