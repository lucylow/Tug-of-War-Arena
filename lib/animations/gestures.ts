export type SwipeDirection = "up" | "down" | "left" | "right";

export const DEFAULT_SWIPE_THRESHOLD = 50;
export const DEFAULT_TAP_SCALE = 0.92;
export const DEFAULT_LONG_PRESS_MS = 380;

export function detectSwipeDirection(
  translationX: number,
  translationY: number,
  threshold: number = DEFAULT_SWIPE_THRESHOLD,
): SwipeDirection | null {
  const dx = Number.isFinite(translationX) ? translationX : 0;
  const dy = Number.isFinite(translationY) ? translationY : 0;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const min = Number.isFinite(threshold) ? Math.max(0, threshold) : DEFAULT_SWIPE_THRESHOLD;

  if (absX < min && absY < min) return null;
  if (absX > absY) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export function clampScale(scaleTo: number | undefined, fallback = DEFAULT_TAP_SCALE): number {
  if (!Number.isFinite(scaleTo)) return fallback;
  return Math.max(0.5, Math.min(1, scaleTo as number));
}
