import type { GameId } from "./model";

export function sheetSlug(game: GameId): string {
  switch (game) {
    case "times":
      return "times-tables";
    case "add":
      return "add-subtract";
    case "time":
      return "telling-time";
    default: {
      const neverGame: never = game;
      return neverGame;
    }
  }
}

export function sheetHref(game: GameId, query = ""): string {
  const base = import.meta.env.BASE_URL || "/times-tables/academy/";
  return `${base}worksheets/${sheetSlug(game)}/${query}`;
}

export function squisheeUrl(file: string): string {
  return `/times-tables/squishees/${file}`;
}
