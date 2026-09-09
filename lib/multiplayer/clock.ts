export type TimeoutHandle = ReturnType<typeof setTimeout>;
export type IntervalHandle = ReturnType<typeof setInterval>;

export type MultiplayerClock = {
  now: () => number;
  setTimeout: (fn: () => void, ms: number) => TimeoutHandle;
  clearTimeout: (handle: TimeoutHandle | null | undefined) => void;
  setInterval: (fn: () => void, ms: number) => IntervalHandle;
  clearInterval: (handle: IntervalHandle | null | undefined) => void;
};

export const defaultClock: MultiplayerClock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (handle) => {
    if (handle != null) clearTimeout(handle);
  },
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (handle) => {
    if (handle != null) clearInterval(handle);
  },
};

let clock: MultiplayerClock = defaultClock;

export function getClock(): MultiplayerClock {
  return clock;
}

export function setMultiplayerClock(next: MultiplayerClock): void {
  clock = next;
}

export function resetMultiplayerClock(): void {
  clock = defaultClock;
}
