export type ClockListener = (now: number) => void;

export class DemoWorldClock {
  private nowMs: number;
  private paused = false;
  private readonly origin: number;
  private readonly listeners = new Set<ClockListener>();

  constructor(startMs = 1_725_968_000_000) {
    this.origin = startMs;
    this.nowMs = startMs;
  }

  now(): number {
    return this.nowMs;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  advance(ms: number): number {
    if (this.paused) return this.nowMs;
    const delta = Number.isFinite(ms) ? Math.max(0, ms) : 0;
    this.nowMs += delta;
    this.listeners.forEach((listener) => listener(this.nowMs));
    return this.nowMs;
  }

  reset(at = this.origin): void {
    this.nowMs = startOrOrigin(at, this.origin);
    this.paused = false;
    this.listeners.forEach((listener) => listener(this.nowMs));
  }

  subscribe(listener: ClockListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

function startOrOrigin(at: number, origin: number): number {
  return Number.isFinite(at) ? at : origin;
}

export const PRESENTATION_SEED = 20260909;
export const PRESENTATION_CLOCK_START_MS = 1_725_968_000_000;

export function isPresentationMode(): boolean {
  if (typeof process === "undefined" || !process.env) return false;
  const raw = process.env.PRESENTATION_MODE ?? process.env.EXPO_PUBLIC_PRESENTATION_MODE;
  return raw === "true" || raw === "1";
}
