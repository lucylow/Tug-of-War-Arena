/**
 * Bounded render and memory budgets for the companion HUD.
 * Lists window, toasts cap, and particle counts stay inside a phone-safe envelope.
 */

export const COMPANION_RENDER_BUDGET = {
  leaderboardWindow: 12,
  activityWindow: 8,
  roomPreviewWindow: 6,
  toastQueue: 3,
  skeletonCount: 5,
  particleCap: 24,
  particleCapReduced: 0,
  listOverscan: 2,
  memoryMbSoft: 96,
  memoryMbHard: 160,
} as const;

export interface MemoryProbe {
  usedMb: number;
}

export function windowSlice<T>(items: readonly T[], start: number, size: number): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const windowSize = Number.isFinite(size) && size > 0 ? Math.floor(size) : 0;
  if (windowSize === 0) return [];
  const from = Math.max(0, Math.min(items.length, Number.isFinite(start) ? Math.floor(start) : 0));
  return items.slice(from, from + windowSize);
}

export function boundedQueue<T>(items: readonly T[], max: number): T[] {
  const cap = Number.isFinite(max) && max > 0 ? Math.floor(max) : 0;
  if (cap === 0) return [];
  if (items.length <= cap) return [...items];
  return items.slice(items.length - cap);
}

export function particleBudget(reduceMotion: boolean, requested: number = Number(COMPANION_RENDER_BUDGET.particleCap)): number {
  if (reduceMotion) return COMPANION_RENDER_BUDGET.particleCapReduced;
  const cap = COMPANION_RENDER_BUDGET.particleCap;
  if (!Number.isFinite(requested)) return cap;
  return Math.max(0, Math.min(cap, Math.floor(requested)));
}

export function memoryBand(usedMb: number): "ok" | "soft" | "hard" {
  if (!Number.isFinite(usedMb) || usedMb < 0) return "ok";
  if (usedMb > COMPANION_RENDER_BUDGET.memoryMbHard) return "hard";
  if (usedMb > COMPANION_RENDER_BUDGET.memoryMbSoft) return "soft";
  return "ok";
}

export function canAffordList(count: number, windowSize = COMPANION_RENDER_BUDGET.leaderboardWindow): boolean {
  return Number.isFinite(count) && count >= 0 && count <= windowSize + COMPANION_RENDER_BUDGET.listOverscan;
}
