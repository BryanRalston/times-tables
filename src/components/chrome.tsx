import { BookOpen, ChevronLeft, Home, Library, Settings2, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";
import { MagentaImg } from "@/components/magenta-video";
import { parseLocale, UI } from "@/lib/i18n";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { squisheeSrc } from "@/lib/squishees";
import { cn } from "@/lib/utils";

export type SceneKind = "hills" | "play" | "shelf";
export type TabId = "home" | "lessons" | "shelf";

export function useUi() {
  const locale = parseLocale(useProgress((s) => s.locale));
  return UI[locale];
}

export function CoinChip({ className }: { className?: string }) {
  const coins = useProgress((s) => s.coins);
  const ui = useUi();
  return (
    <button
      type="button"
      className={cn("coin-chip", className)}
      onClick={() => navigate({ id: "shelf" })}
      aria-label={ui.coins}
    >
      <span className="coin-face" aria-hidden />
      <span className="tabular-nums">{coins}</span>
    </button>
  );
}

export function MuteButton({ className }: { className?: string }) {
  const ui = useUi();
  const soundOn = useProgress((s) => s.soundOn !== false);
  const setSoundOn = useProgress((s) => s.setSoundOn);
  return (
    <button
      type="button"
      className={cn("grid size-9 place-items-center rounded-full text-muted", className)}
      onClick={() => setSoundOn(!soundOn)}
      aria-label={soundOn ? ui.mute : ui.unmute}
      data-mute-sounds="1"
      data-sound-on={soundOn ? "1" : "0"}
    >
      {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
    </button>
  );
}

export function Wordmark({ compact }: { compact?: boolean }) {
  const ui = useUi();
  const pathGrade = useProgress((s) => s.pathGrade) ?? 3;
  const hydrated = useProgress((s) => s.hydrated);
  return (
    <div className="min-w-0">
      <p className={cn("font-display font-semibold leading-none text-teal", compact ? "text-lg" : "text-[1.35rem]")}>
        {ui.path}
      </p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {pathGrade === 4 ? ui.grade4 : ui.grade3}
      </p>
      {hydrated ? (
        <p className="sr-only" data-saved="1">
          {ui.saved}
        </p>
      ) : null}
    </div>
  );
}

export function AppHeader({
  variant = "home",
  title,
}: {
  variant?: "home" | "play" | "shelf";
  title?: string;
}) {
  const ui = useUi();

  if (variant === "play") {
    return (
      <header className="play-head">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full text-ink"
          onClick={() => navigate({ id: "home" })}
          aria-label={ui.home}
        >
          <ChevronLeft className="size-6" strokeWidth={2.25} />
        </button>
        <div className="flex items-center gap-1">
          <MuteButton />
          <CoinChip />
        </div>
      </header>
    );
  }

  return (
    <header className="scene-head">
      {title ? (
        <div className="min-w-0">
          <Wordmark compact />
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{title}</h1>
        </div>
      ) : (
        <Wordmark />
      )}
      <div className="flex items-center gap-1">
        <MuteButton />
        <button
          type="button"
          className="grid size-8 place-items-center rounded-full text-faint"
          onClick={() => navigate({ id: "grownup" })}
          aria-label={ui.grownups}
        >
          <Settings2 className="size-4" />
        </button>
        <CoinChip />
      </div>
    </header>
  );
}

function HouseIcon({ active }: { active: boolean }) {
  return (
    <span className="relative grid size-6 place-items-center">
      <Home className="size-6" strokeWidth={active ? 2.4 : 2} />
      {active ? (
        <span className="pointer-events-none absolute top-[11px] flex gap-0.5" aria-hidden>
          <span className="size-[3px] rounded-full bg-current" />
          <span className="size-[3px] rounded-full bg-current" />
        </span>
      ) : null}
    </span>
  );
}

export function AppTabs({ active }: { active?: TabId | "play" }) {
  const ui = useUi();
  const tab = (id: TabId, label: string, icon: ReactNode) => {
    const on = active === id;
    return (
      <button
        type="button"
        className={cn("app-tab", on && "app-tab-on")}
        aria-current={on ? "page" : undefined}
        onClick={() => navigate({ id })}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };
  return (
    <nav className="app-tabs" aria-label={ui.tabsAria} data-app-tabs="1">
      {tab("home", ui.home, <HouseIcon active={active === "home"} />)}
      {tab("lessons", ui.lessons, <BookOpen className="size-6" strokeWidth={active === "lessons" ? 2.4 : 2} />)}
      {tab("shelf", ui.shelf, <Library className="size-6" strokeWidth={active === "shelf" ? 2.4 : 2} />)}
    </nav>
  );
}

export function HomeLink({ className }: { className?: string }) {
  const ui = useUi();
  return (
    <button
      type="button"
      className={cn("grid size-10 place-items-center rounded-full text-ink", className)}
      onClick={() => navigate({ id: "home" })}
      aria-label={ui.home}
    >
      <ChevronLeft className="size-6" strokeWidth={2.25} />
    </button>
  );
}

function SceneLand({ cloudsOnly }: { cloudsOnly?: boolean }) {
  return (
    <div className="scene-land" data-scene-land="1" aria-hidden>
      <span className="scene-cloud scene-cloud-a" />
      <span className="scene-cloud scene-cloud-b" />
      {cloudsOnly ? null : (
        <>
          <span className="scene-hill scene-hill-back" />
          <span className="scene-hill scene-hill-mid" />
          <span className="scene-hill scene-hill-front" />
        </>
      )}
    </div>
  );
}

export function AppScene({
  scene,
  children,
  tabs,
  className,
}: {
  scene: SceneKind;
  children: ReactNode;
  tabs?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("app-scene", `scene-${scene}`)} data-app-shell="1" data-scene={scene}>
      <SceneLand cloudsOnly={scene === "shelf"} />
      <div className={cn("app-phone", className)}>
        {children}
        {tabs}
      </div>
    </div>
  );
}

export function AppShell({ children, scene = "hills" }: { children: ReactNode; scene?: SceneKind }) {
  return (
    <AppScene scene={scene}>
      {children}
    </AppScene>
  );
}

export function WalkMark() {
  return (
    <span className="walk-mark" aria-hidden data-walk-mark="1">
      <span className="walk-spark walk-spark-a" />
      <span className="walk-spark walk-spark-b" />
      <span className="walk-spark walk-spark-c" />
      <span className="walk-bar walk-bar-a" />
      <span className="walk-bar walk-bar-b" />
      <span className="walk-bar walk-bar-c" />
    </span>
  );
}

export function ContinueStage({ children, peek = false }: { children: ReactNode; peek?: boolean }) {
  const owned = useProgress((s) => s.squishees);
  const id = owned.length ? owned[owned.length - 1] : "peach";
  return (
    <div className={cn("continue-stage", peek && "continue-stage-peek")}>
      {peek ? (
        <span className="continue-peek" data-continue-peek="1" aria-hidden>
          <MagentaImg src={squisheeSrc(id)} alt="" className="continue-peek-art" />
        </span>
      ) : null}
      {children}
    </div>
  );
}
