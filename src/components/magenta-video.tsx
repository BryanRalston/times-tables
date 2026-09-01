import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function isMagenta(r: number, g: number, b: number): boolean {
  return g < 80 && r > 190 && b > 170 && r - g > 100 && b - g > 90;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iP(hone|od|ad)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isCoarse(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export function MagentaImg({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return <img src={src} alt={alt} draggable={false} className={cn("object-contain", className)} />;
}

export function MagentaVideo({
  src,
  className,
  loop,
  onEnded,
}: {
  src: string;
  className?: string;
  loop?: boolean;
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const skip = isIos() || isCoarse();

  useEffect(() => {
    if (skip) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    let raf = 0;
    let stopped = false;
    let painted = false;

    const draw = () => {
      if (stopped) return;
      try {
        if (video.readyState >= 2 && video.videoWidth) {
          const max = 480;
          const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight, 1));
          const w = Math.max(1, Math.round(video.videoWidth * scale));
          const h = Math.max(1, Math.round(video.videoHeight * scale));
          if (canvas.width !== w) {
            canvas.width = w;
            canvas.height = h;
          }
          ctx.drawImage(video, 0, 0, w, h);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = frame.data;
          for (let i = 0; i < d.length; i += 4) {
            if (isMagenta(d[i]!, d[i + 1]!, d[i + 2]!)) d[i + 3] = 0;
          }
          ctx.putImageData(frame, 0, 0);
          if (!painted) {
            painted = true;
            setReady(true);
          }
        }
      } catch {
        stopped = true;
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    const ended = () => onEnded?.();
    video.addEventListener("ended", ended);
    void video.play().catch(() => undefined);
    raf = requestAnimationFrame(draw);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      video.removeEventListener("ended", ended);
      video.pause();
    };
  }, [src, onEnded, loop, skip]);

  if (skip) return null;

  return (
    <div className={cn("relative", className)}>
      <video ref={videoRef} src={src} muted playsInline autoPlay loop={loop} className="hidden" />
      <canvas ref={canvasRef} className={cn("h-full w-full object-contain", !ready && "opacity-0")} />
    </div>
  );
}
