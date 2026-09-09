/**
 * Linear congruential generator shared by the mobile companion and the World.
 * Same seed → same demo universe on both surfaces.
 */
export class SeededWorldRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  int(min: number, max: number): number {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return Math.floor(this.next() * (hi - lo + 1)) + lo;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot pick from an empty list");
    }
    return items[this.int(0, items.length - 1)] as T;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i);
      const current = copy[i] as T;
      copy[i] = copy[j] as T;
      copy[j] = current;
    }
    return copy;
  }
}
