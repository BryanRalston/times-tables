import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

function spa404() {
  return {
    name: "spa-404",
    closeBundle() {
      const index = resolve("dist/index.html");
      if (existsSync(index)) copyFileSync(index, resolve("dist/404.html"));
      writeFileSync(resolve("dist/.nojekyll"), "");
    },
  };
}

function baseRedirect() {
  const to = "/times-tables/";
  const bounce = (req: { url?: string }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: () => void }, next: () => void) => {
    const raw = req.url ?? "/";
    const path = raw.split("?")[0];
    if (path === "/" || path === "/index.html") {
      const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
      res.statusCode = 302;
      res.setHeader("Location", `${to}${q}`);
      res.end();
      return;
    }
    next();
  };
  return {
    name: "base-redirect",
    configureServer(server: { middlewares: { use: (fn: typeof bounce) => void } }) {
      server.middlewares.use(bounce);
    },
    configurePreviewServer(server: { middlewares: { use: (fn: typeof bounce) => void } }) {
      server.middlewares.use(bounce);
    },
  };
}

export default defineConfig({
  base: "/times-tables/",
  plugins: [react(), tailwindcss(), spa404(), baseRedirect()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: "/times-tables/",
  },
  preview: {
    port: 4173,
    host: true,
    open: "/times-tables/",
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
