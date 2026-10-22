import { GRADE_BANDS } from "./grade-map";
import { gameIdForSkill } from "./sheet-match";
import { t } from "./i18n";

/**
 * One Common Core code per skill. Codes come from the grade map
 * (`GRADE_BANDS`). The plain name is what a parent reads on the report.
 */
const LEVEL_STANDARD: Record<string, Record<string, string>> = {
  times: {
    count: "2.OA.C.4",
    twos: "2.OA.C.4",
    mix: "3.OA.C.7",
    toTen: "3.OA.C.7",
    factors: "4.OA.B.4",
    multi: "4.NBT.B.5",
    divide: "4.NBT.B.6",
  },
  add: {
    within5: "K.OA.A.2",
    within10: "K.OA.A.2",
    within20: "1.OA.C.6",
    tens: "1.NBT.C.4",
    within100: "2.NBT.B.5",
    within1000: "3.NBT.A.2",
    thousands: "4.NBT.B.4",
  },
  time: {
    hour: "1.MD.B.3",
    half: "1.MD.B.3",
    quarter: "2.MD.C.7",
    fives: "2.MD.C.7",
    elapsed: "4.MD.A.2",
  },
  money: {
    name: "2.MD.C.8",
    count: "2.MD.C.8",
    make: "2.MD.C.8",
    change: "2.MD.C.8",
    dollars: "2.MD.C.8",
    spend: "4.MD.A.2",
  },
  sight: {
    preprimer: "RF.K.3.C",
    primer: "RF.K.3.C",
    first: "RF.1.3.G",
    second: "RF.2.3.F",
    third: "RF.3.3.D",
    fourth: "L.4.6",
  },
  spelling: {
    cvc: "RF.K.3.A",
    digraphs: "RF.1.3.A",
    blends: "RF.1.3.B",
    long: "RF.1.3.C",
    patterns: "RF.2.3.B",
    grade4: "L.4.2",
  },
  count: {
    objects: "K.CC.A.1",
    to20: "K.CC.A.2",
    compare: "K.CC.C.6",
    neighbor: "1.NBT.A.1",
    subitize: "K.CC.B.5",
    tenframe: "2.NBT.A.1",
    build: "2.NBT.A.1",
  },
  place: {
    blocks: "1.NBT.B.2",
    expanded: "2.NBT.A.3",
    compare: "2.NBT.A.4",
    round10: "3.NBT.A.1",
    round100: "3.NBT.A.1",
    build: "2.NBT.A.1",
    big: "4.NBT.A.1",
    roundBig: "4.NBT.A.3",
  },
  shapes: {
    color: "K.G.A.2",
    match: "K.G.A.2",
    pattern: "K.G.A.2",
    flat: "K.G.A.2",
    solid: "K.G.A.2",
    position: "K.G.A.1",
    sort: "K.G.B.4",
    traits: "1.G.A.1",
    compose: "1.G.A.2",
    sides: "1.G.A.1",
    faces: "2.G.A.1",
    rows: "2.G.A.2",
    symmetry: "2.G.A.1",
    quads: "3.G.A.1",
    share: "3.G.A.2",
    parts: "3.G.A.2",
    cover: "3.MD.C.7",
    fold: "4.G.A.3",
    angles: "4.G.A.1",
  },
  fractions: {
    parts: "1.G.A.3",
    unit: "2.G.A.3",
    line: "2.G.A.3",
    compare: "2.G.A.3",
    equivalent: "3.NF.A.3",
    shade: "3.NF.A.1",
    addLike: "4.NF.B.3",
    decimals: "4.NF.C.6",
  },
  measure: {
    size: "K.MD.A.2",
    compare: "K.MD.A.2",
    picture: "1.MD.C.4",
    bar: "1.MD.C.4",
    ruler: "2.MD.A.1",
    more: "3.MD.B.3",
    area: "4.MD.A.3",
    perimeter: "4.MD.A.3",
  },
  phonics: {
    letters: "RF.K.1.D",
    sounds: "RF.K.3.A",
    begin: "RF.K.3.A",
    rhyme: "RF.K.2.A",
    cvc: "RF.2.3.B",
    end: "RF.K.2.D",
  },
  problems: {
    add: "K.OA.A.2",
    sub: "1.OA.A.1",
    mult: "2.OA.A.1",
    div: "3.OA.A.3",
    picture: "3.OA.A.3",
    steps: "4.OA.A.3",
  },
  variables: {
    addend: "K.OA.A.4",
    either: "1.OA.D.8",
    factor: "2.OA.C.4",
    times: "3.OA.A.4",
    steps: "4.OA.A.3",
  },
  graphs: {
    sort: "K.MD.B.3",
    tally: "1.MD.C.4",
    picture: "2.MD.D.10",
    bar: "2.MD.D.10",
    scale: "3.MD.B.3",
    line: "4.MD.B.4",
  },
};

const CHIP_SKILL: Record<string, string> = {
  doubles: "add:within20",
  make10: "add:within10",
  oclock: "time:hour",
  halfpast: "time:half",
  quarterpast: "time:quarter",
  quarterto: "time:quarter",
};

const NAMES: Record<string, { en: string; es: string }> = {
  "K.CC.A.1": { en: "Count in order", es: "Contar en orden" },
  "K.CC.A.2": { en: "Count on from a number", es: "Contar desde un número" },
  "K.CC.B.4": { en: "The last number is how many", es: "El último número es cuántos hay" },
  "K.CC.B.5": { en: "Count how many", es: "Contar cuántos hay" },
  "K.CC.C.6": { en: "Compare two groups", es: "Comparar dos grupos" },
  "K.OA.A.2": { en: "Add and subtract within 10", es: "Sumar y restar hasta el 10" },
  "K.OA.A.4": { en: "Find the number that makes 10", es: "Hallar el número que completa 10" },
  "K.OA.A.5": { en: "Add and subtract within 5", es: "Sumar y restar hasta el 5" },
  "K.MD.A.1": { en: "Describe length or size", es: "Describir el largo o el tamaño" },
  "K.MD.A.2": { en: "Compare two objects", es: "Comparar dos objetos" },
  "K.MD.B.3": { en: "Sort and count", es: "Clasificar y contar" },
  "K.G.A.1": { en: "Say where a shape is", es: "Decir dónde está una figura" },
  "K.G.A.2": { en: "Name shapes", es: "Nombrar figuras" },
  "K.G.B.4": { en: "Compare shapes", es: "Comparar figuras" },
  "1.OA.A.1": { en: "Word problems within 20", es: "Problemas hasta el 20" },
  "1.OA.C.5": { en: "Count on to add", es: "Contar para sumar" },
  "1.OA.C.6": { en: "Add and subtract within 20", es: "Sumar y restar hasta el 20" },
  "1.OA.D.8": { en: "Find the missing number", es: "Hallar el número que falta" },
  "1.NBT.A.1": { en: "Count to 120", es: "Contar hasta 120" },
  "1.NBT.B.2": { en: "Tens and ones", es: "Decenas y unidades" },
  "1.NBT.B.3": { en: "Compare two-digit numbers", es: "Comparar números de dos cifras" },
  "1.NBT.C.4": { en: "Add a two-digit number", es: "Sumar un número de dos cifras" },
  "1.MD.B.3": { en: "Tell time to the hour and half hour", es: "Decir la hora en punto y la media" },
  "1.MD.C.4": { en: "Read a graph", es: "Leer una gráfica" },
  "1.G.A.1": { en: "Name the parts of a shape", es: "Nombrar las partes de una figura" },
  "1.G.A.2": { en: "Join shapes", es: "Unir figuras" },
  "1.G.A.3": { en: "Halves and fourths", es: "Mitades y cuartos" },
  "2.OA.A.1": { en: "Word problems within 100", es: "Problemas hasta el 100" },
  "2.OA.B.2": { en: "Add and subtract within 20", es: "Sumar y restar hasta el 20" },
  "2.OA.C.4": { en: "Equal groups", es: "Grupos iguales" },
  "2.NBT.A.1": { en: "Hundreds, tens, and ones", es: "Centenas, decenas y unidades" },
  "2.NBT.A.2": { en: "Skip-count by 5s, 10s, and 100s", es: "Contar de 5 en 5, de 10 en 10 y de 100 en 100" },
  "2.NBT.A.3": { en: "Read and write numbers to 1000", es: "Leer y escribir números hasta el 1000" },
  "2.NBT.A.4": { en: "Compare three-digit numbers", es: "Comparar números de tres cifras" },
  "2.NBT.B.5": { en: "Add and subtract within 100", es: "Sumar y restar hasta el 100" },
  "2.MD.A.1": { en: "Measure length", es: "Medir el largo" },
  "2.MD.D.10": { en: "Picture and bar graphs", es: "Gráficas de dibujos y de barras" },
  "2.MD.C.7": { en: "Tell time to five minutes", es: "Decir la hora de 5 en 5 minutos" },
  "2.MD.C.8": { en: "Count coins and bills", es: "Contar monedas y billetes" },
  "2.G.A.1": { en: "Name shapes by their sides", es: "Nombrar figuras por sus lados" },
  "2.G.A.2": { en: "Count the squares in a rectangle", es: "Contar los cuadrados de un rectángulo" },
  "2.G.A.3": { en: "Halves, thirds, and fourths", es: "Mitades, tercios y cuartos" },
  "3.OA.A.1": { en: "Understand multiplication", es: "Entender la multiplicación" },
  "3.OA.A.3": { en: "Multiplication and division stories", es: "Historias de multiplicar y dividir" },
  "3.OA.A.4": { en: "Find a missing factor", es: "Hallar un factor que falta" },
  "3.OA.C.7": { en: "Multiply and divide within 100", es: "Multiplicar y dividir hasta el 100" },
  "3.NBT.A.1": { en: "Round to 10 or 100", es: "Redondear a la decena o a la centena" },
  "3.NBT.A.2": { en: "Add and subtract within 1000", es: "Sumar y restar hasta el 1000" },
  "3.NF.A.1": { en: "Understand a fraction", es: "Entender una fracción" },
  "3.NF.A.2": { en: "Fractions on a number line", es: "Fracciones en la recta" },
  "3.NF.A.3": { en: "Equivalent fractions", es: "Fracciones equivalentes" },
  "3.MD.A.1": { en: "Tell time to the minute", es: "Decir la hora al minuto" },
  "3.MD.B.3": { en: "Read a bar graph", es: "Leer una gráfica de barras" },
  "3.MD.C.5": { en: "Understand area", es: "Entender el área" },
  "3.MD.C.7": { en: "Find the area of a rectangle", es: "Hallar el área de un rectángulo" },
  "3.G.A.1": { en: "Sort shapes", es: "Clasificar figuras" },
  "3.G.A.2": { en: "Equal parts of a shape", es: "Partes iguales de una figura" },
  "4.OA.A.2": { en: "Multiply or divide to compare", es: "Multiplicar o dividir para comparar" },
  "4.OA.A.3": { en: "Multi-step word problems", es: "Problemas de varios pasos" },
  "4.OA.B.4": { en: "Factors and multiples", es: "Factores y múltiplos" },
  "4.NBT.A.1": { en: "A digit's place value", es: "El valor de una cifra" },
  "4.NBT.A.2": { en: "Read and compare big numbers", es: "Leer y comparar números grandes" },
  "4.NBT.A.3": { en: "Round big numbers", es: "Redondear números grandes" },
  "4.NBT.B.4": { en: "Add and subtract big numbers", es: "Sumar y restar números grandes" },
  "4.NBT.B.5": { en: "Multiply multi-digit numbers", es: "Multiplicar números de varias cifras" },
  "4.NBT.B.6": { en: "Divide and find a remainder", es: "Dividir y hallar el residuo" },
  "4.NF.A.1": { en: "Explain equivalent fractions", es: "Explicar fracciones equivalentes" },
  "4.NF.B.3": { en: "Add and subtract fractions", es: "Sumar y restar fracciones" },
  "4.NF.C.6": { en: "Decimals and fractions", es: "Decimales y fracciones" },
  "4.NF.C.7": { en: "Compare decimals", es: "Comparar decimales" },
  "4.MD.A.2": { en: "Problems with time, money, or size", es: "Problemas de tiempo, dinero o medida" },
  "4.MD.A.3": { en: "Area and perimeter", es: "Área y perímetro" },
  "4.MD.B.4": { en: "Line plots with fractions", es: "Diagramas de puntos con fracciones" },
  "4.MD.C.5": { en: "Understand angles", es: "Entender los ángulos" },
  "4.G.A.1": { en: "Lines and angles", es: "Líneas y ángulos" },
  "4.G.A.3": { en: "A line of symmetry", es: "Un eje de simetría" },
  "RF.K.1.D": { en: "Name the letters", es: "Nombrar las letras" },
  "RF.K.2.A": { en: "Hear rhymes", es: "Escuchar rimas" },
  "RF.K.2.D": { en: "Hear sounds in a word", es: "Escuchar los sonidos de una palabra" },
  "RF.K.3.A": { en: "Know letter sounds", es: "Conocer el sonido de las letras" },
  "RF.K.3.C": { en: "Read common words", es: "Leer palabras frecuentes" },
  "RF.1.2.B": { en: "Blend sounds into a word", es: "Juntar sonidos para formar una palabra" },
  "RF.1.2.C": { en: "Hear the first, middle, or last sound", es: "Escuchar el primer, el medio o el último sonido" },
  "RF.1.3.A": { en: "Read digraphs", es: "Leer dígrafos" },
  "RF.1.3.B": { en: "Read short words", es: "Leer palabras cortas" },
  "RF.1.3.C": { en: "Read long-vowel words", es: "Leer palabras con vocal larga" },
  "RF.1.3.G": { en: "Read sight words", es: "Leer palabras frecuentes" },
  "RF.2.3.A": { en: "Tell long and short vowels", es: "Distinguir vocales largas y cortas" },
  "RF.2.3.B": { en: "Use spelling patterns", es: "Usar patrones de deletreo" },
  "RF.2.3.F": { en: "Read second-grade sight words", es: "Leer palabras frecuentes de segundo" },
  "RF.3.3.A": { en: "Read prefixes and suffixes", es: "Leer prefijos y sufijos" },
  "RF.3.3.C": { en: "Read longer words", es: "Leer palabras más largas" },
  "RF.3.3.D": { en: "Read third-grade sight words", es: "Leer palabras frecuentes de tercero" },
  "RF.4.3.A": { en: "Use word parts to read", es: "Usar partes de la palabra para leer" },
  "L.4.2": { en: "Spell grade 4 words", es: "Deletrear palabras de cuarto" },
  "L.4.4": { en: "Figure out a new word", es: "Descubrir una palabra nueva" },
  "L.4.6": { en: "Use grade 4 vocabulary", es: "Usar vocabulario de cuarto" },
};

/** Every code the grade map names, for the report's plain-language check. */
export function gradeMapStandardCodes(): string[] {
  const codes = new Set<string>();
  for (const bands of Object.values(GRADE_BANDS)) {
    for (const row of Object.values(bands)) {
      for (const code of row.standards) codes.add(code);
    }
  }
  return [...codes];
}

export function standardName(code: string): string {
  const row = NAMES[code];
  if (!row) return "";
  return t(row.en, row.es);
}

function levelIdOf(gameId: string, key: string): string | null {
  if (gameId === "spelling" && key.startsWith("spell:")) return key.slice("spell:".length);
  const prefix = `${gameId}:`;
  if (key.startsWith(prefix)) return key.slice(prefix.length);
  return null;
}

function timesCode(key: string): string | null {
  if (key.startsWith("table:")) {
    const n = Number(key.slice("table:".length));
    if (!Number.isInteger(n)) return null;
    if (n === 2 || n === 5 || n === 10) return "2.OA.C.4";
    if (n >= 1 && n <= 10) return "3.OA.C.7";
    return "4.NBT.B.5";
  }
  if (!key.startsWith("fact:")) return null;
  const match = /^(\d+)×(\d+)$/.exec(key.slice("fact:".length));
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  const small = (n: number) => n === 1 || n === 2 || n === 5 || n === 10;
  if (small(a) && small(b)) return "2.OA.C.4";
  if (a <= 10 && b <= 10) return "3.OA.C.7";
  return "4.NBT.B.5";
}

function codeFor(key: string): string | null {
  const aliased = CHIP_SKILL[key] ?? key;
  const fromTimes = timesCode(aliased);
  if (fromTimes) return fromTimes;
  const gameId = gameIdForSkill(aliased);
  if (!gameId) return null;
  const levelId = levelIdOf(gameId, aliased);
  if (!levelId) return null;
  return LEVEL_STANDARD[gameId]?.[levelId] ?? null;
}

export interface NamedStandard {
  code: string;
  name: string;
}

/** The grade-map standard for this skill, with a short parent-facing name. */
export function standardForSkill(key: string): NamedStandard | null {
  const code = codeFor(key);
  if (!code) return null;
  const name = standardName(code);
  if (!name) return null;
  return { code, name };
}

/** `1.MD.B.3 · Tell time to the hour and half hour` in the current language. */
export function standardLine(key: string): string {
  const row = standardForSkill(key);
  if (!row) return "";
  return `${row.code} · ${row.name}`;
}
