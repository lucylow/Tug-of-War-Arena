export const MAX_RECONNECT_ATTEMPTS = 10;
export const MAX_RECONNECT_DELAY_MS = 30_000;

export function reconnectDelay(attempt: number, maxDelay = MAX_RECONNECT_DELAY_MS): number {
  const safeAttempt = Math.max(0, Math.floor(attempt));
  return Math.min(1000 * 2 ** safeAttempt, maxDelay);
}
