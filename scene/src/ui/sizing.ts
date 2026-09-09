import { isMobile } from '@dcl/sdk/platform'

export const MIN_TOUCH_TARGET = 44
export const BUTTON_HEIGHT = 48
export const FONT_SIZE_BODY = 18
export const FONT_SIZE_HEADING = 28

export const UI_SIZING = {
  MIN_TOUCH_TARGET,
  BUTTON_HEIGHT,
  FONT_SIZE_BODY,
  FONT_SIZE_HEADING,
  getScaledSize: (baseSize: number): number => (isMobile() ? Math.max(baseSize * 1.5, MIN_TOUCH_TARGET) : baseSize),
  getScaledFontSize: (baseSize: number): number => (isMobile() ? Math.max(baseSize * 1.4, 16) : baseSize),
}

export function touchTargetSize(baseSize: number = MIN_TOUCH_TARGET): number {
  return isMobile() ? Math.max(baseSize, MIN_TOUCH_TARGET) : baseSize
}

export function hudButtonSize(): { width: number; height: number; fontSize: number } {
  if (isMobile()) {
    return { width: 180, height: 56, fontSize: 20 }
  }
  return { width: 160, height: 48, fontSize: 18 }
}
