import { useEffect } from "react";
import { Mascot } from "@/components/mascot";
import { navigate, useRoute } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { unlockAudio } from "@/lib/sound";
import { GrownupPage } from "@/pages/grownup";
import { HomePage } from "@/pages/home";
import { PlayPage } from "@/pages/play";
import { UnitPage } from "@/pages/unit";

function Splash() {
  return (
    <div className="paper-grid grid min-h-dvh place-items-center">
      <Mascot pose="wave" size="lg" />
    </div>
  );
}

export function App() {
  const hydrated = useProgress((s) => s.hydrated);
  const seenWelcome = useProgress((s) => s.seenWelcome);
  const route = useRoute();

  useEffect(() => {
    const on = () => unlockAudio();
    window.addEventListener("pointerdown", on, { once: true });
    return () => window.removeEventListener("pointerdown", on);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!seenWelcome && route.id === "home") {
      navigate({ id: "play", kind: "welcome" }, { replace: true });
    }
  }, [hydrated, seenWelcome, route]);

  if (!hydrated) return <Splash />;
  if (!seenWelcome && route.id !== "play") return <Splash />;

  if (route.id === "play") return <PlayPage kind={route.kind} activityId={route.activityId} />;
  if (route.id === "unit") return <UnitPage unitId={route.unitId} />;
  if (route.id === "grownup") return <GrownupPage />;
  return <HomePage />;
}
