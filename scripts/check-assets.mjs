import { spawnSync } from "node:child_process";

const bins = process.platform === "win32" ? ["python", "py", "python3"] : ["python3", "python"];
for (const bin of bins) {
  const r = spawnSync(bin, ["scripts/check-assets.py"], { stdio: "inherit" });
  if (r.error) continue;
  process.exit(r.status ?? 1);
}
console.error("python not found");
process.exit(1);
