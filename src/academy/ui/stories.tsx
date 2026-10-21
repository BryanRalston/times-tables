import { useEffect, useRef, useState } from "react";
import { autoSpeakGrade, type Grade, type SkillStat } from "../model";
import { starsForRound } from "../rewards";
import { storyGradeLabel } from "../stories/band";
import type { Story } from "../stories/catalog";
import { knownStory, openStory, stepReader, storiesForGrade, storiesOffered, storyScore, type ReaderState } from "../stories/engine";
import { lineTokens } from "../stories/read";
import { blip, chime, teachTone } from "../sound";
import { show, t } from "../i18n";
import { ensureVoice } from "../voice/clips";
import { startClipSpeech, startWordClips, stopClipSpeech } from "../voice/player";
import { BackLink, SquisheeImg, Stars, cx } from "./bits";
import { StoryPicture, StoryScene } from "./story-scene";

const YES = "Yes!";
const LOOK = "Let's look together.";

function StoriesHidden() {
  return (
    <div className="ac-shell ac-mid" data-stories="hidden">
      <header className="ac-top">
        <BackLink>{t("Back to games", "Volver a los juegos")}</BackLink>
      </header>
      <h1>{t("Stories", "Cuentos")}</h1>
      <p className="ac-lede">
        {t(
          "Stories are in English.",
          "Los cuentos están en inglés por ahora. Cambia a English en Ajustes para leerlos.",
        )}
      </p>
    </div>
  );
}

export function StoriesShelf({ grade, skills }: { grade: Grade; skills: Record<string, SkillStat> }) {
  if (!storiesOffered()) return <StoriesHidden />;
  const books = storiesForGrade(grade);
  const groups: { grade: Story["grade"]; books: Story[] }[] = [];
  for (const story of books) {
    const last = groups[groups.length - 1];
    if (!last || last.grade !== story.grade) groups.push({ grade: story.grade, books: [story] });
    else last.books.push(story);
  }
  return (
    <div className="ac-shell" data-stories="open">
      <header className="ac-top">
        <BackLink>{show("Games")}</BackLink>
      </header>
      <h1>{show("Stories")}</h1>
      <p className="ac-lede">{show("Read along")}</p>
      {groups.map((group) => (
        <section key={group.grade} className="ac-story-group" aria-label={storyGradeLabel(group.grade)}>
          <h2>{storyGradeLabel(group.grade)}</h2>
          <div className="ac-story-list">
            {group.books.map((story) => {
              const done = (skills[`story:${story.id}`]?.ok ?? 0) > 0;
              const pal = story.cast[0] ?? "peach";
              return (
                <a key={story.id} className="ac-story-card" href={`#/stories/${story.id}`} data-story-id={story.id}>
                  <SquisheeImg id={pal} className="ac-story-card-pal" squish="off" />
                  <span>
                    <strong>{story.title}</strong>
                    <small>
                      {story.pages.length} {show("pages")}
                      {done ? ` · ${show("Read")}` : ""}
                    </small>
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function StoryWords({
  text,
  active,
  onWord,
}: {
  text: string;
  active: number;
  onWord: (index: number) => void;
}) {
  const tokens = lineTokens(text);
  return (
    <p className="ac-story-line">
      {tokens.map((token, index) => (
        <button
          key={`${token.key}-${index}`}
          type="button"
          className={cx("ac-story-word", active === index && "is-now")}
          data-story-word={token.key}
          aria-current={active === index ? "true" : undefined}
          onClick={() => onWord(index)}
        >
          {token.text}
        </button>
      ))}
    </p>
  );
}

export function StoryReader({
  story,
  grade,
  sound,
  onFinish,
}: {
  story: Story;
  grade: Grade;
  sound: boolean;
  onFinish: (result: { id: string; correct: number; total: number; seconds: number }) => void;
}) {
  const [state, setState] = useState<ReaderState>(() => openStory(story.checks.length));
  const [active, setActive] = useState(-1);
  const started = useRef(Date.now());
  const sent = useRef(false);
  const hold = useRef(false);
  const wait = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearWait() {
    if (wait.current != null) window.clearTimeout(wait.current);
    wait.current = null;
  }

  function playText(text: string) {
    if (!sound) return;
    const tokens = lineTokens(text);
    setActive(-1);
    void ensureVoice().then(() => {
      const startedPlay = startWordClips(
        tokens.map((token) => ({ key: token.key, gapAfterMs: token.gapAfterMs })),
        (index) => setActive(index),
        () => setActive(-1),
        () => setActive(-1),
      );
      if (!startedPlay) setActive(-1);
    });
  }

  useEffect(() => {
    return () => {
      clearWait();
      stopClipSpeech();
    };
  }, []);

  useEffect(() => {
    if (hold.current) {
      hold.current = false;
      return;
    }
    if (state.phase === "done") return;
    const text = state.phase === "page" ? (story.pages[state.page]?.text ?? "") : (story.checks[state.check]?.prompt ?? "");
    const auto = state.phase === "check" || state.returnTo != null || autoSpeakGrade(grade);
    if (!auto || !text) return;
    playText(text);
  }, [state.phase, state.page, state.check, state.returnTo, grade, story, sound]);

  useEffect(() => {
    if (state.phase !== "done" || sent.current) return;
    sent.current = true;
    const score = storyScore(state);
    onFinish({
      id: story.id,
      correct: score.correct,
      total: score.total,
      seconds: Math.max(1, Math.round((Date.now() - started.current) / 1000)),
    });
  }, [state, onFinish, story.id]);

  function speakThen(line: string, follow: string | null) {
    hold.current = true;
    clearWait();
    if (sound) void ensureVoice().then(() => startClipSpeech(line, 1, () => {}));
    else stopClipSpeech();
    if (!follow) return;
    wait.current = window.setTimeout(() => {
      wait.current = null;
      playText(follow);
    }, 1400);
  }

  const page = story.pages[state.page] ?? story.pages[0];
  if (!page) return null;

  if (state.phase === "done") {
    const score = storyScore(state);
    const stars = starsForRound(score.correct, Math.max(1, score.total));
    return (
      <div className="ac-shell ac-mid" data-story-phase="done" data-story-id={story.id}>
        <StoryScene mood={page.mood} pals={page.pals} prop={page.prop} />
        <h1>{YES}</h1>
        <Stars value={stars} />
        <a className="ac-go" href="#/stories">
          {show("Stories")}
        </a>
      </div>
    );
  }

  if (state.phase === "check") {
    const check = story.checks[state.check];
    if (!check) return null;
    return (
      <div className="ac-shell ac-mid" data-story-phase="check" data-story-id={story.id} data-story-check={state.check}>
        <header className="ac-top">
          <a className="ac-back" href="#/stories">
            {show("Stories")}
          </a>
        </header>
        <StoryWords
          text={check.prompt}
          active={active}
          onWord={(index) => {
            const token = lineTokens(check.prompt)[index];
            if (!token || !sound) return;
            startWordClips(
              [{ key: token.key, gapAfterMs: 60 }],
              () => setActive(index),
              () => setActive(-1),
              () => setActive(-1),
            );
          }}
        />
        <div className="ac-story-choices">
          {check.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className="ac-story-choice"
              data-story-choice={choice.id}
              aria-label={choice.label}
              onClick={() => {
                const next = stepReader(state, { type: "answer", choice: choice.id, answer: check.answer, page: check.page });
                const follow =
                  next.phase === "page"
                    ? (story.pages[next.page]?.text ?? null)
                    : next.phase === "check"
                      ? (story.checks[next.check]?.prompt ?? null)
                      : null;
                if (choice.id === check.answer) {
                  blip(true, sound);
                  if (next.phase === "done") chime("cheer", sound);
                  speakThen(YES, follow);
                } else {
                  teachTone(sound);
                  speakThen(LOOK, follow);
                }
                setState(next);
              }}
            >
              <StoryPicture picture={choice.picture} label={choice.label} />
              <span>{choice.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const tokens = lineTokens(page.text);
  return (
    <div className="ac-shell ac-mid" data-story-phase="page" data-story-id={story.id} data-story-page={state.page}>
      <header className="ac-top">
        <a className="ac-back" href="#/stories">
          {show("Stories")}
        </a>
        <span className="ac-story-count">
          <span className="ac-sr">
            {show("Page")} {state.page + 1} / {story.pages.length}
          </span>
          {story.pages.map((_, index) => (
            <i key={index} className={index === state.page ? "is-on" : ""} />
          ))}
        </span>
      </header>
      <StoryScene mood={page.mood} pals={page.pals} prop={page.prop} />
      <StoryWords
        text={page.text}
        active={active}
        onWord={(index) => {
          const token = tokens[index];
          if (!token || !sound) return;
          startWordClips(
            [{ key: token.key, gapAfterMs: token.gapAfterMs }],
            () => setActive(index),
            () => setActive(-1),
            () => setActive(-1),
          );
        }}
      />
      <button type="button" className="ac-story-read" data-story-read onClick={() => playText(page.text)}>
        {show("Read to me")}
      </button>
      <div className="ac-story-nav">
        <button
          type="button"
          className="ac-quiet"
          data-story-back
          disabled={state.returnTo != null || state.page <= 0}
          onClick={() => {
            stopClipSpeech();
            clearWait();
            setState((current) => stepReader(current, { type: "back", pages: story.pages.length }));
          }}
        >
          {show("Back")}
        </button>
        <button
          type="button"
          className="ac-go"
          data-story-next
          onClick={() => {
            stopClipSpeech();
            clearWait();
            setState((current) => stepReader(current, { type: "next", pages: story.pages.length }));
          }}
        >
          {show("Next")}
        </button>
      </div>
    </div>
  );
}

export function StoriesRoute({
  storyId,
  grade,
  skills,
  sound,
  onFinish,
}: {
  storyId: string;
  grade: Grade;
  skills: Record<string, SkillStat>;
  sound: boolean;
  onFinish: (result: { id: string; correct: number; total: number; seconds: number }) => void;
}) {
  if (!storyId || !storiesOffered()) return <StoriesShelf grade={grade} skills={skills} />;
  const story = knownStory(storyId);
  if (!story) return <StoriesShelf grade={grade} skills={skills} />;
  return <StoryReader key={story.id} story={story} grade={grade} sound={sound} onFinish={onFinish} />;
}
