import { bossForGame } from "../bosses";
import { gameTitle, mascotFor } from "../games/catalog";
import { show, t } from "../i18n";
import type { NextStep } from "../subjects";

/** Big-button words for the one next step. Home says Continue, round end says Next. */
export function nextAction(step: NextStep, where: "home" | "done"): { action: string; title: string; picture: string } {
  if (step.reason === "stories") {
    return { action: where === "home" ? continueWord() : nextWord(), title: show("Stories"), picture: "owl" };
  }
  const title = show(gameTitle(step.game));
  if (step.reason === "boss") {
    const name = bossForGame(step.game).name;
    return {
      action: t(`Face ${name}`, `Enfrenta a ${name}`, `Enfrente ${name}`, `Affronte ${name}`, `去见${name}`, `${name} का सामना`, `واجه ${name}`),
      title,
      picture: mascotFor(step.game),
    };
  }
  return { action: where === "home" ? continueWord() : nextWord(), title, picture: mascotFor(step.game) };
}

export function continueWord(): string {
  return t("Continue", "Continuar", "Continuar", "Continuer", "继续", "आगे खेलो", "تابع");
}

export function nextWord(): string {
  return t("Next", "Siguiente", "Próximo", "Suivant", "下一个", "अगला", "التالي");
}

/** Small tag on a For you today card. */
export function pickTag(reason: string): string {
  switch (reason) {
    case "boss":
      return t("Boss", "Jefe", "Chefe", "Boss", "首领", "बॉस", "الزعيم");
    case "weak":
      return t("Practice", "Practica", "Pratique", "Entraîne-toi", "练一练", "अभ्यास", "تدرّب");
    case "stretch":
      return t("Step up", "Sube", "Suba", "Monte", "升一级", "अगला स्तर", "ارتقِ");
    case "start":
      return t("New", "Nuevo", "Novo", "Nouveau", "新的", "नया", "جديد");
    default:
      return t("Review", "Repasa", "Revise", "Révise", "复习", "दोहराओ", "راجع");
  }
}
