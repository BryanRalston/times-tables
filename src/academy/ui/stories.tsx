import { useEffect, useMemo, useRef, useState } from "react";
import { type Grade, type SkillStat } from "../model";
import { starsForRound } from "../rewards";
import { storyGradeLabel } from "../stories/band";
import type { Story } from "../stories/catalog";
import { knownStory, openStory, stepReader, storiesForGrade, storiesOffered, storyScore, type ReaderState } from "../stories/engine";
import { presentStory } from "../stories/localize";
import { lineTokens } from "../stories/read";
import { blip, chime, teachTone } from "../sound";
import { getLocale, show, t } from "../i18n";
import { countStoryFinish } from "../seo/events";
import { ensureVoice } from "../voice/clips";
import { startClipSpeech, startReadAlong, stopClipSpeech } from "../voice/player";
import { BackLink, SquisheeImg, Stars, cx } from "./bits";
import { StoryPicture, StoryScene } from "./story-scene";

function storyDir(): "rtl" | "ltr" {
  return getLocale() === "ar" ? "rtl" : "ltr";
}

function storyBack(): string {
  return t("Back", "Atrás", "Voltar", "Retour", "返回", "वापस", "رجوع");
}

function storyNext(): string {
  return t("Next", "Siguiente", "Próxima", "Suivante", "下一页", "अगला", "التالي");
}

export function StoriesShelf({ grade, skills }: { grade: Grade; skills: Record<string, SkillStat> }) {
  if (!storiesOffered()) return null;
  const books = storiesForGrade(grade);
  const groups: { grade: Story["grade"]; books: Story[] }[] = [];
  for (const story of books) {
    const last = groups[groups.length - 1];
    if (!last || last.grade !== story.grade) groups.push({ grade: story.grade, books: [story] });
    else last.books.push(story);
  }
  return (
    <div className="ac-shell" data-stories="open" dir={storyDir()} lang={getLocale()}>
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
              const shown = presentStory(story);
              const done = (skills[`story:${story.id}`]?.ok ?? 0) > 0;
              const pal = story.cast[0] ?? "peach";
              return (
                <a key={story.id} className="ac-story-card" href={`#/stories/${story.id}`} data-story-id={story.id} data-read={done ? "yes" : "no"}>
                  <SquisheeImg id={pal} className="ac-story-card-pal" squish="off" />
                  <span>
                    <strong>{shown.title}</strong>
                    <small>
                      {story.pages.length} {t("pages", "páginas", "páginas", "pages", "页", "पृष्ठ", "صفحات")}
                      {done ? ` · ${t("Read", "Leído", "Lida", "Lue", "读过了", "पढ़ लिया", "قُرئت")}` : ""}
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
  const lang = getLocale();
  const shown = useMemo(() => presentStory(story), [story, lang]);
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
      const cues = tokens.map((token) => ({ key: token.key, gapAfterMs: token.gapAfterMs }));
      const startedPlay = startReadAlong(
        cues,
        (index) => setActive(index),
        () => setActive(-1),
        () => setActive(-1),
      );
      if (startedPlay) return;
      if (!startClipSpeech(text, 1, () => setActive(-1))) setActive(-1);
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
    const text = state.phase === "page" ? (shown.pages[state.page]?.text ?? "") : (shown.checks[state.check]?.prompt ?? "");
    if (!text) return;
    playText(text);
  }, [state.phase, state.page, state.check, state.returnTo, shown, sound]);

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
    countStoryFinish(story.id);
  }, [state, onFinish, story.id]);

  function speakThen(line: string, follow: string | null) {
    hold.current = true;
    clearWait();
    if (sound) void ensureVoice().then(() => {
      if (!startClipSpeech(line, 1, () => {})) startReadAlong(lineTokens(line).map((token) => ({ key: token.key, gapAfterMs: 40 })), () => {}, () => {}, () => {});
    });
    else stopClipSpeech();
    if (!follow) return;
    wait.current = window.setTimeout(() => {
      wait.current = null;
      playText(follow);
    }, 1400);
  }

  const page = shown.pages[state.page] ?? shown.pages[0];
  if (!page) return null;

  if (state.phase === "done") {
    const score = storyScore(state);
    const stars = starsForRound(score.correct, Math.max(1, score.total));
    return (
      <div className="ac-shell ac-mid" data-story-phase="done" data-story-id={story.id} data-grade={grade} dir={storyDir()} lang={lang}>
        <StoryScene mood={page.mood} pals={page.pals} prop={page.prop} />
        <h1>{show("Yes!")}</h1>
        <Stars value={stars} />
        <a className="ac-go" href="#/stories">
          {show("Stories")}
        </a>
      </div>
    );
  }

  if (state.phase === "check") {
    const check = shown.checks[state.check];
    if (!check) return null;
    return (
      <div className="ac-shell ac-mid" data-story-phase="check" data-story-id={story.id} data-story-check={state.check} data-grade={grade} dir={storyDir()} lang={lang}>
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
            void ensureVoice().then(() => {
              const cues = [{ key: token.key, gapAfterMs: 60 }];
              if (!startReadAlong(cues, () => setActive(index), () => setActive(-1), () => setActive(-1))) {
                startClipSpeech(token.text, 1, () => setActive(-1));
              }
            });
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
                    ? (shown.pages[next.page]?.text ?? null)
                    : next.phase === "check"
                      ? (shown.checks[next.check]?.prompt ?? null)
                      : null;
                if (choice.id === check.answer) {
                  blip(true, sound);
                  if (next.phase === "done") chime("cheer", sound);
                  speakThen(show("Yes!"), follow);
                } else {
                  teachTone(sound);
                  speakThen(show("Let's look together."), follow);
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
    <div className="ac-shell ac-mid" data-story-phase="page" data-story-id={story.id} data-story-page={state.page} data-grade={grade} dir={storyDir()} lang={lang}>
      <header className="ac-top">
        <a className="ac-back" href="#/stories">
          {show("Stories")}
        </a>
        <span className="ac-story-count">
          <span className="ac-sr">
            {t("Page", "Página", "Página", "Page", "页", "पृष्ठ", "صفحة")} {state.page + 1} / {shown.pages.length}
          </span>
          {shown.pages.map((_, index) => (
            <i key={index} className={index === state.page ? "is-on" : ""} />
          ))}
        </span>
      </header>
      <StoryScene mood={page.mood} pals={page.pals} prop={page.prop} />
      {state.returnTo != null ? <p className="ac-hint">{show("Let's look together.")}</p> : null}
      <StoryWords
        text={page.text}
        active={active}
        onWord={(index) => {
          const token = tokens[index];
          if (!token || !sound) return;
          void ensureVoice().then(() => {
            const cues = [{ key: token.key, gapAfterMs: token.gapAfterMs }];
            if (!startReadAlong(cues, () => setActive(index), () => setActive(-1), () => setActive(-1))) {
              startClipSpeech(token.text, 1, () => setActive(-1));
            }
          });
        }}
      />
      <button type="button" className="ac-story-read" data-story-read onClick={() => playText(page.text)}>
        {t("Read to me", "Léemelo", "Leia para mim", "Lis pour moi", "读给我听", "मुझे पढ़कर सुनाओ", "اقرأ لي")}
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
            setState((current) => stepReader(current, { type: "back", pages: shown.pages.length }));
          }}
        >
          {storyBack()}
        </button>
        <button
          type="button"
          className="ac-go"
          data-story-next
          onClick={() => {
            stopClipSpeech();
            clearWait();
            setState((current) => stepReader(current, { type: "next", pages: shown.pages.length }));
          }}
        >
          {storyNext()}
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
