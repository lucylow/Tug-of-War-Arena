/**
 * Interaction rate limits for high-frequency arena input.
 * Pulls are allowed faster than reactions; both reject bursts that would
 * stampede Reanimated, haptics, and the match reducer.
 */

export const PULL_MIN_INTERVAL_MS = 70;
export const REACTION_MIN_INTERVAL_MS = 280;
export const SURGE_MIN_INTERVAL_MS = 400;
export const NOTICE_MIN_INTERVAL_MS = 600;

export type Clock = () => number;

export interface RateGate {
  tryConsume(at?: number): boolean;
  peek(at?: number): boolean;
  lastAcceptedAt(): number;
  reset(): void;
  readonly minIntervalMs: number;
}

export function createRateGate(minIntervalMs: number, clock: Clock = () => Date.now()): RateGate {
  const interval = Number.isFinite(minIntervalMs) && minIntervalMs > 0 ? minIntervalMs : 0;
  let last = Number.NEGATIVE_INFINITY;

  return {
    minIntervalMs: interval,
    tryConsume(at = clock()) {
      const now = Number.isFinite(at) ? at : clock();
      if (now - last < interval) return false;
      last = now;
      return true;
    },
    peek(at = clock()) {
      const now = Number.isFinite(at) ? at : clock();
      return now - last >= interval;
    },
    lastAcceptedAt() {
      return Number.isFinite(last) ? last : 0;
    },
    reset() {
      last = Number.NEGATIVE_INFINITY;
    },
  };
}

export function createPullGate(clock?: Clock): RateGate {
  return createRateGate(PULL_MIN_INTERVAL_MS, clock);
}

export function createReactionGate(clock?: Clock): RateGate {
  return createRateGate(REACTION_MIN_INTERVAL_MS, clock);
}

export function createSurgeGate(clock?: Clock): RateGate {
  return createRateGate(SURGE_MIN_INTERVAL_MS, clock);
}

export function canAcceptAt(lastAt: number, minIntervalMs: number, now: number): boolean {
  if (!Number.isFinite(lastAt)) return true;
  const interval = Number.isFinite(minIntervalMs) && minIntervalMs > 0 ? minIntervalMs : 0;
  const t = Number.isFinite(now) ? now : lastAt;
  return t - lastAt >= interval;
}

export function remainingCooldown(lastAt: number, minIntervalMs: number, now: number): number {
  if (!canAcceptAt(lastAt, minIntervalMs, now)) {
    const interval = Number.isFinite(minIntervalMs) && minIntervalMs > 0 ? minIntervalMs : 0;
    return Math.max(0, interval - (now - lastAt));
  }
  return 0;
}
