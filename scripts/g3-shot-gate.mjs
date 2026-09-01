import { existsSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve("scripts/playtest-out/boards");

const ACTIVITIES = [
  "welcome",
  "u1-leftover",
  "u1-friends",
  "u1-coins",
  "u1-tally",
  "u1-graph",
  "u2-place",
  "u2-word",
  "u2-build",
  "u2-expanded",
  "u2-compare",
  "u2-order",
  "u3-groups",
  "u3-jumps",
  "u3-array",
  "u3-factor",
  "u3-share",
  "u3-family",
  "u4-name",
  "u4-sides",
  "u4-vs",
  "u4-attr",
  "u4-combine",
  "u4-subdivide",
  "u5-name",
  "u5-line",
  "u5-unit",
  "u5-leftover",
  "u5-mixed",
  "u5-set",
  "u6-facts",
  "u6-array",
  "u6-factor",
  "u6-skip",
  "u6-picto",
  "u7-add",
  "u7-take",
  "u7-compare",
  "u7-estimate",
  "u7-exact",
  "u7-pattern",
  "u7-bar",
  "u8-length",
  "u8-mass",
  "u8-volume",
  "u8-unit",
  "u8-area",
  "u8-peri",
  "u8-missing",
  "u9-groups",
  "u9-array",
  "u9-factor",
  "u9-family",
  "u9-mix",
  "u10-equiv",
  "u10-compare",
  "u10-bench",
  "u10-order",
  "u10-line",
  "u11-clock",
  "u11-match",
  "u11-elapsed",
  "u11-count",
  "u11-compare",
  "u11-make",
  "u11-change",
  "u12-six",
  "u12-mix",
  "u12-factor",
  "u12-family",
  "u12-array",
  "u13-two",
  "u13-compute",
  "u13-pattern",
  "u13-measure",
  "u13-area",
];

const extra = ["home", "lessons", "shelf", "grownup", "mini-match", "mini-who-hid", "mini-poke"];

const missing = [];
for (const vp of ["phone", "desk"]) {
  for (const id of [...ACTIVITIES, ...extra]) {
    const p = resolve(dir, `${vp}-${id}.png`);
    if (!existsSync(p)) missing.push(`${vp}-${id}.png`);
  }
}
if (!existsSync(resolve(dir, "measure.json"))) missing.push("measure.json");

if (missing.length) {
  console.error("test:shots FAIL missing", missing.length);
  for (const m of missing.slice(0, 40)) console.error(" ", m);
  process.exit(1);
}
console.log(`test:shots OK ${ACTIVITIES.length} activities + chrome/minis, both viewports`);
