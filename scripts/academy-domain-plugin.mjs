import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { artPaths, domainServiceWorker } from "./academy-precache.mjs";
import { rewriteDomainSource } from "./academy-domain-rewrite.mjs";

const TEXT_EXT = new Set([".html", ".js", ".css", ".webmanifest", ".svg", ".json", ".txt"]);

function isAcademyModule(id) {
  const file = (id.split("?")[0] ?? "").replaceAll("\\", "/");
  return file.includes("/src/academy/");
}

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) walkFiles(file, out);
    else out.push(file);
  }
  return out;
}

function copyIfExists(src, dest) {
  if (!existsSync(src) || !statSync(src).isFile()) return;
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
}

function hoistIfNeeded(root) {
  const nested = join(root, "academy");
  if (!existsSync(nested)) return;
  for (const name of readdirSync(nested)) {
    cpSync(join(nested, name), join(root, name), { recursive: true });
  }
  rmSync(nested, { recursive: true, force: true });
}

function copyPortraits(root) {
  const srcDir = resolve("public/squishees");
  if (!existsSync(srcDir)) return;
  const destDir = join(root, "squishees");
  mkdirSync(destDir, { recursive: true });
  for (const name of readdirSync(srcDir)) {
    if (name.endsWith("-strip.png") || name.endsWith(".mp4")) continue;
    copyIfExists(join(srcDir, name), join(destDir, name));
  }
}

function copyReferencedPublic(root) {
  const publicRoot = resolve("public");
  const wanted = new Set();
  for (const file of walkFiles(root)) {
    if (!TEXT_EXT.has(extname(file))) continue;
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/\/(?:squishees|money|art)\/[A-Za-z0-9._/-]+/g)) {
      wanted.add(match[0].slice(1));
    }
  }
  for (const rel of wanted) {
    if (rel.includes("..")) continue;
    copyIfExists(join(publicRoot, rel), join(root, rel));
  }
}

function rewriteTree(root) {
  for (const file of walkFiles(root)) {
    if (!TEXT_EXT.has(extname(file))) continue;
    const raw = readFileSync(file, "utf8");
    const next = rewriteDomainSource(raw);
    if (next !== raw) writeFileSync(file, next);
  }
}

function publishRoot(outDir) {
  const root = resolve(outDir);
  hoistIfNeeded(root);
  rewriteTree(root);
  copyPortraits(root);
  const money = resolve("public/money");
  if (existsSync(money)) cpSync(money, join(root, "money"), { recursive: true });
  copyIfExists(resolve("public/favicon.svg"), join(root, "favicon.svg"));
  const publicRoot = resolve("public");
  for (const rel of artPaths()) copyIfExists(join(publicRoot, rel), join(root, rel));
  copyReferencedPublic(root);
  writeFileSync(join(root, "academy-sw.js"), domainServiceWorker());
  writeFileSync(join(root, "CNAME"), "squisheeacademy.com\n");
  writeFileSync(join(root, ".nojekyll"), "");
  const index = join(root, "index.html");
  if (existsSync(index)) cpSync(index, join(root, "404.html"));
}

export function academyDomainPlugins(outDir) {
  return [
    {
      name: "academy-domain-root",
      transform(code, id) {
        if (!isAcademyModule(id)) return null;
        const next = rewriteDomainSource(code);
        return next === code ? null : next;
      },
      transformIndexHtml(html) {
        return rewriteDomainSource(html);
      },
      writeBundle() {
        publishRoot(outDir);
      },
    },
  ];
}
