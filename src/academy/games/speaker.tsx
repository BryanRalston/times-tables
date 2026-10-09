import { useEffect, useState } from "react";
import { SpeakerIcon, cx } from "../ui/bits";
import {
  markVoicesSettled,
  needsSpeechFallback,
  readSpeechProbe,
  setSlowPreference,
  slowPreference,
  speakText,
  stopSpeech,
} from "./speech";

export function SpeakerBar({
  text,
  fallback,
  caption,
  large,
  label,
}: {
  text: string;
  fallback: string;
  caption: string;
  large: boolean;
  label: string;
}) {
  const [slow, setSlow] = useState(slowPreference);
  const [forced, setForced] = useState(false);
  const [envFallback, setEnvFallback] = useState(() => needsSpeechFallback(readSpeechProbe()));
  const show = forced || envFallback;

  useEffect(() => {
    const update = () => setEnvFallback(needsSpeechFallback(readSpeechProbe()));
    update();
    const synth = typeof window === "undefined" ? undefined : window.speechSynthesis;
    if (!synth) return;
    synth.getVoices();
    const onVoices = () => {
      markVoicesSettled();
      update();
    };
    synth.addEventListener("voiceschanged", onVoices);
    const timer = window.setTimeout(() => {
      markVoicesSettled();
      update();
    }, 700);
    return () => {
      synth.removeEventListener("voiceschanged", onVoices);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const ok = speakText(text, slow, () => setForced(true));
    if (!ok) setForced(true);
    return () => stopSpeech();
  }, [text, slow]);

  function replay() {
    const ok = speakText(text, slow, () => setForced(true));
    if (!ok) setForced(true);
  }

  function toggleSlow() {
    const next = !slow;
    setSlow(next);
    setSlowPreference(next);
  }

  return (
    <div className="ac-speaker-wrap">
      <div className="ac-speaker-row">
        <button type="button" className={cx("ac-speaker", !show && "is-live")} aria-label={label} onClick={replay}>
          <SpeakerIcon />
        </button>
        <button
          type="button"
          className={cx("ac-slow", slow && "is-on")}
          aria-pressed={slow}
          aria-label="Slow voice"
          onClick={toggleSlow}
        >
          <span aria-hidden="true">🐢</span>
        </button>
      </div>
      {show ? (
        <p className="ac-fallback" role="status">
          <small>{caption}</small>
          <strong className={cx(large && "is-word")}>{fallback}</strong>
        </p>
      ) : null}
    </div>
  );
}
