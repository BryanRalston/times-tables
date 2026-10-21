import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { gameForScreen, isGameId, type GameId } from "./games/catalog";
import { todayIso, type RoundResult, type Save } from "./model";
import { openEgg } from "./buddy/unlock";
import { acknowledgeUnlocks, applyRound, applyStory, claimDailyGift } from "./rewards";
import { setLocale, show } from "./i18n";
import { activeChild, loadSave, mapActive, withLevel, writeSave } from "./storage";
import { warmVoices } from "./voice";
import { ensureVoice } from "./voice/clips";
import { HelloScreen, SettingsScreen, SheetsScreen, ShelfScreen } from "./ui/extra";
import { HomeScreen } from "./ui/home";
import { MapScreen } from "./ui/map";
import { SoundContext } from "./ui/sound-context";

const PlayScreen = lazy(() => import("./ui/play").then((mod) => ({ default: mod.PlayScreen })));
const GrownupsScreen = lazy(() => import("./ui/grownups").then((mod) => ({ default: mod.GrownupsScreen })));
const WorksheetPage = lazy(() => import("./ui/worksheet").then((mod) => ({ default: mod.WorksheetPage })));
const StoriesRoute = lazy(() => import("./ui/stories").then((mod) => ({ default: mod.StoriesRoute })));

type Route =
  | { name: "home" }
  | { name: "play"; game: GameId; crown: boolean }
  | { name: "grownups" }
  | { name: "settings" }
  | { name: "shelf" }
  | { name: "sheets" }
  | { name: "map" }
  | { name: "stories" }
  | { name: "story"; id: string };

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "").replace(/^\//, "");
  const [head, tail, extra] = path.split("/");
  if (head === "play" && isGameId(tail)) return { name: "play", game: tail, crown: extra === "crown" };
  if (head === "grownups") return { name: "grownups" };
  if (head === "settings") return { name: "settings" };
  if (head === "shelf") return { name: "shelf" };
  if (head === "sheets") return { name: "sheets" };
  if (head === "map") return { name: "map" };
  if (head === "stories" && tail) return { name: "story", id: tail };
  if (head === "stories") return { name: "stories" };
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

function ScreenFallback() {
  return (
    <div className="ac-shell">
      <p className="ac-lede">{show("Loading…")}</p>
    </div>
  );
}

class ScreenBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="ac-shell">
          <p className="ac-lede">
            {show("This page is not saved on this device yet. Connect once, then open Academy again.")}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <ScreenBoundary>
      <Suspense fallback={<ScreenFallback />}>{children}</Suspense>
    </ScreenBoundary>
  );
}

function screenGame(): GameId | null {
  const game = gameForScreen(document.body.dataset.screen);
  return game && isGameId(game.id) ? game.id : null;
}

export function AcademyRoot() {
  const sheet = screenGame();
  if (sheet) {
    return (
      <Screen>
        <WorksheetPage game={sheet} />
      </Screen>
    );
  }
  return <AcademyApp />;
}

function AcademyApp() {
  const [save, setSave] = useState<Save>(() => loadSave());
  const route = useRoute();
  setLocale(save.lang);

  useEffect(() => {
    writeSave(save);
  }, [save]);

  useEffect(() => {
    warmVoices();
    void ensureVoice();
  }, []);

  useEffect(() => {
    const titles: Record<Route["name"], string> = {
      home: "Squishee Academy",
      play: `${show("Play")} · Squishee Academy`,
      grownups: `${show("Grown-ups")} · Squishee Academy`,
      settings: `${show("Settings")} · Squishee Academy`,
      shelf: `${show("Squishees")} · Squishee Academy`,
      sheets: `${show("Free worksheets")} · Squishee Academy`,
      map: `${show("Island")} · Squishee Academy`,
      stories: `${show("Stories")} · Squishee Academy`,
      story: `${show("Stories")} · Squishee Academy`,
    };
    document.title = titles[route.name];
  }, [route, save.lang]);

  const child = activeChild(save);

  function onRound(result: RoundResult) {
    const today = todayIso();
    setSave((current) => mapActive(current, (row) => applyRound(row, result, today)));
  }

  let body: ReactNode;
  if (!child.name) {
    body = <HelloScreen save={save} onSave={setSave} sound={save.sound} />;
  } else if (route.name === "play") {
    body = (
      <Screen>
        <PlayScreen
          key={`${route.game}-${route.crown ? "crown" : "round"}`}
          child={child}
          game={route.game}
          crown={route.crown}
          sound={save.sound}
          onExit={goHome}
          onRound={onRound}
          onLevel={(level) => setSave((current) => mapActive(current, (row) => withLevel(row, route.game, level)))}
          onAck={() => setSave((current) => mapActive(current, acknowledgeUnlocks))}
          onToggleSound={() => setSave((current) => ({ ...current, sound: !current.sound }))}
        />
      </Screen>
    );
  } else if (route.name === "grownups") {
    body = (
      <Screen>
        <GrownupsScreen save={save} onSave={setSave} />
      </Screen>
    );
  } else if (route.name === "settings") {
    body = <SettingsScreen save={save} onSave={setSave} />;
  } else if (route.name === "shelf") {
    body = <ShelfScreen save={save} onSave={setSave} />;
  } else if (route.name === "sheets") {
    body = <SheetsScreen />;
  } else if (route.name === "stories" || route.name === "story") {
    body = (
      <Screen>
        <StoriesRoute
          storyId={route.name === "story" ? route.id : ""}
          grade={child.grade}
          skills={child.skills}
          sound={save.sound}
          onFinish={(result) => {
            const today = todayIso();
            setSave((current) => mapActive(current, (row) => applyStory(row, result, today)));
          }}
        />
      </Screen>
    );
  } else if (route.name === "map") {
    body = (
      <MapScreen
        child={child}
        onOpenEgg={() => setSave((current) => mapActive(current, (row) => openEgg(row, todayIso())))}
      />
    );
  } else {
    body = (
      <HomeScreen
        child={child}
        sound={save.sound}
        onClaim={() => setSave((current) => mapActive(current, (row) => claimDailyGift(row, todayIso())))}
        onPlay={(gameId, nextLevel) => {
          if (!isGameId(gameId)) return;
          setSave((current) => mapActive(current, (row) => withLevel(row, gameId, nextLevel)));
          window.location.hash = `#/play/${gameId}`;
        }}
      />
    );
  }

  return <SoundContext.Provider value={save.sound}>{body}</SoundContext.Provider>;
}
