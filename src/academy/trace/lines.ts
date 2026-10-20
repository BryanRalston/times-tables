import { t } from "../i18n";

export interface TraceLine {
  en: string;
  es: string;
  game: string;
}

export function traceLines(): TraceLine[] {
  return [
    { en: "Trace the number. Start at the dot.", es: "Traza el número. Empieza en el punto.", game: "count" },
    { en: "Trace the big letter. Start at the dot.", es: "Traza la letra grande. Empieza en el punto.", game: "phonics" },
    { en: "Trace the small letter. Start at the dot.", es: "Traza la letra chica. Empieza en el punto.", game: "phonics" },
    { en: "Nice tracing!", es: "¡Qué buen trazo!", game: "count" },
    { en: "You traced it!", es: "¡Lo trazaste!", game: "count" },
    { en: "Keep going.", es: "Sigue así.", game: "count" },
  ];
}

export function traceSpeech(form: "numeral" | "upper" | "lower"): string {
  switch (form) {
    case "numeral":
      return t("Trace the number. Start at the dot.", "Traza el número. Empieza en el punto.");
    case "upper":
      return t("Trace the big letter. Start at the dot.", "Traza la letra grande. Empieza en el punto.");
    case "lower":
      return t("Trace the small letter. Start at the dot.", "Traza la letra chica. Empieza en el punto.");
    default: {
      const neverForm: never = form;
      return neverForm;
    }
  }
}

export function tracePraise(): string {
  return t("Nice tracing!", "¡Qué buen trazo!");
}

export function traceDoneLine(): string {
  return t("You traced it!", "¡Lo trazaste!");
}

export function traceKeepLine(): string {
  return t("Keep going.", "Sigue así.");
}
