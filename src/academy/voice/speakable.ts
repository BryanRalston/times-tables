import { arabicFraction, chineseFraction, frenchFraction, getLocale, hindiFraction, portugueseFraction, spanishFraction } from "../i18n";

const NUMBER_WORD = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

const FRACTION_WORD: Record<string, [string, string]> = {
  "2": ["half", "halves"],
  "3": ["third", "thirds"],
  "4": ["fourth", "fourths"],
  "5": ["fifth", "fifths"],
  "6": ["sixth", "sixths"],
  "8": ["eighth", "eighths"],
  "10": ["tenth", "tenths"],
  "12": ["twelfth", "twelfths"],
};

/** "1/2" is spoken as "one half", so a voice does not say "slash". */
function speakFractions(text: string): string {
  return text.replace(/\b(\d+)\/(\d+)\b/g, (full, numText: string, denText: string) => {
    const num = Number(numText);
    const den = Number(denText);
    if (getLocale() === "es") return spanishFraction(num, den);
    if (getLocale() === "pt") return portugueseFraction(num, den);
    if (getLocale() === "fr") return frenchFraction(num, den);
    if (getLocale() === "zh") return chineseFraction(num, den);
    if (getLocale() === "ar") return arabicFraction(num, den);
    if (getLocale() === "hi") return hindiFraction(num, den);
    const pair = FRACTION_WORD[denText];
    if (!pair) return full;
    const numWord = NUMBER_WORD[num] ?? numText;
    return `${numWord} ${num === 1 ? pair[0] : pair[1]}`;
  });
}

const SUPER_DIGIT: Record<string, string> = {
  "\u2070": "0",
  "\u00b9": "1",
  "\u00b2": "2",
  "\u00b3": "3",
  "\u2074": "4",
  "\u2075": "5",
  "\u2076": "6",
  "\u2077": "7",
  "\u2078": "8",
  "\u2079": "9",
};

/** "7^2" or "7²" is spoken as "7 squared"; other powers say "to the power of". */
function speakPower(base: string, exp: string): string {
  const locale = getLocale();
  if (locale === "es") return exp === "2" ? `${base} al cuadrado` : `${base} a la potencia de ${exp}`;
  if (locale === "pt") return exp === "2" ? `${base} ao quadrado` : `${base} elevado a ${exp}`;
  if (locale === "fr") return exp === "2" ? `${base} au carré` : `${base} à la puissance ${exp}`;
  if (locale === "zh") return exp === "2" ? `${base}的平方` : `${base}的${exp}次方`;
  if (locale === "hi") return exp === "2" ? `${base} का वर्ग` : `${base} की घात ${exp}`;
  if (locale === "ar") return exp === "2" ? `${base} تربيع` : `${base} أس ${exp}`;
  return exp === "2" ? `${base} squared` : `${base} to the power of ${exp}`;
}

function speakExponents(text: string): string {
  const fromCaret = text.replace(/(\d+)\^(\d+)/g, (_full, base: string, exp: string) => speakPower(base, exp));
  return fromCaret.replace(/(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_full, base: string, sup: string) => {
    const exp = [...sup].map((ch) => SUPER_DIGIT[ch] ?? ch).join("");
    return speakPower(base, exp);
  });
}

/** Turn math marks into words a recorded clip can match. */
export function speakable(text: string): string {
  const fractions = speakFractions(speakExponents(text));
  if (getLocale() === "es") {
    return fractions
      .replace(/×/g, " por ")
      .replace(/−/g, " menos ")
      .replace(/\+/g, " más ")
      .replace(/=/g, " igual ")
      .replace(/(\d+)¢/g, (_full, n: string) => (Number(n) === 1 ? "1 centavo" : `${n} centavos`))
      .replace(/¢/g, " centavos")
      .replace(/\$(\d+)/g, (_full, n: string) => (Number(n) === 1 ? "1 dólar" : `${n} dólares`));
  }
  if (getLocale() === "pt") {
    return fractions
      .replace(/×/g, " vezes ")
      .replace(/−/g, " menos ")
      .replace(/\+/g, " mais ")
      .replace(/=/g, " igual ")
      .replace(/(\d+)¢/g, (_full, n: string) => (Number(n) === 1 ? "1 centavo" : `${n} centavos`))
      .replace(/¢/g, " centavos")
      .replace(/\$(\d+)/g, (_full, n: string) => (Number(n) === 1 ? "1 dólar" : `${n} dólares`));
  }
  if (getLocale() === "fr") {
    return fractions
      .replace(/×/g, " fois ")
      .replace(/−/g, " moins ")
      .replace(/\+/g, " plus ")
      .replace(/=/g, " égal ")
      .replace(/(\d+)¢/g, (_full, n: string) => (Number(n) === 1 ? "1 cent" : `${n} cents`))
      .replace(/¢/g, " cents")
      .replace(/\$(\d+)/g, (_full, n: string) => (Number(n) === 1 ? "1 dollar" : `${n} dollars`));
  }
  if (getLocale() === "ar") {
    return fractions
      .replace(/×/g, " ضرب ")
      .replace(/−/g, " ناقص ")
      .replace(/\+/g, " زائد ")
      .replace(/=/g, " يساوي ")
      .replace(/(\d+)¢/g, "$1 سنت")
      .replace(/¢/g, " سنت")
      .replace(/\$(\d+)/g, "$1 دولار");
  }
  if (getLocale() === "hi") {
    return fractions
      .replace(/×/g, " गुणा ")
      .replace(/−/g, " घटा ")
      .replace(/\+/g, " जमा ")
      .replace(/=/g, " बराबर ")
      .replace(/(\d+)¢/g, "$1 सेंट")
      .replace(/¢/g, " सेंट")
      .replace(/\$(\d+)/g, "$1 डॉलर");
  }
  if (getLocale() === "zh") {
    return fractions
      .replace(/×/g, "乘")
      .replace(/−/g, "减")
      .replace(/\+/g, "加")
      .replace(/=/g, "等于")
      .replace(/(\d+)¢/g, "$1美分")
      .replace(/¢/g, "美分")
      .replace(/\$(\d+)/g, "$1美元");
  }
  return fractions
    .replace(/×/g, " times ")
    .replace(/−/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/=/g, " equals ")
    .replace(/¢/g, " cents")
    .replace(/\$(\d+)/g, "$1 dollars");
}
