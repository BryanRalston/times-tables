import { createRoot } from "react-dom/client";
import { Component, type ErrorInfo, type ReactNode } from "react";
import "@fontsource/fredoka/latin-600.css";
import "@fontsource/fredoka/latin-700.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import { AcademyRoot } from "./app";
import "./academy.css";

class BootError extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(err: Error) {
    return { message: err.message || "Something broke." };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(err, info.componentStack);
  }

  render() {
    if (this.state.message) {
      return (
        <div style={{ padding: 24, fontFamily: "Nunito, sans-serif", color: "#3c2448" }}>
          <h1 style={{ fontFamily: "Fredoka, sans-serif" }}>Squishee Academy</h1>
          <p>This page hit a bug. Close it and open the link again.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const el = document.getElementById("app");
if (!el) throw new Error("missing #app");

createRoot(el).render(
  <BootError>
    <AcademyRoot />
  </BootError>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/times-tables/academy-sw.js", { scope: "/times-tables/academy/" });
  });
}
