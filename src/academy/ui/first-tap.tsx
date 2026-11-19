import { useState } from "react";
import { t } from "../i18n";

/**
 * Games that open with a step before the answers (sort the pictures, deal the cookies) show a
 * big first line and, the first time on this device, a gentle pulsing hand on the first thing
 * to tap. The hand goes away after the first tap and does not come back for that game.
 */
const KEY = "squishee-academy-first-tap";

/** Games with a first step before the answers. */
export type FirstTapGame = "graphs" | "share";

interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function store(): Store | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

function seenList(from: Store | null): string[] {
  try {
    const raw = from?.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((row): row is string => typeof row === "string") : [];
  } catch {
    return [];
  }
}

export function firstTapSeen(game: FirstTapGame, from: Store | null = store()): boolean {
  return seenList(from).includes(game);
}

export function markFirstTap(game: FirstTapGame, from: Store | null = store()): void {
  const list = seenList(from);
  if (list.includes(game)) return;
  try {
    from?.setItem(KEY, JSON.stringify([...list, game]));
  } catch {
    // Private mode or full storage: the hand just shows again next time.
  }
}

/** Whether to show the hand now, and a callback for the child's first tap. */
export function useFirstTap(game: FirstTapGame): [boolean, () => void] {
  const [show, setShow] = useState(() => !firstTapSeen(game));
  return [
    show,
    () => {
      if (!show) return;
      setShow(false);
      markFirstTap(game);
    },
  ];
}

/** The big first line above the board. */
export function firstStepLine(game: FirstTapGame): string {
  return game === "graphs"
    ? t(
        "Tap a picture, then tap its group.",
        "Toca un dibujo y luego toca su grupo.",
        "Toque em um desenho e depois no grupo dele.",
        "Touche une image, puis touche son groupe.",
        "先点一张图片，再点它的组。",
        "एक चित्र छुओ, फिर उसका समूह छुओ।",
        "المس صورة، ثم المس مجموعتها.",
      )
    : t(
        "Tap the cookies to put one on a plate.",
        "Toca las galletas para poner una en un plato.",
        "Toque nos biscoitos para pôr um no prato.",
        "Touche les biscuits pour en poser un sur une assiette.",
        "点饼干，把一块放到盘子上。",
        "बिस्कुट छुओ, एक प्लेट पर रखो।",
        "المس البسكويت لتضع قطعة على طبق.",
      );
}

/** A pulsing pointing hand under the first thing to tap. Purely a picture; the line says what to do. */
export function TapHand() {
  return (
    <span className="ac-tap-hand" aria-hidden="true" data-tap-hand="on">
      👆
    </span>
  );
}
