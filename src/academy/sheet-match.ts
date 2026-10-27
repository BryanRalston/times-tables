import { t } from "./i18n";
import { gameCard as gameById, isGameId, type GameId } from "./games/catalog";
import { sheetHref } from "./paths";

/** A free worksheet a parent can open. Static pages use a slug; playable sheets add a query. */
export interface SheetMatch {
  gameId: GameId;
  slug: string;
  query: string;
  titleEn: string;
  titleEs: string;
}

const GAME_TITLE_ES: Record<string, string> = {
  times: "Las tablas",
  add: "Sumar y restar",
  time: "La hora",
  money: "Dinero",
  sight: "Palabras frecuentes",
  spelling: "Deletreo",
  count: "Contar",
  place: "Valor posicional",
  shapes: "Figuras",
  fractions: "Fracciones",
  measure: "Medidas",
  phonics: "Sonidos",
  problems: "Problemas",
  variables: "Qué falta",
  graphs: "Datos",
  share: "Repartos",
  grid: "Cuadrícula",
  patterns: "Patrones",
  signs: "Compara",
  jumps: "10 más",
};

interface NamedSheet {
  slug: string;
  titleEn: string;
  titleEs: string;
}

function named(slug: string, titleEn: string, titleEs: string): NamedSheet {
  return { slug, titleEn, titleEs };
}

/** Static worksheets whose problems actually match the skill. Other skills use the game's own sheet. */
const STATIC: Record<string, NamedSheet> = {
  "time:hour": named("telling-time-to-the-hour", "Telling time to the hour", "La hora en punto"),
  oclock: named("telling-time-to-the-hour", "Telling time to the hour", "La hora en punto"),
  "time:half": named("telling-time-half-hour", "Telling time to the half hour", "La hora y media"),
  halfpast: named("telling-time-half-hour", "Telling time to the half hour", "La hora y media"),
  "time:quarter": named("telling-time-quarter-hour", "Telling time to the quarter hour", "La hora y cuarto"),
  quarterpast: named("telling-time-quarter-hour", "Telling time to the quarter hour", "La hora y cuarto"),
  quarterto: named("telling-time-quarter-hour", "Telling time to the quarter hour", "La hora y cuarto"),
  "time:fives": named("telling-time-five-minutes", "Telling time to five minutes", "La hora de 5 en 5 minutos"),
  "money:count": named("counting-coins", "Counting coins", "Contar monedas"),
  "money:change": named("making-change", "Making change from a dollar", "Dar el cambio de un dólar"),
  "money:dollars": named("dollars-and-cents", "Dollars and cents", "Dólares y centavos"),
  "add:within10": named("addition-within-10", "Addition within 10", "Sumas hasta el 10"),
  make10: named("addition-within-10", "Addition within 10", "Sumas hasta el 10"),
  "add:within20": named("addition-within-20", "Addition within 20", "Sumas hasta el 20"),
  doubles: named("addition-within-20", "Addition within 20", "Sumas hasta el 20"),
  "count:objects": named("counting-to-10", "Counting to 10", "Contar hasta 10"),
  "count:to20": named("counting-to-20", "Counting to 20", "Contar hasta 20"),
  "count:compare": named("counting-to-20", "Counting to 20", "Contar hasta 20"),
  "count:neighbor": named("counting-to-20", "Counting to 20", "Contar hasta 20"),
  "place:blocks": named("place-value-blocks", "Place value blocks", "Bloques de valor posicional"),
  "place:expanded": named("place-value-blocks", "Place value blocks", "Bloques de valor posicional"),
  "place:compare": named("place-value-blocks", "Place value blocks", "Bloques de valor posicional"),
  "place:round10": named("place-value-blocks", "Place value blocks", "Bloques de valor posicional"),
  "place:round100": named("place-value-blocks", "Place value blocks", "Bloques de valor posicional"),
  "place:big": named("place-value-millions", "Place value to 1,000,000", "Valor posicional hasta 1,000,000"),
  "place:roundBig": named("place-value-millions", "Place value to 1,000,000", "Valor posicional hasta 1,000,000"),
  "shapes:color": named("colors-shapes-patterns", "Colors and patterns", "Colores y patrones"),
  "shapes:match": named("colors-shapes-patterns", "Colors and patterns", "Colores y patrones"),
  "shapes:pattern": named("colors-shapes-patterns", "Colors and patterns", "Colores y patrones"),
  "shapes:flat": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:solid": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:sides": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:position": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:sort": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:traits": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:compose": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:faces": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:rows": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:symmetry": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:quads": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:share": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:parts": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:cover": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:fold": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "shapes:angles": named("naming-shapes", "Naming shapes", "Nombrar figuras"),
  "fractions:parts": named("fractions-of-a-whole", "Fractions of a whole", "Fracciones de un entero"),
  "fractions:unit": named("fractions-of-a-whole", "Fractions of a whole", "Fracciones de un entero"),
  "fractions:line": named("fractions-of-a-whole", "Fractions of a whole", "Fracciones de un entero"),
  "fractions:compare": named("fractions-of-a-whole", "Fractions of a whole", "Fracciones de un entero"),
  "fractions:equivalent": named("fractions-of-a-whole", "Fractions of a whole", "Fracciones de un entero"),
  "fractions:shade": named("fractions-of-a-whole", "Fractions of a whole", "Fracciones de un entero"),
  "fractions:addLike": named("fractions-decimals-grade-4", "Like fractions and decimals", "Fracciones iguales y decimales"),
  "fractions:decimals": named("fractions-decimals-grade-4", "Like fractions and decimals", "Fracciones iguales y decimales"),
  "measure:size": named("bigger-and-smaller", "Bigger and smaller", "Más grande y más chico"),
  "measure:compare": named("measuring-length", "Measuring length", "Medir el largo"),
  "measure:ruler": named("measuring-length", "Measuring length", "Medir el largo"),
  "measure:picture": named("measuring-length", "Measuring length", "Medir el largo"),
  "measure:bar": named("measuring-length", "Measuring length", "Medir el largo"),
  "measure:more": named("measuring-length", "Measuring length", "Medir el largo"),
  "measure:area": named("area-perimeter-time-money", "Area, time, and money", "Área, tiempo y dinero"),
  "measure:perimeter": named("area-perimeter-time-money", "Area, time, and money", "Área, tiempo y dinero"),
  "phonics:letters": named("letter-names", "Letter names", "Nombres de las letras"),
  "phonics:begin": named("phonics-beginning-sounds", "Beginning sounds", "Sonidos del principio"),
  "problems:add": named("addition-word-problems", "Addition word problems", "Problemas de suma"),
  "times:mix": named("multiplication-mixed", "Mixed multiplication facts", "Multiplicaciones variadas"),
  "times:toTen": named("multiplication-mixed", "Mixed multiplication facts", "Multiplicaciones variadas"),
  "times:multi": named("multi-digit-multiplication", "Multi-digit multiplication", "Multiplicación de varios dígitos"),
  "times:divide": named("division-remainders", "Division with remainders", "División con residuo"),
};

export function gameIdForSkill(key: string): GameId | null {
  if (key === "doubles" || key === "make10") return "add";
  if (key === "oclock" || key === "halfpast" || key === "quarterpast" || key === "quarterto") return "time";
  const prefix = key.split(":")[0] ?? "";
  if (isGameId(prefix)) return prefix;
  if (prefix === "spell") return "spelling";
  if (prefix === "table") return "times";
  if (prefix === "fact" && /^\d+×\d+$/.test(key.slice(5))) return "times";
  return null;
}

function timesFactFactor(key: string): number | null {
  if (!key.startsWith("fact:")) return null;
  const match = /^(\d+)×(\d+)$/.exec(key.slice(5));
  if (!match) return null;
  const factor = Number(match[1]);
  return Number.isInteger(factor) ? factor : null;
}

function timesFactorSheet(factor: number): SheetMatch {
  if (factor >= 2 && factor <= 10) {
    return {
      gameId: "times",
      slug: `multiplication-${factor}s`,
      query: "",
      titleEn: `Multiplication by ${factor}s`,
      titleEs: `Multiplicación por ${factor}`,
    };
  }
  const query = factor >= 2 && factor <= 12 ? `?factor=${factor}` : "";
  return {
    gameId: "times",
    slug: "times-tables",
    query,
    titleEn: "Times Tables",
    titleEs: "Las tablas",
  };
}

function withGame(gameId: GameId, sheet: NamedSheet): SheetMatch {
  return { gameId, slug: sheet.slug, query: "", titleEn: sheet.titleEn, titleEs: sheet.titleEs };
}

function levelIdFor(gameId: GameId, key: string): string | null {
  if (gameId === "spelling" && key.startsWith("spell:")) return key.slice("spell:".length);
  const prefix = `${gameId}:`;
  if (key.startsWith(prefix)) return key.slice(prefix.length);
  return null;
}

function interactiveSheet(gameId: GameId, key: string): SheetMatch | null {
  const game = gameById(gameId);
  if (!game) return null;
  const levelId = levelIdFor(gameId, key);
  const query = levelId && game.isLevel(levelId) ? `?level=${levelId}` : "";
  return {
    gameId,
    slug: game.sheetSlug,
    query,
    titleEn: game.title,
    titleEs: GAME_TITLE_ES[gameId] ?? game.title,
  };
}

/** The worksheet that practices this skill, when the product has one. */
export function sheetForSkill(key: string): SheetMatch | null {
  const factor = timesFactFactor(key);
  if (factor != null) return timesFactorSheet(factor);
  if (key.startsWith("table:")) {
    const n = Number(key.slice("table:".length));
    if (Number.isInteger(n)) return timesFactorSheet(n);
  }
  const gameId = gameIdForSkill(key);
  if (!gameId) return null;
  const exact = STATIC[key];
  if (exact) return withGame(gameId, exact);
  return interactiveSheet(gameId, key);
}

export function sheetTitle(match: SheetMatch): string {
  return t(match.titleEn, match.titleEs);
}

export function sheetUrl(match: SheetMatch): string {
  return sheetHref(match.slug, match.query);
}

/** First factor of a times fact or table, for the grown-ups link. */
export function timesFactorOf(key: string): number | null {
  const fromFact = timesFactFactor(key);
  if (fromFact != null) return fromFact;
  if (!key.startsWith("table:")) return null;
  const n = Number(key.slice("table:".length));
  return Number.isInteger(n) ? n : null;
}
