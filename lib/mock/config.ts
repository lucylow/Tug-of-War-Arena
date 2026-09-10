/**
 * Tunable mock-chain behavior for demo latency and world size.
 * Tests keep delays at 0 by constructing MockBlockchain with `latencyMs: 0`.
 */
export type MockConfig = {
  minDelayMs: number;
  maxDelayMs: number;
  matchCreationDelayMs: number;
  eventEmitDelayMs: number;
  matchResolveDelayMs: number;
  userCount: number;
  nftCount: number;
  matchCount: number;
  questCount: number;
  predictionCount: number;
  achievementCount: number;
  rentalCount: number;
};

export const MOCK_CONFIG: MockConfig = {
  minDelayMs: 100,
  maxDelayMs: 500,
  matchCreationDelayMs: 2000,
  eventEmitDelayMs: 100,
  matchResolveDelayMs: 5000,
  userCount: 120,
  nftCount: 560,
  matchCount: 240,
  questCount: 18,
  predictionCount: 12,
  achievementCount: 16,
  rentalCount: 24,
};

export function sampleDelayMs(
  minMs: number = MOCK_CONFIG.minDelayMs,
  maxMs: number = MOCK_CONFIG.maxDelayMs,
): number {
  const lo = Math.min(minMs, maxMs);
  const hi = Math.max(minMs, maxMs);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
