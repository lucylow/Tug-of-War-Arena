/**
 * Mobile UI sizing — touch targets and virtual-screen-aware scale.
 *
 * DCL explorers now apply most of the old 3× rule automatically
 * (`devicePixelRatio` + 1600×720 vs 1920×1080). Scale up only where tap
 * targets or body copy actually come up short.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/ui-best-practices
 */

import { isMobile } from "./platform";

export const MIN_TOUCH_TARGET = 44;
export const BUTTON_HEIGHT = 48;
export const FONT_SIZE_BODY = 18;
export const FONT_SIZE_HEADING = 28;
/** Header / settings icon buttons — must meet Apple HIG / Material 44pt. */
export const ICON_BUTTON_SIZE = 44;
/** Primary arena pull control — one-thumb, well above the 44pt floor. */
export const PULL_BUTTON_SIZE = 136;
export const MAX_RIGHT_GAP_CONTROL = 48;

export const UI_SIZING = {
  MIN_TOUCH_TARGET,
  BUTTON_HEIGHT,
  FONT_SIZE_BODY,
  FONT_SIZE_HEADING,
  ICON_BUTTON_SIZE,
  PULL_BUTTON_SIZE,
  getScaledSize,
  getScaledFontSize,
} as const;

export function getScaledSize(baseSize: number): number {
  if (isMobile()) return Math.max(baseSize * 1.5, MIN_TOUCH_TARGET);
  return baseSize;
}

export function getScaledFontSize(baseSize: number): number {
  if (isMobile()) return Math.max(baseSize * 1.4, 16);
  return baseSize;
}

export function touchTargetSize(baseSize: number = MIN_TOUCH_TARGET): number {
  return isMobile() ? Math.max(baseSize, MIN_TOUCH_TARGET) : baseSize;
}

export function isTouchTarget(width: number, height: number): boolean {
  return width >= MIN_TOUCH_TARGET && height >= MIN_TOUCH_TARGET;
}

export function hitSlopForSize(width: number, height: number): { top: number; right: number; bottom: number; left: number } {
  const extraX = Math.max(0, (MIN_TOUCH_TARGET - width) / 2);
  const extraY = Math.max(0, (MIN_TOUCH_TARGET - height) / 2);
  return { top: extraY, right: extraX, bottom: extraY, left: extraX };
}
