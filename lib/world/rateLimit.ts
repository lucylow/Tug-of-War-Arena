import { PULL_MIN_INTERVAL_MS } from "../../shared/budgets";

const last: Record<string, number> = {};

export function canPull(playerId: string, now = Date.now(), interval = PULL_MIN_INTERVAL_MS): boolean {
  const previous = last[playerId] ?? 0;
  return now - previous >= interval;
}

export function recordPull(playerId: string, now = Date.now()): void {
  last[playerId] = now;
}

export function resetPlayer(playerId: string): void {
  delete last[playerId];
}

export function resetAllPulls(): void {
  for (const key of Object.keys(last)) delete last[key];
}

export function createActionLimiter(intervalMs: number) {
  const stamps = new Map<string, number>();
  return {
    allow(key: string, now = Date.now()): boolean {
      const previous = stamps.get(key) ?? 0;
      if (now - previous < intervalMs) return false;
      stamps.set(key, now);
      return true;
    },
    reset(key?: string) {
      if (key) stamps.delete(key);
      else stamps.clear();
    },
  };
}

export const socialActionLimiter = {
  pull: createActionLimiter(220),
  reaction: createActionLimiter(700),
  joinRoom: createActionLimiter(1_200),
  roomCreation: createActionLimiter(4_000),
  proofSubmission: createActionLimiter(3_000),
};
