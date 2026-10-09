import react from "@vitejs/plugin-react";
import { cpSync, createReadStream, existsSync, readdirSync, rmSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join, normalize, resolve, sep } from "node:path";
import { defineConfig } from "vite";

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

/** Vite keeps the `academy/` folder name in the HTML output. Pages needs those files at dist/academy/. */
function hoistAcademyHtml() {
  return {
    name: "hoist-academy-html",
    closeBundle() {
      const nested = resolve("dist/academy/academy");
      const out = resolve("dist/academy");
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

export default defineConfig({
  base: "/times-tables/academy/",
  publicDir: "academy/public",
  plugins: [react(), sharedPublic(), hoistAcademyHtml()],
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
  build: {
    outDir: "dist/academy",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        academy: resolve("academy/index.html"),
        sheetTimes: resolve("academy/worksheets/times-tables/index.html"),
        sheetAdd: resolve("academy/worksheets/add-subtract/index.html"),
        sheetTime: resolve("academy/worksheets/telling-time/index.html"),
        sheetMoney: resolve("academy/worksheets/money/index.html"),
      },
    },
  },
  server: {
    port: 5174,
    host: true,
    open: "/times-tables/academy/",
  },
});
