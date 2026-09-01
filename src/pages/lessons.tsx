import { AppHeader, AppTabs } from "@/components/chrome";
import { ART } from "@/lib/art";
import { todayIso } from "@/lib/calendar";
import { QUARTERS, UNITS, suggestedUnitId, unitWindowLabel } from "@/lib/curriculum";
import { navigate } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function LessonsPage() {
  const classUnitId = useProgress((s) => s.classUnitId);
  const activities = useProgress((s) => s.activities);
  const suggested = suggestedUnitId(todayIso(), classUnitId || undefined);

  return (
    <div className="paper-grid mx-auto min-h-dvh max-w-xl px-4 pb-16 pt-4">
      <AppHeader />
      <AppTabs active="lessons" />
      <h2 className="font-display text-2xl">Lessons</h2>
      <p className="mb-4 text-sm text-muted">
        Every unit, every activity. Calendar marks <span className="font-medium text-teal">Now</span> — nothing is locked. Pick Q4 in August if you want.
      </p>

      {QUARTERS.map((q) => {
        const units = UNITS.filter((u) => u.quarter === q.id);
        return (
          <section key={q.id} className="mb-6">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              {q.name} · {q.span}
            </h3>
            <div className="space-y-2">
              {units.map((u) => {
                const now = u.id === suggested;
                return (
                  <details key={u.id} open={now} className="rounded-[20px] border border-line bg-surface p-3 shadow-soft">
                    <summary className="flex cursor-pointer list-none items-center gap-3">
                      <img src={ART.nodeOpen} alt="" className="h-12 w-12 object-contain" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-display text-lg leading-tight">{u.short}</span>
                          {now ? (
                            <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[11px] font-medium text-teal">Now</span>
                          ) : null}
                        </span>
                        <span className="block text-xs text-muted">
                          Unit {u.number} · {unitWindowLabel(u.id)}
                        </span>
                      </span>
                    </summary>
                    <p className="mt-2 text-sm text-muted">{u.blurb}</p>
                    <div className="mt-3 space-y-2">
                      {now ? (
                        <button
                          type="button"
                          className="flex h-12 w-full items-center justify-center rounded-[14px] bg-teal text-sm font-medium text-teal-ink"
                          onClick={() => navigate({ id: "play", kind: "daily" })}
                        >
                          Today's walk
                        </button>
                      ) : null}
                      {u.activities.map((a) => {
                        const save = activities[a.id];
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => navigate({ id: "play", kind: "activity", activityId: a.id })}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-[14px] border border-line bg-bg-warm px-3 py-2.5 text-left",
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium leading-tight">{a.title}</span>
                              <span className="block text-xs text-muted">{a.blurb}</span>
                            </span>
                            <span className="text-star">{save?.stars ? "★".repeat(save.stars) : "Play"}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className="w-full text-center text-xs text-muted"
                        onClick={() => navigate({ id: "unit", unitId: u.id })}
                      >
                        Unit page
                      </button>
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
