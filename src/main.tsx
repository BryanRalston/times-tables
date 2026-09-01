import { createRoot } from "react-dom/client";
import { App } from "@/app";
import { hydrateProgress } from "@/lib/progress";
import "@/styles.css";

const el = document.getElementById("app");
if (!el) throw new Error("missing #app");
const rootEl = el;

function mount() {
  try {
    createRoot(rootEl).render(<App />);
  } catch (err) {
    rootEl.innerHTML =
      '<div style="padding:24px;font-family:system-ui,sans-serif"><h1>Grade 3 Path</h1><p>This phone could not start. Close the tab and try again.</p></div>';
    console.error(err);
  }
}

void Promise.resolve(hydrateProgress()).then(mount, mount);
