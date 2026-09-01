const base = import.meta.env.BASE_URL;

export function asset(path: string): string {
  return `${base}${path.replace(/^\//, "")}`;
}

export const ART = {
  nixWave: asset("art/nix-wave.png"),
  nixThink: asset("art/nix-think.png"),
  nixStar: asset("art/nix-star.png"),
  nixCelebrate: asset("art/nix-celebrate.png"),
  nixOops: asset("art/nix-oops.png"),
  nixCelebrateVid: asset("art/nix-celebrate.mp4"),
  nixIdleVid: asset("art/nix-idle.mp4"),
  remIdle: asset("art/rem-idle.png"),
  remCelebrate: asset("art/rem-celebrate.png"),
  nodeOpen: asset("art/node-open.png"),
  nodeLocked: asset("art/node-locked.png"),
} as const;
