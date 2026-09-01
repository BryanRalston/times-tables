import { Delete } from "lucide-react";
import { InteractiveClock } from "@/components/clock-face";
import { Button } from "@/components/ui/button";
import { formatClockTime, parseClockTime, startClockTime } from "@/lib/clock";
import { parseLocale, UI } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { cn, pad2 } from "@/lib/utils";

function useChrome() {
  return UI[parseLocale(useProgress((s) => s.locale))];
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

export function AnswerReadout({
  value,
  empty = "?",
  label,
}: {
  value: string;
  empty?: string;
  label?: string;
}) {
  const ui = useChrome();
  const shown = value.length > 0;
  const shownLabel = label ?? ui.yourAnswer;
  return (
    <div className="frost rounded-[20px] border-2 border-ink px-4 py-3 text-center shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{shownLabel}</p>
      <p
        className={cn(
          "font-display min-h-14 text-5xl leading-tight tabular-nums",
          shown ? "text-ink" : "text-faint",
        )}
        aria-live="polite"
        aria-label={shown ? `${shownLabel} ${value}` : `${shownLabel} empty`}
      >
        {shown ? value : empty}
      </p>
    </div>
  );
}

export function Keypad({
  value,
  onChange,
  onCheck,
  disabled,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onCheck: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const ui = useChrome();
  function press(k: (typeof KEYS)[number]) {
    if (disabled) return;
    if (k === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (k === "." && value.includes(".")) return;
    if (value.length >= 8) return;
    onChange(value + k);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <AnswerReadout value={value} />
      <div className="grid w-full grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <Button
            key={k}
            variant="secondary"
            size="key"
            className="min-w-0 w-full"
            aria-label={k === "back" ? "Backspace" : k}
            onClick={() => press(k)}
            disabled={disabled}
          >
            {k === "back" ? <Delete className="size-5" /> : k}
          </Button>
        ))}
        <Button className="col-span-3" size="lg" onClick={onCheck} disabled={disabled || value.length === 0}>
          {ui.check}
        </Button>
      </div>
    </div>
  );
}

export function CompareKeys({
  onPick,
  disabled,
  includeNeq,
}: {
  onPick: (s: string) => void;
  disabled?: boolean;
  includeNeq?: boolean;
}) {
  const keys = includeNeq ? ["<", "=", ">", "≠"] : ["<", "=", ">"];
  return (
    <div className={cn("grid gap-2", includeNeq ? "grid-cols-4" : "grid-cols-3")}>
      {keys.map((k) => (
        <Button key={k} variant="secondary" size="lg" className="text-2xl" disabled={disabled} onClick={() => onPick(k)}>
          {k}
        </Button>
      ))}
    </div>
  );
}

export function FractionKeys({
  value,
  onChange,
  onCheck,
  disabled,
  mixed,
}: {
  value: string;
  onChange: (v: string) => void;
  onCheck: () => void;
  disabled?: boolean;
  mixed?: boolean;
}) {
  const ui = useChrome();
  const parts = value.split(" ");
  const mixedWhole = mixed ? (parts.length > 1 ? parts[0] : parts[0]?.includes("/") ? "" : (parts[0] ?? "")) : "";
  const frac = mixed ? (parts.length > 1 ? parts[1] : parts[0]?.includes("/") ? parts[0] : "") : value;
  const [num = "", den = ""] = (frac ?? "").split("/");
  const which = mixed && mixedWhole === "" && !num ? "w" : num === "" ? "n" : den === "" ? "d" : "d";

  function set(part: "w" | "n" | "d", digit: string) {
    let w = mixedWhole ?? "";
    let n = num;
    let d = den;
    if (part === "w") w = (w + digit).slice(0, 2);
    if (part === "n") n = (n + digit).slice(0, 3);
    if (part === "d") d = (d + digit).slice(0, 3);
    onChange(mixed ? `${w} ${n}/${d}`.trim() : `${n}/${d}`);
  }

  function back() {
    if (den) onChange(mixed ? `${mixedWhole} ${num}/`.trim() : `${num}/`);
    else if (num) onChange(mixed ? `${mixedWhole} `.trim() : "");
    else if (mixedWhole) onChange("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-center gap-3 font-display text-3xl tabular-nums">
        {mixed ? <span className="min-w-10 border-b-2 border-ink pb-1 text-center">{mixedWhole || " "}</span> : null}
        <span className="flex flex-col items-center">
          <span className="min-w-12 border-b-2 border-ink pb-1 text-center">{num || " "}</span>
          <span className="min-w-12 pt-1 text-center">{den || " "}</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
          <Button key={k} variant="secondary" size="key" disabled={disabled} onClick={() => set(which, k)}>
            {k}
          </Button>
        ))}
        <Button variant="secondary" size="key" disabled={disabled} onClick={back}>
          <Delete className="size-5" />
        </Button>
        <Button variant="secondary" size="key" disabled={disabled} onClick={() => set(which, "0")}>
          0
        </Button>
        <Button variant="secondary" size="key" disabled={disabled} onClick={() => onChange(mixed ? `${mixedWhole} ${num}/`.trim() : `${num}/`)}>
          /
        </Button>
      </div>
      <Button className="w-full" size="lg" onClick={onCheck} disabled={disabled || value.length === 0}>
        {ui.check}
      </Button>
    </div>
  );
}

export function ClockKeys({
  value,
  onChange,
  onCheck,
  disabled,
  avoid,
}: {
  value: string;
  onChange: (v: string) => void;
  onCheck: () => void;
  disabled?: boolean;
  avoid?: string;
}) {
  const ui = useChrome();
  const { hours, minutes } = parseClockTime(value || startClockTime(avoid));

  function set(h: number, m: number) {
    onChange(formatClockTime(h, m));
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <InteractiveClock hours={hours} minutes={minutes} onChange={onChange} disabled={disabled} size="size-36 sm:size-40" />
      </div>
      <p className="text-center font-display text-3xl tabular-nums">
        {hours}:{pad2(minutes)}
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        <Button variant="secondary" size="sm" className="h-8 px-2 text-xs" disabled={disabled} onClick={() => set(hours - 1, minutes)}>
          {ui.hourMinus}
        </Button>
        <Button variant="secondary" size="sm" className="h-8 px-2 text-xs" disabled={disabled} onClick={() => set(hours + 1, minutes)}>
          {ui.hourPlus}
        </Button>
        <Button variant="secondary" size="sm" className="h-8 px-2 text-xs" disabled={disabled} onClick={() => set(hours, minutes - 1)}>
          {ui.minus1min}
        </Button>
        <Button variant="secondary" size="sm" className="h-8 px-2 text-xs" disabled={disabled} onClick={() => set(hours, minutes + 1)}>
          {ui.plus1min}
        </Button>
      </div>
      <Button className="w-full" size="lg" onClick={onCheck} disabled={disabled || !value}>
        {ui.check}
      </Button>
    </div>
  );
}

export function ChoiceList({
  choices,
  onPick,
  disabled,
}: {
  choices: string[];
  onPick: (s: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      {choices.map((c) => (
        <Button key={c} variant="secondary" className="w-full justify-start text-left" disabled={disabled} onClick={() => onPick(c)}>
          {c}
        </Button>
      ))}
    </div>
  );
}
