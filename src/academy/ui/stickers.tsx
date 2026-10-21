import { daysPlayedCaption, daysPlayedThisWeek, weekStickers } from "../week";
import { cx, Star } from "./bits";

export function WeekStickers({ secondsByDay, today }: { secondsByDay: Record<string, number>; today: string }) {
  const days = weekStickers(secondsByDay, today);
  const played = daysPlayedThisWeek(secondsByDay, today);
  const caption = daysPlayedCaption(played);
  return (
    <section className="ac-week-card" aria-label={caption} data-week-days={played}>
      <p className="ac-week-title">{caption}</p>
      <div className="ac-stickers">
        {days.map((day) => (
          <span
            key={day.iso}
            className={cx("ac-sticker", day.played && "is-on", day.today && "is-today")}
            data-played={day.played ? "yes" : "no"}
            aria-label={day.played ? `${day.name}, sticker` : day.name}
          >
            <b aria-hidden="true">{day.played ? <Star filled /> : null}</b>
            <small>{day.letter}</small>
          </span>
        ))}
      </div>
    </section>
  );
}
