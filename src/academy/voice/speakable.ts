import { chineseFraction, frenchFraction, getLocale, portugueseFraction, spanishFraction } from "../i18n";

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
    const pair = FRACTION_WORD[denText];
    if (!pair) return full;
    const numWord = NUMBER_WORD[num] ?? numText;
    return `${numWord} ${num === 1 ? pair[0] : pair[1]}`;
  });
}

/** Turn math marks into words a recorded clip can match. */
export function speakable(text: string): string {
  const fractions = speakFractions(text);
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
