import { AnswerReadout, ChoiceList, ClockKeys, CompareKeys, FractionKeys, Keypad } from "@/components/keypad";
import { Button } from "@/components/ui/button";
import { parseLocale, UI } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import type { Question } from "@/lib/types";
import { keypadAllowsDot, moneyCountHasBill } from "@/lib/utils";

export function AnswerPanel({
  question,
  value,
  setValue,
  onCheck,
  disabled,
}: {
  question: Question;
  value: string;
  setValue: (v: string) => void;
  onCheck: (override?: string) => void;
  disabled?: boolean;
}) {
  const ui = UI[parseLocale(useProgress((s) => s.locale))];
  if (question.input === "choice") {
    return <ChoiceList choices={question.choices ?? []} onPick={(s) => onCheck(s)} disabled={disabled} />;
  }
  if (question.input === "compare") {
    return <CompareKeys onPick={(s) => onCheck(s)} disabled={disabled} />;
  }
  if (question.input === "fraction") {
    return (
      <FractionKeys
        value={value}
        onChange={setValue}
        onCheck={() => onCheck()}
        disabled={disabled}
        mixed={(question.data as { mode?: string }).mode === "mixed"}
      />
    );
  }
  if (question.input === "clock") {
    return (
      <ClockKeys value={value} onChange={setValue} onCheck={(time) => onCheck(time)} disabled={disabled} avoid={question.answer} />
    );
  }
  if (question.input === "order") {
    return (
      <div className="space-y-3">
        <AnswerReadout value={value} empty={ui.orderEmpty} />
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setValue("")} disabled={disabled || !value}>
            {ui.clear}
          </Button>
          <Button className="flex-1" onClick={() => onCheck()} disabled={disabled || !value}>
            {ui.check}
          </Button>
        </div>
      </div>
    );
  }
  const leftover = question.kind === "tenframe";
  return (
    <Keypad
      value={value}
      onChange={setValue}
      onCheck={() => onCheck()}
      disabled={disabled}
      replace={leftover}
      quiet={leftover}
      allowDot={keypadAllowsDot(question)}
      prefix={moneyCountHasBill(question) ? "$" : undefined}
    />
  );
}
