import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function isMagenta(r: number, g: number, b: number): boolean {
  return r > 140 && b > 110 && g < 130 && b > g + 40 && r > g + 40;
}

const keyed = new Map<string, string>();

export function MagentaImg({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(() => keyed.get(src) ?? null);

  useEffect(() => {
    const hit = keyed.get(src);
    if (hit) {
      setUrl(hit);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx || !canvas.width) {
        setUrl(src);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = frame.data;
      for (let i = 0; i < d.length; i += 4) {
        if (isMagenta(d[i]!, d[i + 1]!, d[i + 2]!)) d[i + 3] = 0;
      }
      ctx.putImageData(frame, 0, 0);
      const next = canvas.toDataURL("image/png");
      keyed.set(src, next);
      setUrl(next);
    };
    img.onerror = () => setUrl(src);
    img.src = src;
  }, [src]);

  if (!url) {
    return <span className={cn("inline-block", className)} aria-hidden />;
  }
  return <img src={url} alt={alt} draggable={false} className={cn("object-contain", className)} />;
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

  useEffect(() => {
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
      if (video.readyState >= 2 && video.videoWidth) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0);
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
  }, [src, onEnded, loop]);

  return (
    <div className={cn("relative", className)}>
      <video ref={videoRef} src={src} muted playsInline autoPlay loop={loop} className="hidden" />
      <canvas ref={canvasRef} className={cn("h-full w-full object-contain", !ready && "opacity-0")} />
    </div>
  );
}
