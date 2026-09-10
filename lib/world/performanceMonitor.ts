export interface PerformanceSnapshot {
  fpsEstimate: number;
  renderCount: number;
  networkLatencyMs: number | null;
  worldEntityCount: number;
  temporaryEffectCount: number;
}

export function createPerformanceMonitor(enabled = false) {
  let renderCount = 0;
  let last = 0;
  let fps = 60;

  return {
    enabled,
    markRender(now = Date.now()): void {
      if (!enabled) return;
      renderCount += 1;
      if (last) fps = Math.round(1000 / Math.max(1, now - last));
      last = now;
    },
    snapshot(extra: Partial<PerformanceSnapshot> = {}): PerformanceSnapshot | null {
      if (!enabled) return null;
      return {
        fpsEstimate: fps,
        renderCount,
        networkLatencyMs: extra.networkLatencyMs ?? null,
        worldEntityCount: extra.worldEntityCount ?? 0,
        temporaryEffectCount: extra.temporaryEffectCount ?? 0,
      };
    },
  };
}
