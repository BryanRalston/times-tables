import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";
import { parseLocale } from "@/lib/i18n";
import { useRoute } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { unlockAudio } from "@/lib/sound";
import { GrownupPage } from "@/pages/grownup";
import { HomePage } from "@/pages/home";
import { LessonsPage } from "@/pages/lessons";
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
          <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Grade 3 Path</h1>
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
  const route = useRoute();

  useEffect(() => {
    const on = () => unlockAudio();
    window.addEventListener("pointerdown", on, { once: true });
    return () => window.removeEventListener("pointerdown", on);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  let page: ReactNode = <HomePage />;
  if (route.id === "play") {
    page = <PlayPage key={`${route.kind}:${route.activityId ?? ""}`} kind={route.kind} activityId={route.activityId} />;
  } else if (route.id === "unit") page = <UnitPage unitId={route.unitId} />;
  else if (route.id === "lessons") page = <LessonsPage />;
  else if (route.id === "shelf") page = <ShelfPage />;
  else if (route.id === "grownup") page = <GrownupPage />;

  return <BootError>{page}</BootError>;
}
