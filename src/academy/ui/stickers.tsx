import { weekStickers } from "../round-flow";
import { cx } from "./bits";

export function WeekStickers({ secondsByDay, today }: { secondsByDay: Record<string, number>; today: string }) {
  const days = weekStickers(secondsByDay, today);
  return (
    <div className="ac-stickers" aria-label="This week">
      {days.map((day) => (
        <span
          key={day.iso}
          className={cx("ac-sticker", day.played && "is-on", day.today && "is-today")}
          aria-label={day.played ? `${day.name}, sticker` : day.name}
        >
          <b aria-hidden="true">{day.played ? "★" : ""}</b>
          <small>{day.letter}</small>
        </span>
      ))}
    </div>
  );
}
