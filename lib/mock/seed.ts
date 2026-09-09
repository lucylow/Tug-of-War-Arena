/**
 * Deterministic PRNG so demo worlds replay identically for a given seed.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Inclusive integer in [min, max]. */
  nextInt(min: number, max: number): number {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot pick from an empty list");
    }
    return items[this.nextInt(0, items.length - 1)] as T;
  }

  weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length === 0) {
      throw new Error("Cannot pick from an empty list");
    }
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = this.next() * total;
    for (let i = 0; i < items.length; i += 1) {
      cursor -= weights[i] ?? 0;
      if (cursor <= 0) {
        return items[i] as T;
      }
    }
    return items[items.length - 1] as T;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = this.nextInt(0, i);
      const current = copy[i] as T;
      copy[i] = copy[j] as T;
      copy[j] = current;
    }
    return copy;
  }
}

export const DEFAULT_MOCK_SEED = 42;
export const MOCK_USER_COUNT = 100;
export const MOCK_NFT_COUNT = 500;
export const MOCK_MATCH_COUNT = 200;
export const MOCK_QUEST_COUNT = 10;
export const MOCK_PREDICTION_COUNT = 5;
export const MOCK_ACHIEVEMENT_COUNT = 8;
export const MOCK_RENTAL_COUNT = 12;
