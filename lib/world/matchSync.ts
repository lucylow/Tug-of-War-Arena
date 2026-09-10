import { MAX_CACHED_MATCHES } from "../../shared/budgets";
import { createWorldMatchResult, type WorldMatchResult } from "../../shared/match";

export class WorldMatchSyncService {
  private latest: WorldMatchResult | null = null;
  private cache: WorldMatchResult[] = [];

  submitResult(result: WorldMatchResult): WorldMatchResult {
    const saved = createWorldMatchResult(result);
    this.cacheResult(saved);
    this.latest = saved;
    return saved;
  }

  getLatestResult(): WorldMatchResult | null {
    return this.latest;
  }

  cacheResult(result: WorldMatchResult): void {
    const saved = createWorldMatchResult(result);
    this.cache = [saved, ...this.cache.filter((item) => item.id !== saved.id)].slice(0, MAX_CACHED_MATCHES);
    if (!this.latest) this.latest = saved;
  }

  getCached(): WorldMatchResult[] {
    return [...this.cache];
  }

  reset(): void {
    this.latest = null;
    this.cache = [];
  }
}

let singleton: WorldMatchSyncService | null = null;

export function getWorldMatchSyncService(): WorldMatchSyncService {
  if (!singleton) singleton = new WorldMatchSyncService();
  return singleton;
}

export function resetWorldMatchSyncService(): void {
  singleton = null;
}
