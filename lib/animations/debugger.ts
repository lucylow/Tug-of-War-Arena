export class FrameRateSampler {
  private frames = 0;
  private lastTime: number;
  private lastFps = 0;

  constructor(now = 0) {
    this.lastTime = Number.isFinite(now) ? now : 0;
  }

  tick(now: number): number | null {
    const t = Number.isFinite(now) ? now : this.lastTime;
    this.frames += 1;
    if (t - this.lastTime < 1000) return null;
    const fps = this.frames;
    this.lastFps = fps;
    this.frames = 0;
    this.lastTime = t;
    return fps;
  }

  getLastFps(): number {
    return this.lastFps;
  }
}

export function logAnimationFrameRate(log: (message: string) => void = console.log): () => void {
  const sampler = new FrameRateSampler(typeof performance !== "undefined" ? performance.now() : 0);
  let raf = 0;
  let stopped = false;

  const loop = (now: number) => {
    if (stopped) return;
    const fps = sampler.tick(now);
    if (fps !== null) log(`🎬 FPS: ${fps}`);
    if (typeof requestAnimationFrame === "function") {
      raf = requestAnimationFrame(loop);
    }
  };

  if (typeof requestAnimationFrame === "function") {
    raf = requestAnimationFrame(loop);
  }

  return () => {
    stopped = true;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
  };
}
