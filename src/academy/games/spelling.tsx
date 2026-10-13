import { useEffect, useRef, useState } from "react";
import type { Rng } from "@/lib/rng";
import { gamePill, t } from "../i18n";
import { buddyName, pickTalk } from "./flavor";
import { bandFor } from "../grade-map";
import type { Grade } from "../model";
import { SquisheeImg, cx } from "../ui/bits";
import { qid } from "./choices";
import { SpeakerBar } from "./speaker";
import { ALL_SPELL, isSpellLevel, SPELL_LEVELS, spellWords, type SpellLevel } from "./spell-data";
import type { ChoiceProps, ChoiceQ, GameModule, SheetItem, SpellVisual } from "./types";
import { WordSheet } from "./word-sheet";
import {
  blankOut,
  buildTiles,
  decoyWords,
  dueWordIds,
  extraLetters,
  freshBoard,
  hintLetter,
  liftTile,
  pickFromPrefer,
  placeTile,
  placedWord,
  type TileBoard,
} from "./words";

const LEVELS = [
  { id: "cvc", label: "CVC words", num: 1 },
  { id: "digraphs", label: "Digraphs", num: 2 },
  { id: "blends", label: "Blends", num: 3 },
  { id: "long", label: "Long vowels", num: 4 },
  { id: "patterns", label: "Grade 2–3 patterns", num: 5 },
] as const;

const BARS = [
  { key: "spell:cvc", label: "CVC words" },
  { key: "spell:digraphs", label: "Digraphs" },
  { key: "spell:blends", label: "Blends" },
  { key: "spell:long", label: "Long vowels" },
  { key: "spell:patterns", label: "Grade 2–3 patterns" },
];

const CHIPS = BARS;

export function makeSpellingQuestion(rng: Rng, level: SpellLevel, prefer: string[] = []): ChoiceQ {
  const list = spellWords(level);
  const word = pickFromPrefer(rng, list, prefer);
  const tiles = buildTiles(word.word, extraLetters(word.word, rng), rng);
  const choices = rng.shuffle([word.word, ...decoyWords(word.word)]);
  const sentence = blankOut(word.sentence, word.word);
  const showSentence = level === "patterns";
  const buddy = buddyName(rng);
  return {
    id: qid(rng),
    game: "spelling",
    title: pickTalk(rng, [
      ["Spell the word you hear", "Deletrea la palabra que escuchas"],
      [`${buddy} says a word. Spell it.`, `${buddy} dice una palabra. Deletréala.`],
    ]),
    hint: t("Tap letters to build it. Tap a letter again to put it back.", "Toca las letras para armarla. Toca una letra otra vez para devolverla."),
    praise: t(`Yes! ${word.word}`, `¡Sí! ${word.word}`),
    almost: t(`Almost! ${word.word}. ${word.sentence}`, `¡Casi! ${word.word}. ${word.sentence}`),
    answer: word.word,
    choices,
    skill: `spell:${level}`,
    tags: [level],
    factKey: word.id,
    replay: true,
    visual: {
      kind: "spell",
      word: word.word,
      spoken: `${word.word}. ${word.sentence}`,
      sentence,
      pattern: level,
      patternLabel: word.patternLabel,
      tiles,
      fallback: word.word,
      caption: t("No speaker. Spell this word:", "Sin bocina. Deletrea esta palabra:"),
      bigFallback: true,
      showSentence,
    },
  };
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const list = spellWords(isSpellLevel(level) ? level : "cvc");
  const word = rng.pick(list);
  if (rng.next() < 0.6) {
    return {
      prompt: t(`Trace and write · ${word.patternLabel}`, `Traza y escribe · ${word.patternLabel}`),
      answer: word.word,
      trace: word.word,
    };
  }
  return { prompt: blankOut(word.sentence, word.word), answer: word.word };
}

function labelFor(rows: { key: string; label: string }[], key: string): string | null {
  return rows.find((row) => row.key === key)?.label ?? null;
}

function defaultLevel(grade: Grade): SpellLevel {
  const start = bandFor("spelling", grade)?.start;
  if (isSpellLevel(start)) return start;
  switch (grade) {
    case "K":
      return "cvc";
    case "1":
      return "digraphs";
    case "2":
      return "long";
    case "3":
      return "patterns";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

export function SpellingPrompt({
  question,
  mascot,
  happy,
}: {
  question: ChoiceQ;
  reveal: boolean;
  mascot: string;
  happy: boolean;
}) {
  if (question.visual.kind !== "spell") return null;
  const visual = question.visual;
  return (
    <section className="ac-qcard" data-mode="spell" data-answer={visual.word} data-solution={question.answer}>
      <h1>{question.title}</h1>
      <SquisheeImg id={mascot} className={cx("ac-mascot", happy && "is-happy")} />
      <p className="ac-pattern">{visual.patternLabel}</p>
      <SpeakerBar
        text={visual.spoken}
        fallback={visual.fallback}
        caption={visual.caption}
        large={visual.bigFallback}
        label={t("Hear the word and the sentence", "Escucha la palabra y la oración")}
      />
      {visual.showSentence ? <p className="ac-fill-sentence">{visual.sentence}</p> : null}
      <p className="ac-hint">{question.hint}</p>
    </section>
  );
}

function boardFor(visual: SpellVisual): TileBoard {
  return freshBoard(visual.word, visual.tiles);
}

export function SpellingChoices({ question, reveal, onChoose }: ChoiceProps) {
  const visual = question.visual.kind === "spell" ? question.visual : null;
  const [board, setBoard] = useState<TileBoard | null>(() => (visual ? boardFor(visual) : null));
  const [note, setNote] = useState("");
  const hinted = useRef(false);

  useEffect(() => {
    if (question.visual.kind !== "spell") return;
    setBoard(boardFor(question.visual));
    setNote("");
    hinted.current = false;
  }, [question.id, question.visual]);

  function check() {
    if (reveal || !board || !visual) return;
    const built = placedWord(board);
    if (built.length === 0) {
      setNote(t("Tap the letters you hear.", "Toca las letras que escuchas."));
      return;
    }
    if (built === visual.word) {
      onChoose(visual.word, hinted.current);
      return;
    }
    if (!hinted.current) {
      hinted.current = true;
      setBoard(hintLetter(board));
      setNote(t("Almost! Here is a letter.", "¡Casi! Aquí va una letra."));
      return;
    }
    if (board.locked === 0) return;
    onChoose(built, false);
  }

  useEffect(() => {
    if (!board || reveal) return;
    function onKey(event: KeyboardEvent) {
      if (!board || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Backspace") {
        const index = board.placed.length - 1;
        const last = board.placed[index];
        if (!last || index < board.locked) return;
        event.preventDefault();
        setBoard(liftTile(board, last.id));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        check();
        return;
      }
      if (!/^[a-z]$/i.test(event.key)) return;
      const tile = board.pool.find((item) => item.letter === event.key.toLowerCase());
      if (!tile) return;
      event.preventDefault();
      setBoard(placeTile(board, tile.id));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!visual || !board) return null;

  return (
    <div className="ac-spell">
      <div className="ac-slots" aria-label={t("Your word", "Tu palabra")}>
        {Array.from({ length: visual.word.length }, (_, index) => {
          const tile = board.placed[index];
          const locked = index < board.locked;
          return (
            <button
              key={tile ? tile.id : `slot-${index}`}
              type="button"
              className={cx("ac-slot", locked && "is-lock", !tile && "is-empty")}
              aria-label={tile ? t(`Remove ${tile.letter}`, `Quita ${tile.letter}`) : t("Empty spot", "Espacio vacío")}
              disabled={reveal || !tile || locked}
              onClick={() => tile && setBoard(liftTile(board, tile.id))}
            >
              {tile ? tile.letter : ""}
            </button>
          );
        })}
      </div>
      <div className="ac-tiles">
        {board.pool.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className="ac-tile"
            data-tile={tile.letter}
            aria-label={t(`Letter ${tile.letter}`, `Letra ${tile.letter}`)}
            disabled={reveal}
            onClick={() => setBoard(placeTile(board, tile.id))}
          >
            {tile.letter}
          </button>
        ))}
      </div>
      <p className="ac-tile-note" aria-live="polite">
        {note}
      </p>
      <button type="button" className="ac-check" data-check="spell" disabled={reveal} onClick={check}>
        {t("Check", "Revisar")}
      </button>
    </div>
  );
}

export const spellingGame = {
  id: "spelling",
  title: "Spelling",
  audience: "K–3",
  tint: "sky",
  mascot: "owl",
  sheetSlug: "spelling",
  sheetScreen: "sheet-spelling",
  blurb:
    "Free spelling for grades K–3. Hear a word in a sentence, then build it from letter tiles. Lists move from CVC words to digraphs, blends, long vowels, and common grade 2 and 3 patterns.",
  sheetCount: 12,
  layout: "card",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "cvc",
  isLevel: isSpellLevel,
  pill: (level) => gamePill("Spelling", level.num),
  makeQuestion: (rng, level, prefer) => makeSpellingQuestion(rng, isSpellLevel(level) ? level : "cvc", prefer),
  makeSheetItem: sheetItem,
  Prompt: SpellingPrompt,
  Choices: SpellingChoices,
  SheetBody: WordSheet,
  bars: BARS,
  chips: CHIPS,
  skillLabel: (key) => labelFor(BARS, key),
  chipLabel: (key) => labelFor(CHIPS, key),
  reviewKeys: (words) => dueWordIds(words, ALL_SPELL.map((word) => word.id)),
} satisfies GameModule;

export { SPELL_LEVELS };
