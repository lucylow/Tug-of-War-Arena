export type CountdownValue = 0 | 1 | 2 | 3;

export function isCountdownValue(value: number): value is CountdownValue {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

export function countdownLabel(count: number): string {
  if (count === 0) return "GO!";
  if (isCountdownValue(count)) return String(count);
  return "";
}

export function nextCountdown(count: number): CountdownValue | null {
  if (!isCountdownValue(count)) return null;
  if (count === 0) return null;
  return (count - 1) as CountdownValue;
}

export const COUNTDOWN_HOLD_MS = 420;
export const COUNTDOWN_EXIT_MS = 280;
