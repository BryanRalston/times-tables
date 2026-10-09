import { useEffect, useState } from "react";
import { squisheeById } from "@/lib/squishees";
import { catchphrase } from "../buddy/cast";
import { bubbleText, buddyMotion, type BuddyReaction } from "../buddy/react";
import { AcademyPal, cx } from "./bits";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export function RoundBuddy({
  id,
  cosmetic,
  reaction,
}: {
  id: string;
  cosmetic?: string;
  reaction: BuddyReaction;
}) {
  const reduced = useReducedMotion();
  const text = bubbleText(reaction.line, catchphrase(id));
  return (
    <div
      className={cx("ac-buddy", `is-${reaction.mood}`)}
      data-buddy={id}
      data-mood={reaction.mood}
      data-point={reaction.point ?? "none"}
      data-motion={buddyMotion(reduced)}
      aria-hidden="true"
    >
      {text ? <span className="ac-bubble">{text}</span> : null}
      {reaction.point ? <span className="ac-buddy-point" /> : null}
      <AcademyPal id={id} cosmetic={cosmetic} className="ac-buddy-img" />
    </div>
  );
}

export function HostGreet({ id }: { id: string }) {
  const meta = squisheeById(id);
  if (!meta) return null;
  return (
    <div className="ac-host-greet" data-host={id}>
      <AcademyPal id={id} className="ac-host-img" label="" />
      <p>
        <strong>{meta.name}.</strong> {catchphrase(id)}
      </p>
    </div>
  );
}

export function CoinShare({ buddyId, hostId }: { buddyId: string; hostId: string }) {
  const buddy = squisheeById(buddyId)?.name ?? "Buddy";
  const host = squisheeById(hostId)?.name ?? "Friend";
  return (
    <div className="ac-share" aria-label={`${buddy} and ${host} share the coins`}>
      <AcademyPal id={buddyId} className="ac-share-pal" label="" />
      <AcademyPal id={hostId} className="ac-share-pal" label="" />
    </div>
  );
}

export function EggIcon({ ready }: { ready?: boolean }) {
  return (
    <svg className={cx("ac-egg", ready && "is-ready")} viewBox="0 0 48 56" aria-hidden="true">
      <ellipse cx="24" cy="32" rx="16" ry="20" fill={ready ? "#fff6ea" : "#ffe0ee"} stroke="#e21870" strokeWidth="3" />
      <path d="M14 28c2 8 18 8 20 0" fill="none" stroke="#f0b429" strokeWidth="2" />
    </svg>
  );
}
