/**
 * Haptic budget — phones drop or stutter when every tap fires an impact.
 * A sliding window plus a minimum interval keeps feedback perceptible
 * without saturating the Taptic engine.
 */

import { canPlayHaptics } from "../haptics-policy";

export type HapticKind = "light" | "medium" | "heavy" | "success" | "error" | "warning";

export const HAPTIC_MIN_INTERVAL_MS = 48;
export const HAPTIC_WINDOW_MS = 1000;
export const HAPTIC_MAX_PER_WINDOW = 10;

export type HapticClock = () => number;

export interface HapticBudgetSnapshot {
  accepted: number;
  dropped: number;
  lastAt: number;
}

export interface HapticBudget {
  tryPlay(kind?: HapticKind, at?: number): boolean;
  snapshot(): HapticBudgetSnapshot;
  reset(): void;
}

export function createHapticBudget(
  options: {
    minIntervalMs?: number;
    windowMs?: number;
    maxPerWindow?: number;
    clock?: HapticClock;
    play?: (kind: HapticKind) => void;
    enabled?: boolean;
  } = {},
): HapticBudget {
  const minInterval = options.minIntervalMs ?? HAPTIC_MIN_INTERVAL_MS;
  const windowMs = options.windowMs ?? HAPTIC_WINDOW_MS;
  const maxPerWindow = options.maxPerWindow ?? HAPTIC_MAX_PER_WINDOW;
  const clock = options.clock ?? (() => Date.now());
  const play = options.play ?? ((_kind: HapticKind) => undefined);
  const enabled = options.enabled ?? true;

  const stamps: number[] = [];
  let lastAt = Number.NEGATIVE_INFINITY;
  let accepted = 0;
  let dropped = 0;

  return {
    tryPlay(kind: HapticKind = "light", at = clock()) {
      if (!enabled) {
        dropped += 1;
        return false;
      }
      const now = Number.isFinite(at) ? at : clock();
      if (now - lastAt < minInterval) {
        dropped += 1;
        return false;
      }
      while (stamps.length > 0 && now - (stamps[0] ?? 0) > windowMs) {
        stamps.shift();
      }
      if (stamps.length >= maxPerWindow) {
        dropped += 1;
        return false;
      }
      stamps.push(now);
      lastAt = now;
      accepted += 1;
      play(kind);
      return true;
    },
    snapshot() {
      return { accepted, dropped, lastAt: Number.isFinite(lastAt) ? lastAt : 0 };
    },
    reset() {
      stamps.length = 0;
      lastAt = Number.NEGATIVE_INFINITY;
      accepted = 0;
      dropped = 0;
    },
  };
}

export function shouldPlayHaptic(os: string, reduceMotion = false): boolean {
  return canPlayHaptics(os) && !reduceMotion;
}
