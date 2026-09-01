import { BookOpen, Flame, Home, Settings2, Sparkles, Star } from "lucide-react";
import type { ReactNode } from "react";
import { Mascot } from "@/components/mascot";
import { todayIso, YEAR_LABEL } from "@/lib/calendar";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { schoolStreak } from "@/lib/streak";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const name = useProgress((s) => s.name);
  const stars = useProgress((s) => s.stars);
  const sessions = useProgress((s) => s.sessions);
  const streak = schoolStreak(sessions, todayIso());

  return (
    <header className="mb-3 flex items-center gap-3">
      <Mascot pose="wave" size="sm" className="h-14 w-14" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Grade 3 · {YEAR_LABEL}</p>
        <h1 className="font-display text-xl leading-tight sm:text-2xl">{name ? `${name}'s path` : "Grade 3 Path"}</h1>
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
          aria-label="Grown-ups"
        >
          <Settings2 className="size-5" />
        </button>
      </div>
    </header>
  );
}

export function AppTabs({ active }: { active: "home" | "lessons" | "shelf" }) {
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
    <nav className="mb-5 grid grid-cols-3 gap-1 rounded-[16px] bg-surface-2 p-1" aria-label="Home, lessons, and shelf">
      {tab("home", "Home", <Home className="size-4" />)}
      {tab("lessons", "Lessons", <BookOpen className="size-4" />)}
      {tab("shelf", "Shelf", <Sparkles className="size-4" />)}
    </nav>
  );
}

export function HomeLink({ className }: { className?: string }) {
  return (
    <button type="button" className={cn("text-sm text-muted", className)} onClick={() => navigate({ id: "home" })}>
      ← Home
    </button>
  );
}
