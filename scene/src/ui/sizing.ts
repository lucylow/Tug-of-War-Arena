import { isExplorerMobile } from '../utils/platform'

import { getArenaHudPolicy } from '../logic/mobileRuntime'

export const MIN_TOUCH_TARGET = 44
export const BUTTON_HEIGHT = 48
export const FONT_SIZE_BODY = 18
export const FONT_SIZE_HEADING = 28

export const UI_SIZING = {
  MIN_TOUCH_TARGET,
  BUTTON_HEIGHT,
  FONT_SIZE_BODY,
  FONT_SIZE_HEADING,
  getScaledSize: (baseSize: number): number =>
    isExplorerMobile() ? Math.max(baseSize * 1.5, MIN_TOUCH_TARGET) : baseSize,
  getScaledFontSize: (baseSize: number): number =>
    isExplorerMobile() ? Math.max(baseSize * 1.4, 16) : baseSize,
}

export function touchTargetSize(baseSize: number = MIN_TOUCH_TARGET): number {
  return isExplorerMobile() ? Math.max(baseSize, MIN_TOUCH_TARGET) : baseSize
}

export function hudButtonSize(): { width: number; height: number; fontSize: number } {
  const policy = getArenaHudPolicy(isExplorerMobile())
  return { width: policy.pullWidth, height: policy.pullHeight, fontSize: policy.fontSize }
}
