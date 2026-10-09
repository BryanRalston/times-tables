import { useEffect, useState, type ReactNode } from "react";
import { isGameId, todayIso, type GameId, type RoundResult, type Save } from "./model";
import { applyRound, acknowledgeUnlocks } from "./rewards";
import { activeChild, loadSave, mapActive, withLevel, writeSave } from "./storage";
import { HelloScreen, SettingsScreen, SheetsScreen, ShelfScreen } from "./ui/extra";
import { GrownupsScreen } from "./ui/grownups";
import { HomeScreen } from "./ui/home";
import { PlayScreen } from "./ui/play";
import { WorksheetPage } from "./ui/worksheet";

type Route =
  | { name: "home" }
  | { name: "play"; game: GameId }
  | { name: "grownups" }
  | { name: "settings" }
  | { name: "shelf" }
  | { name: "sheets" };

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "").replace(/^\//, "");
  const [head, tail] = path.split("/");
  if (head === "play" && isGameId(tail)) return { name: "play", game: tail };
  if (head === "grownups") return { name: "grownups" };
  if (head === "settings") return { name: "settings" };
  if (head === "shelf") return { name: "shelf" };
  if (head === "sheets") return { name: "sheets" };
  return { name: "home" };
}

function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return parseRoute(hash);
}

function goHome() {
  window.location.hash = "#/";
}

function screenGame(): GameId | null {
  const screen = document.body.dataset.screen;
  if (screen === "sheet-times") return "times";
  if (screen === "sheet-add") return "add";
  if (screen === "sheet-time") return "time";
  return null;
}

export function AcademyRoot() {
  const sheet = screenGame();
  if (sheet) return <WorksheetPage game={sheet} />;
  return <AcademyApp />;
}

function AcademyApp() {
  const [save, setSave] = useState<Save>(() => loadSave());
  const route = useRoute();

  useEffect(() => {
    writeSave(save);
  }, [save]);

  useEffect(() => {
    const titles: Record<Route["name"], string> = {
      home: "Squishee Academy",
      play: "Play · Squishee Academy",
      grownups: "Grown-ups · Squishee Academy",
      settings: "Settings · Squishee Academy",
      shelf: "Squishees · Squishee Academy",
      sheets: "Free worksheets · Squishee Academy",
    };
    document.title = titles[route.name];
  }, [route]);

  const child = activeChild(save);

  function onRound(result: RoundResult) {
    const today = todayIso();
    setSave((current) => mapActive(current, (row) => applyRound(row, result, today)));
  }

  let body: ReactNode;
  if (!child.name) {
    body = <HelloScreen save={save} onSave={setSave} />;
  } else if (route.name === "play") {
    body = (
      <PlayScreen
        child={child}
        game={route.game}
        sound={save.sound}
        onExit={goHome}
        onRound={onRound}
        onLevel={(level) => setSave((current) => mapActive(current, (row) => withLevel(row, route.game, level)))}
        onAck={() => setSave((current) => mapActive(current, acknowledgeUnlocks))}
      />
    );
  } else if (route.name === "grownups") {
    body = <GrownupsScreen save={save} onSave={setSave} />;
  } else if (route.name === "settings") {
    body = <SettingsScreen save={save} onSave={setSave} />;
  } else if (route.name === "shelf") {
    body = <ShelfScreen save={save} onSave={setSave} />;
  } else if (route.name === "sheets") {
    body = <SheetsScreen />;
  } else {
    body = <HomeScreen child={child} />;
  }

  return body;
}
