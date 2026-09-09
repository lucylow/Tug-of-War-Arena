/**
 * One-thumb touch geometry for the Expo companion.
 * The primary PULL control is 136pt — well above the 44pt floor — and
 * smaller chrome expands via hitSlop rather than shrinking the visual.
 */

export const MIN_TOUCH_TARGET_PT = 44;
export const ONE_THUMB_PULL_SIZE = 136;
export const ICON_CHROME_SIZE = 44;
export const QUICK_ACTION_SIZE = 52;
export const DEFAULT_HIT_SLOP = 8;

export interface HitSlop {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TouchRect {
  width: number;
  height: number;
}

export function clampNonNegative(value: number, fallback = 0): number {
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

export function hitSlopForRect(width: number, height: number, min = MIN_TOUCH_TARGET_PT): HitSlop {
  const w = clampNonNegative(width);
  const h = clampNonNegative(height);
  const floor = Number.isFinite(min) && min > 0 ? min : MIN_TOUCH_TARGET_PT;
  const extraX = Math.max(0, (floor - w) / 2);
  const extraY = Math.max(0, (floor - h) / 2);
  return { top: extraY, right: extraX, bottom: extraY, left: extraX };
}

export function expandHitSlop(base: number = DEFAULT_HIT_SLOP): HitSlop {
  const pad = clampNonNegative(base, DEFAULT_HIT_SLOP);
  return { top: pad, right: pad, bottom: pad, left: pad };
}

export function effectiveTouchSize(rect: TouchRect, slop: HitSlop): { width: number; height: number } {
  return {
    width: clampNonNegative(rect.width) + slop.left + slop.right,
    height: clampNonNegative(rect.height) + slop.top + slop.bottom,
  };
}

export function meetsTouchFloor(width: number, height: number, min = MIN_TOUCH_TARGET_PT): boolean {
  return width >= min && height >= min;
}

export function isOneThumbPull(width: number, height: number): boolean {
  return width >= ONE_THUMB_PULL_SIZE && height >= ONE_THUMB_PULL_SIZE;
}

/**
 * Thumb-reach band for a portrait phone: bottom 42% of the screen,
 * horizontally centered ±36% from the midline.
 */
export function isInThumbReach(xNorm: number, yNorm: number): boolean {
  const x = Number.isFinite(xNorm) ? xNorm : 0;
  const y = Number.isFinite(yNorm) ? yNorm : 0;
  return x >= 0.14 && x <= 0.86 && y >= 0.58 && y <= 0.96;
}

export function pullControlMetrics(size = ONE_THUMB_PULL_SIZE): {
  size: number;
  radius: number;
  hitSlop: HitSlop;
  meetsFloor: boolean;
} {
  const resolved = Math.max(ONE_THUMB_PULL_SIZE, clampNonNegative(size, ONE_THUMB_PULL_SIZE));
  return {
    size: resolved,
    radius: resolved / 2,
    hitSlop: expandHitSlop(DEFAULT_HIT_SLOP),
    meetsFloor: isOneThumbPull(resolved, resolved),
  };
}
