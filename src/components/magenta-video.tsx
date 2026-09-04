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
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/** iPhone / coarse pointers skip chroma-key poke clips. CSS squash still runs. */
export function skipPokeVideo(): boolean {
  return isIos() || isCoarse();
}

export function MagentaImg({
  src,
  alt = "",
  className,
  onLoad,
}: {
  src: string;
  alt?: string;
  className?: string;
  onLoad?: () => void;
}) {
  const [cur, setCur] = useState(src);
  useEffect(() => setCur(src), [src]);
  return (
    <img
      src={cur}
      alt={alt}
      draggable={false}
      className={cn("object-contain", className)}
      onLoad={onLoad}
      onError={() => {
        const next = fallbackPublicSrc(cur);
        if (next && next !== cur) setCur(next);
      }}
    />
  );
}

/** If BASE_URL-prefixed public files 404 (dev opened at / not /times-tables/), retry the unprefixed path. */
export function fallbackPublicSrc(src: string): string | null {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  if (base && (src.startsWith(`${base}/`) || src.includes(`${base}/`))) {
    return src.replace(base, "") || null;
  }
  if (base && src.startsWith("/") && !src.startsWith(`${base}/`)) {
    return `${base}${src}`;
  }
  return null;
}

export function MagentaVideo({
  src,
  className,
  loop,
  onEnded,
  onReady,
  onFail,
}: {
  src: string;
  className?: string;
  loop?: boolean;
  onEnded?: () => void;
  onReady?: () => void;
  onFail?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const skip = skipPokeVideo();

  useEffect(() => {
    if (skip) {
      onFail?.();
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      onFail?.();
      return;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      onFail?.();
      return;
    }
    let raf = 0;
    let stopped = false;
    let painted = false;
    let lastT = -1;

    const fail = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      setFailed(true);
      onFail?.();
    };

    const draw = () => {
      if (stopped) return;
      try {
        if (video.readyState >= 2 && video.videoWidth) {
          const t = video.currentTime;
          if (t === lastT && painted) {
            raf = requestAnimationFrame(draw);
            return;
          }
          lastT = t;
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
            onReady?.();
          }
        }
      } catch {
        fail();
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    const ended = () => onEnded?.();
    video.addEventListener("ended", ended);
    video.addEventListener("error", fail);
    const watchdog = window.setTimeout(() => {
      if (!painted) fail();
    }, 300);
    void video.play().catch(() => fail());
    raf = requestAnimationFrame(draw);
    return () => {
      stopped = true;
      window.clearTimeout(watchdog);
      cancelAnimationFrame(raf);
      video.removeEventListener("ended", ended);
      video.removeEventListener("error", fail);
      video.pause();
    };
  }, [src, onEnded, loop, skip, onReady, onFail]);

  if (skip || failed) return null;

  return (
    <div className={cn("pointer-events-none", ready ? "relative" : "contents", className)} aria-hidden>
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        autoPlay
        loop={loop}
        preload="auto"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        tabIndex={-1}
        className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-px w-px opacity-0"
      />
      <canvas ref={canvasRef} className={cn("h-full w-full object-contain", !ready && "hidden")} />
    </div>
  );
}
