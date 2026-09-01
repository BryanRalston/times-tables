import { createRoot } from "react-dom/client";
import { App } from "@/app";
import { hydrateProgress } from "@/lib/progress";
import "@/styles.css";

hydrateProgress();

const el = document.getElementById("app");
if (!el) throw new Error("missing #app");

createRoot(el).render(<App />);
