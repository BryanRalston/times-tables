import react from "@vitejs/plugin-react";
import { cpSync, createReadStream, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, join, normalize, resolve, sep } from "node:path";
import { defineConfig } from "vite";
import { academySeoFiles, withOpenGraph } from "./src/academy/seo/html";
import { academyDomainPlugins } from "./scripts/academy-domain-plugin.mjs";
import { academyPrecachePlugin, isPokeMediaName } from "./scripts/academy-precache.mjs";

const domain = process.env.ACADEMY_DOMAIN === "1";
const outDir = domain ? "dist-domain" : "dist/academy";

function contentType(file: string): string {
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".json")) return "application/json";
  if (file.endsWith(".webmanifest")) return "application/manifest+json";
  if (file.endsWith(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

/** Vite keeps the `academy/` folder name in the HTML output. Hoist those files to outDir. */
function hoistAcademyHtml(dir: string) {
  return {
    name: "hoist-academy-html",
    writeBundle() {
      const out = resolve(dir);
      const nested = join(out, "academy");
      if (!existsSync(nested)) return;
      for (const name of readdirSync(nested)) {
        cpSync(join(nested, name), join(out, name), { recursive: true });
      }
      rmSync(nested, { recursive: true, force: true });
    },
  };
}

function sharedPublic() {
  const root = resolve("public");
  const serve = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const pathOnly = decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/");
    if (pathOnly === "/academy" || pathOnly.startsWith("/academy/")) {
      const under = pathOnly.replace(/^\/academy\/?/, "");
      const name = under.startsWith("squishees/") ? under.slice("squishees/".length) : "";
      const shared = name && isPokeMediaName(name) ? join(root, "squishees", name) : "";
      if (shared && shared.startsWith(root + sep) && existsSync(shared) && statSync(shared).isFile()) {
        res.setHeader("Content-Type", contentType(shared));
        createReadStream(shared).pipe(res);
        return;
      }
      next();
      return;
    }
    const rel = normalize(pathOnly).replace(/^[/\\]+/, "");
    if (!rel || rel.includes("..")) {
      next();
      return;
    }
    const file = join(root, rel);
    if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) {
      next();
      return;
    }
    res.setHeader("Content-Type", contentType(file));
    createReadStream(file).pipe(res);
  };
  return {
    name: "academy-shared-public",
    configureServer(server: { middlewares: { use: (path: string, fn: typeof serve) => void } }) {
      server.middlewares.use("/times-tables", serve);
    },
    configurePreviewServer(server: { middlewares: { use: (path: string, fn: typeof serve) => void } }) {
      server.middlewares.use("/times-tables", serve);
    },
  };
}

function academyOpenGraphPlugin() {
  return {
    name: "academy-domain-open-graph",
    transformIndexHtml(html: string) {
      return withOpenGraph(html);
    },
  };
}

function academySeoPlugin(dir: string) {
  return {
    name: "academy-seo-pages",
    writeBundle() {
      const root = resolve(dir);
      for (const file of academySeoFiles()) {
        const dest = join(root, file.path);
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, file.body);
      }
    },
  };
}

export default defineConfig({
  base: domain ? "/" : "/times-tables/academy/",
  publicDir: "academy/public",
  plugins: [
    react(),
    sharedPublic(),
    ...(domain ? academyDomainPlugins(outDir) : [hoistAcademyHtml(outDir)]),
    ...(domain ? [academyOpenGraphPlugin()] : []),
    academySeoPlugin(outDir),
    academyPrecachePlugin(outDir, {
      appPrefix: domain ? "" : "/times-tables/academy",
      artPrefix: domain ? "" : "/times-tables",
      mediaPrefix: domain ? "" : "/times-tables/academy",
    }),
  ],
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        academy: resolve("academy/index.html"),
        sheetTimes: resolve("academy/worksheets/times-tables/index.html"),
        sheetAdd: resolve("academy/worksheets/add-subtract/index.html"),
        sheetTime: resolve("academy/worksheets/telling-time/index.html"),
        sheetMoney: resolve("academy/worksheets/money/index.html"),
        sheetSight: resolve("academy/worksheets/sight-words/index.html"),
        sheetSpelling: resolve("academy/worksheets/spelling/index.html"),
        sheetCount: resolve("academy/worksheets/counting/index.html"),
        sheetPlace: resolve("academy/worksheets/place-value/index.html"),
        sheetShapes: resolve("academy/worksheets/shapes/index.html"),
        sheetFractions: resolve("academy/worksheets/fractions/index.html"),
        sheetMeasure: resolve("academy/worksheets/measurement/index.html"),
        sheetPhonics: resolve("academy/worksheets/phonics/index.html"),
        sheetProblems: resolve("academy/worksheets/word-problems/index.html"),
      },
    },
  },
  server: {
    port: 5174,
    host: true,
    open: domain ? "/" : "/times-tables/academy/",
  },
});
