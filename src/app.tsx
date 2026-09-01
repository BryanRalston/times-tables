import { useEffect } from "react";
import { Mascot } from "@/components/mascot";
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

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Mascot pose="wave" size="lg" />
    </div>
  );
}

export function App() {
  const hydrated = useProgress((s) => s.hydrated);
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

  if (!hydrated) return <Splash />;

  if (route.id === "play") return <PlayPage key={`${route.kind}:${route.activityId ?? ""}`} kind={route.kind} activityId={route.activityId} />;
  if (route.id === "unit") return <UnitPage unitId={route.unitId} />;
  if (route.id === "lessons") return <LessonsPage />;
  if (route.id === "shelf") return <ShelfPage />;
  if (route.id === "grownup") return <GrownupPage />;
  return <HomePage />;
}
