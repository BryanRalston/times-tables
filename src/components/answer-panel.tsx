import { AnswerReadout, ChoiceList, ClockKeys, CompareKeys, FractionKeys, Keypad } from "@/components/keypad";
import { Button } from "@/components/ui/button";
import type { Question } from "@/lib/types";

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
    return <ClockKeys value={value} onChange={setValue} onCheck={() => onCheck()} disabled={disabled} />;
  }
  if (question.input === "order") {
    return (
      <div className="space-y-3">
        <AnswerReadout value={value} empty="tap the numbers in order" />
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setValue("")} disabled={disabled || !value}>
            Clear
          </Button>
          <Button className="flex-1" onClick={() => onCheck()} disabled={disabled || !value}>
            Check
          </Button>
        </div>
      </div>
    );
  }
  return <Keypad value={value} onChange={setValue} onCheck={() => onCheck()} disabled={disabled} />;
}
