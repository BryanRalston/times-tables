import type { ReactNode } from "react";
import type { StoryMood, StoryPicture, StoryProp } from "../stories/catalog";
import { SquisheeImg } from "./bits";

function PropArt({ id }: { id: StoryProp }) {
  switch (id) {
    case "hat":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <ellipse cx="40" cy="58" rx="28" ry="8" fill="#ffd0e4" />
          <path d="M18 50h44l-6 10H24Z" fill="#e21870" />
          <rect x="28" y="28" width="24" height="22" rx="8" fill="#ff4b93" />
        </svg>
      );
    case "mat":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <rect x="10" y="34" width="60" height="22" rx="8" fill="#7ad7c8" />
          <rect x="16" y="40" width="48" height="10" rx="5" fill="#12988a" />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <g fill="#f0b429">
            <circle cx="40" cy="40" r="16" />
            <rect x="37" y="8" width="6" height="12" rx="3" />
            <rect x="37" y="60" width="6" height="12" rx="3" />
            <rect x="8" y="37" width="12" height="6" rx="3" />
            <rect x="60" y="37" width="12" height="6" rx="3" />
            <rect x="16" y="16" width="12" height="6" rx="3" transform="rotate(-45 22 19)" />
            <rect x="52" y="16" width="12" height="6" rx="3" transform="rotate(45 58 19)" />
            <rect x="16" y="58" width="12" height="6" rx="3" transform="rotate(45 22 61)" />
            <rect x="52" y="58" width="12" height="6" rx="3" transform="rotate(-45 58 61)" />
          </g>
        </svg>
      );
    case "bug":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <ellipse cx="28" cy="36" rx="14" ry="10" fill="#b7efe6" />
          <ellipse cx="52" cy="36" rx="14" ry="10" fill="#b7efe6" />
          <ellipse cx="40" cy="46" rx="16" ry="12" fill="#3c2448" />
          <rect x="38" y="22" width="4" height="12" rx="2" fill="#3c2448" />
          <circle cx="30" cy="20" r="3" fill="#3c2448" />
          <circle cx="50" cy="20" r="3" fill="#3c2448" />
        </svg>
      );
    case "cup":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <path d="M22 28h30l-4 28H26Z" fill="#fffaf6" />
          <path d="M24 32h26l-3 20H27Z" fill="#ffd6ea" />
          <path d="M52 34h8a10 10 0 0 1 0 16h-6" fill="none" stroke="#e21870" strokeWidth="4" />
        </svg>
      );
    case "kite":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <path d="M40 10 62 36 40 58 18 36Z" fill="#ff4b93" />
          <path d="M40 10 40 58" stroke="#fffaf6" strokeWidth="3" />
          <path d="M40 58c8 6 8 12 4 16" fill="none" stroke="#f0b429" strokeWidth="3" />
        </svg>
      );
    case "fish":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <path d="M14 40 30 28v24Z" fill="#7ec8e3" />
          <ellipse cx="46" cy="40" rx="20" ry="14" fill="#2aa8c4" />
        </svg>
      );
    case "log":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <rect x="12" y="36" width="56" height="18" rx="9" fill="#c4844a" />
          <circle cx="22" cy="45" r="7" fill="#a86b34" />
          <circle cx="22" cy="45" r="3" fill="#e7c39a" />
        </svg>
      );
    case "snack":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="44" r="18" fill="#e21870" />
          <path d="M40 24c6 0 8 8 4 12" fill="none" stroke="#12988a" strokeWidth="4" />
          <ellipse cx="46" cy="22" rx="6" ry="4" fill="#7ad7c8" />
        </svg>
      );
    case "moon":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r="18" fill="#fff4c9" />
          <circle cx="48" cy="34" r="4" fill="#f0e2a8" />
          <circle cx="34" cy="46" r="3" fill="#f0e2a8" />
        </svg>
      );
    case "house":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <path d="M12 40 40 16 68 40Z" fill="#ff4b93" />
          <rect x="22" y="40" width="36" height="26" fill="#fffaf6" />
          <rect x="36" y="50" width="10" height="16" fill="#f0b429" />
        </svg>
      );
    case "boat":
      return (
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <path d="M14 48h52l-8 14H24Z" fill="#12988a" />
          <path d="M40 46V20" stroke="#3c2448" strokeWidth="3" />
          <path d="M40 22h18L40 44Z" fill="#fffaf6" />
        </svg>
      );
    default: {
      const neverProp: never = id;
      return neverProp;
    }
  }
}

export function StoryPicture({ picture, label }: { picture: StoryPicture; label?: string }) {
  switch (picture.kind) {
    case "pal":
      return <SquisheeImg id={picture.id} className="ac-story-choice-art" label={label ?? ""} squish="off" />;
    case "prop":
      return (
        <span className="ac-story-choice-art ac-story-choice-prop">
          <PropArt id={picture.id} />
        </span>
      );
    default: {
      const neverPicture: never = picture;
      return neverPicture;
    }
  }
}

export function StoryScene({
  mood,
  pals,
  prop,
}: {
  mood: StoryMood;
  pals: readonly string[];
  prop?: StoryProp;
}) {
  let sky: ReactNode = null;
  switch (mood) {
    case "day":
      sky = <span className="ac-story-sky is-day" />;
      break;
    case "night":
      sky = <span className="ac-story-sky is-night" />;
      break;
    case "water":
      sky = <span className="ac-story-sky is-water" />;
      break;
    default: {
      const neverMood: never = mood;
      sky = neverMood;
    }
  }
  return (
    <div className={`ac-story-scene is-${mood}`} aria-hidden="true">
      {sky}
      <span className="ac-story-ground" />
      {prop ? (
        <span className="ac-story-prop">
          <PropArt id={prop} />
        </span>
      ) : null}
      <div className="ac-story-pals">
        {pals.map((id) => (
          <SquisheeImg key={id} id={id} className="ac-story-pal" squish="off" />
        ))}
      </div>
    </div>
  );
}
