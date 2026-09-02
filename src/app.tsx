import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";
import { parseLocale } from "@/lib/i18n";
import { doorRoute, useRoute } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { unlockAudio } from "@/lib/sound";
import { GrownupPage } from "@/pages/grownup";
import { HomePage } from "@/pages/home";
import { LessonsPage } from "@/pages/lessons";
import { PathPage } from "@/pages/path";
import { PlayPage } from "@/pages/play";
import { ShelfPage } from "@/pages/shelf";
import { UnitPage } from "@/pages/unit";

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
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", color: "#1f1a14" }}>
          <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Squishee Math</h1>
          <p>This phone hit a bug. Close the tab and open the link again.</p>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.7 }}>{this.state.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const locale = parseLocale(useProgress((s) => s.locale));
  const raw = useRoute();
  const seenWelcome = useProgress((s) => s.seenWelcome);
  const route = doorRoute(seenWelcome, raw);

  useEffect(() => {
    const on = () => unlockAudio();
    window.addEventListener("pointerdown", on, { once: true });
    return () => window.removeEventListener("pointerdown", on);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  let page: ReactNode;
  if (!seenWelcome && route.id !== "grownup") {
    page = <PlayPage key="welcome" kind="welcome" />;
  } else if (route.id === "play") {
    const playKey = route.kind === "welcome" ? "welcome" : `${route.kind}:${route.activityId ?? ""}`;
    page = <PlayPage key={playKey} kind={route.kind} activityId={route.activityId} />;
  } else if (route.id === "path") page = <PathPage />;
  else if (route.id === "unit") page = <UnitPage unitId={route.unitId} />;
  else if (route.id === "lessons") page = <LessonsPage />;
  else if (route.id === "shelf") page = <ShelfPage />;
  else if (route.id === "grownup") page = <GrownupPage />;
  else page = <HomePage />;

  return <BootError>{page}</BootError>;
}
