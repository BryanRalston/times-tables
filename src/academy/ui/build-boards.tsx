import type { RoundSlot } from "../round-flow";
import { ClockBoard, PayBoard } from "./hands";
import { ArrayBoard, BlocksBoard, CountBoard, FrameBoard, ShadeBoard } from "./number-boards";
import { LetterBoard, PhonicsBoard, SightBoard } from "./word-boards";
import { TraceBoard } from "./trace-board";
import { GraphsHands } from "./graph-board";
import { GridHands } from "./grid-board";
import { AboutHands } from "./about-board";
import { JumpHands } from "./jump-board";
import { TickHands } from "./tick-board";
import { PatternHands } from "./pattern-board";
import { SignHands } from "./sign-board";
import { ShareHands } from "./share-board";
import { BlankBoard, MeasureBoard, ShapeBoard, StoryBoard } from "./world-boards";

export function HandsBoard({
  task,
  onAnswer,
}: {
  task: Exclude<RoundSlot, { kind: "choice" }>;
  onAnswer: (ok: boolean) => void;
}) {
  switch (task.kind) {
    case "clock":
      return <ClockBoard task={task} onAnswer={onAnswer} />;
    case "pay":
      return <PayBoard task={task} onAnswer={onAnswer} />;
    case "array":
      return <ArrayBoard task={task} onAnswer={onAnswer} />;
    case "frame":
      return <FrameBoard task={task} onAnswer={onAnswer} />;
    case "count":
      return <CountBoard task={task} onAnswer={onAnswer} />;
    case "blocks":
      return <BlocksBoard task={task} onAnswer={onAnswer} />;
    case "shade":
      return <ShadeBoard task={task} onAnswer={onAnswer} />;
    case "letters":
      return <LetterBoard task={task} onAnswer={onAnswer} />;
    case "sight":
      return <SightBoard task={task} onAnswer={onAnswer} />;
    case "phonics":
      return <PhonicsBoard task={task} onAnswer={onAnswer} />;
    case "measure":
      return <MeasureBoard task={task} onAnswer={onAnswer} />;
    case "shapes":
      return <ShapeBoard task={task} onAnswer={onAnswer} />;
    case "story":
      return <StoryBoard task={task} onAnswer={onAnswer} />;
    case "blank":
      return <BlankBoard task={task} onAnswer={onAnswer} />;
    case "trace":
      return <TraceBoard task={task} onAnswer={onAnswer} />;
    case "graphs":
      return <GraphsHands task={task} onAnswer={onAnswer} />;
    case "share":
      return <ShareHands task={task} onAnswer={onAnswer} />;
    case "grid":
      return <GridHands task={task} onAnswer={onAnswer} />;
    case "pattern":
      return <PatternHands task={task} onAnswer={onAnswer} />;
    case "signs":
      return <SignHands task={task} onAnswer={onAnswer} />;
    case "jumps":
      return <JumpHands task={task} onAnswer={onAnswer} />;
    case "ticks":
      return <TickHands task={task} onAnswer={onAnswer} />;
    case "about":
      return <AboutHands task={task} onAnswer={onAnswer} />;
    default: {
      const neverTask: never = task;
      return neverTask;
    }
  }
}
