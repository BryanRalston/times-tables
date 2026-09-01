import { BookOpen, Flame, Home, Settings2, Sparkles, Star } from "lucide-react";
import type { ReactNode } from "react";
import { Mascot } from "@/components/mascot";
import { todayIso, YEAR_LABEL } from "@/lib/calendar";
import { parseLocale, UI } from "@/lib/i18n";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { schoolStreak } from "@/lib/streak";
import { cn } from "@/lib/utils";

export function useUi() {
  const locale = parseLocale(useProgress((s) => s.locale));
  return UI[locale];
}

export function AppHeader() {
  const name = useProgress((s) => s.name);
  const stars = useProgress((s) => s.stars);
  const sessions = useProgress((s) => s.sessions);
  const streak = schoolStreak(sessions, todayIso());
  const ui = useUi();

  return (
    <header className="mb-3 flex items-center gap-3">
      <Mascot pose="wave" size="sm" className="h-14 w-14" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {ui.grade3} · {YEAR_LABEL}
        </p>
        <h1 className="font-display text-xl leading-tight sm:text-2xl">{name ? ui.namedPath(name) : ui.path}</h1>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1 rounded-full bg-star-soft px-2 py-1 text-star">
          <Star className="size-4 fill-current" />
          {stars}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-star-soft px-2 py-1 text-star">
          <Flame className="size-4" />
          {streak}
        </span>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-[12px] text-muted"
          onClick={() => navigate({ id: "grownup" })}
          aria-label={ui.grownups}
        >
          <Settings2 className="size-5" />
        </button>
      </div>
    </header>
  );
}

export function AppTabs({ active }: { active: "home" | "lessons" | "shelf" }) {
  const ui = useUi();
  const tab = (id: "home" | "lessons" | "shelf", label: string, icon: ReactNode) => (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-1.5 rounded-[12px] text-sm font-medium",
        active === id ? "bg-surface text-ink shadow-soft" : "text-muted",
      )}
      aria-current={active === id ? "page" : undefined}
      onClick={() => navigate({ id })}
    >
      {icon}
      {label}
    </button>
  );
  return (
    <nav className="frost mb-5 grid grid-cols-3 gap-1 rounded-[16px] p-1" aria-label={ui.tabsAria}>
      {tab("home", ui.home, <Home className="size-4" />)}
      {tab("lessons", ui.lessons, <BookOpen className="size-4" />)}
      {tab("shelf", ui.shelf, <Sparkles className="size-4" />)}
    </nav>
  );
}

export function HomeLink({ className }: { className?: string }) {
  const ui = useUi();
  return (
    <button type="button" className={cn("text-sm text-muted", className)} onClick={() => navigate({ id: "home" })}>
      ← {ui.home}
    </button>
  );
}
