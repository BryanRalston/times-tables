import { useEffect, useRef, useState } from "react";
import type { TraceTask } from "../hands-build";
import { t } from "../i18n";
import { glyphFor, type Pt } from "../trace/glyphs";
import { activeStroke, scoreTrace, strokeCue, type TraceScore } from "../trace/score";
import { traceDoneLine, traceKeepLine } from "../trace/lines";
import { speak } from "../voice";
import { cx } from "./bits";
import { useSoundEnabled } from "./sound-context";

function pointsAttr(points: readonly Pt[]): string {
  let out = "";
  for (const point of points) {
    if (out) out += " ";
    out += `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }
  return out;
}

function drawInk(canvas: HTMLCanvasElement, svg: SVGSVGElement, strokes: readonly (readonly Pt[])[], live: readonly Pt[]) {
  const rect = svg.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#3c2448";
  ctx.lineWidth = Math.max(10, (rect.width / 100) * 7.5 * dpr);
  const scaleX = width / 100;
  const scaleY = height / 100;
  const paint = (pts: readonly Pt[]) => {
    const first = pts[0];
    if (!first) return;
    ctx.beginPath();
    ctx.moveTo(first.x * scaleX, first.y * scaleY);
    for (let i = 1; i < pts.length; i += 1) {
      const point = pts[i];
      if (!point) continue;
      ctx.lineTo(point.x * scaleX, point.y * scaleY);
    }
    ctx.stroke();
  };
  for (const stroke of strokes) paint(stroke);
  paint(live);
}

export function TraceBoard({ task, onAnswer }: { task: TraceTask; onAnswer: (ok: boolean) => void }) {
  const glyph = glyphFor(task.glyph);
  const sound = useSoundEnabled();
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<Pt[][]>([]);
  const liveRef = useRef<Pt[]>([]);
  const frameRef = useRef(0);
  const doneRef = useRef(false);
  const praisedRef = useRef(-1);
  const waitRef = useRef(0);
  const [cue, setCue] = useState(0);
  const [complete, setComplete] = useState(false);

  function paint() {
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!canvas || !svg) return;
    drawInk(canvas, svg, inkRef.current, liveRef.current);
  }

  function schedule() {
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      paint();
    });
  }

  function toPoint(event: { clientX: number; clientY: number }): Pt | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
  }

  function review(score: TraceScore) {
    const next = activeStroke(score);
    setCue((current) => (current === next ? current : next));
    if (glyph && next > praisedRef.current && next < glyph.strokes.length && next > 0) {
      praisedRef.current = next;
      speak(traceKeepLine(), sound);
    }
    if (!score.done || doneRef.current) return;
    doneRef.current = true;
    setComplete(true);
    speak(traceDoneLine(), sound);
    waitRef.current = window.setTimeout(() => onAnswer(true), 700);
  }

  function reset() {
    if (doneRef.current) return;
    inkRef.current = [];
    liveRef.current = [];
    praisedRef.current = -1;
    setCue(0);
    paint();
  }

  useEffect(() => {
    paint();
    const onResize = () => paint();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      if (waitRef.current) window.clearTimeout(waitRef.current);
    };
  }, [task.factKey]);

  if (!glyph) return null;
  const stroke = glyph.strokes[Math.min(cue, glyph.strokes.length - 1)];
  const hint = stroke ? strokeCue(stroke) : null;
  const showCue = !complete && hint;

  return (
    <div className={cx("ac-finger", complete && "is-complete")} data-hands="trace" data-fact={task.factKey} data-glyph={task.glyph}>
      <p className="ac-hands-cap">{task.speech}</p>
      <div
        ref={stageRef}
        className="ac-trace-stage"
        role="application"
        aria-label={t(`Trace ${task.glyph}. Start at the dot.`, `Traza ${task.glyph}. Empieza en el punto.`, `Trace ${task.glyph}. Comece no ponto.`, `Suis le tracé de ${task.glyph}. Commence au point.`, `描${task.glyph}。从圆点开始。`)}
        onPointerDown={(event) => {
          if (doneRef.current || event.button > 0) return;
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            /* a finger can still draw when the browser skips capture */
          }
          event.preventDefault();
          const point = toPoint(event);
          if (!point) return;
          liveRef.current = [point];
          schedule();
        }}
        onPointerMove={(event) => {
          if (doneRef.current || liveRef.current.length === 0) return;
          const point = toPoint(event);
          const last = liveRef.current[liveRef.current.length - 1];
          if (!point || !last) return;
          if (Math.hypot(point.x - last.x, point.y - last.y) < 0.7) return;
          liveRef.current.push(point);
          schedule();
          if (liveRef.current.length % 6 === 0) review(scoreTrace(glyph, [...inkRef.current, liveRef.current]));
        }}
        onPointerUp={(event) => {
          if (doneRef.current || liveRef.current.length === 0) return;
          const point = toPoint(event);
          if (point) liveRef.current.push(point);
          inkRef.current = [...inkRef.current, liveRef.current];
          liveRef.current = [];
          schedule();
          review(scoreTrace(glyph, inkRef.current));
        }}
        onPointerCancel={() => {
          liveRef.current = [];
          schedule();
        }}
      >
        <svg ref={svgRef} className="ac-trace-guide" viewBox="0 0 100 100" aria-hidden="true">
          {glyph.strokes.map((row, index) => (
            <polyline
              key={`${task.glyph}-${index}`}
              className={cx("ac-trace-path", (complete || index < cue) && "is-done", !complete && index === cue && "is-on")}
              points={pointsAttr(row.points)}
            />
          ))}
          {showCue && hint ? (
            <g>
              <circle className="ac-trace-ring" cx={hint.start.x} cy={hint.start.y} r="7.2" />
              <circle className="ac-trace-dot" cx={hint.start.x} cy={hint.start.y} r="4.4" />
              <circle className="ac-trace-dot-core" cx={hint.start.x} cy={hint.start.y} r="1.7" />
              <path
                className="ac-trace-arrow"
                d="M0,-3.4 L8,0 L0,3.4 Z"
                transform={`translate(${hint.tip.x} ${hint.tip.y}) rotate(${(hint.angle * 180) / Math.PI})`}
              />
            </g>
          ) : null}
        </svg>
        <canvas ref={canvasRef} className="ac-trace-ink" />
      </div>
      <button type="button" className="ac-quiet ac-trace-again" onClick={reset} disabled={complete}>
        {t("Start over", "Otra vez")}
      </button>
    </div>
  );
}
