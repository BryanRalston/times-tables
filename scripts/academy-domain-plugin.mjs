import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { rewriteDomainSource } from "./academy-domain-rewrite.mjs";

const TEXT_EXT = new Set([".html", ".js", ".css", ".webmanifest", ".svg", ".json", ".txt"]);

/** Network-first cache. The script lives at /academy-sw.js so its max scope is /. */
export const ROOT_SW = `/* Squishee Academy offline cache. Served from the domain root so scope is /. */
const CACHE = "squishee-academy-root-v1";

async function precacheShell() {
  const cache = await caches.open(CACHE);
  const index = await fetch("/index.html");
  if (!index.ok) throw new Error("index.html");
  const html = await index.text();
  const page = new Response(html, { headers: { "Content-Type": "text/html" } });
  await cache.put("/index.html", page.clone());
  await cache.put("/", page);
  const urls = new Set(["/manifest.webmanifest", "/favicon.svg"]);
  const attr = new RegExp('(?:src|href)="(/[^"]+)"', "g");
  for (const match of html.matchAll(attr)) urls.add(match[1]);
  await Promise.all(
    [...urls].map(async (url) => {
      const res = await fetch(url);
      if (res.ok) await cache.put(url, res);
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith("squishee-academy-") && key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        if (req.mode === "navigate") {
          const page = (await caches.match("/index.html")) || (await caches.match("/"));
          if (page) return page;
        }
        return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }),
  );
});
`;

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
  copyReferencedPublic(root);
  writeFileSync(join(root, "academy-sw.js"), ROOT_SW);
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
