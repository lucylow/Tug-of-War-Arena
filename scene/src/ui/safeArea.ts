import { isMobile } from '@dcl/sdk/platform'

/**
 * Mobile safe area (normalized). The explorer reports live insets — prefer
 * `screenInset: 'interactable'` over hardcoding these numbers at runtime.
 *
 * Center band: x 30%–75%, y 8%–92%.
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/safe-area
 */
export const SAFE_AREA = {
  reserved: { left: 0.3, right: 0.25, top: 0.08, bottom: 0.08 },
  center: { x: [0.3, 0.75] as const, y: [0.08, 0.92] as const },
  rightGap: { x: [0.75, 1] as const, y: [0.22, 0.5] as const },
} as const

export function getSafeAreaMargins() {
  return { ...SAFE_AREA.reserved }
}

export function isInSafeZone(x: number, y: number): boolean {
  const [xMin, xMax] = SAFE_AREA.center.x
  const [yMin, yMax] = SAFE_AREA.center.y
  return x >= xMin && x <= xMax && y >= yMin && y <= yMax
}

export type UiRendererOptions = {
  virtualWidth: number
  virtualHeight: number
  screenInset?: 'none' | 'device' | 'interactable'
}

/**
 * Renderer options for the HUD. Use `'interactable'` only on mobile so desktop
 * keeps the full canvas (desktop interactable reserves ~25% on the left).
 */
export function getUiRendererOptions(): UiRendererOptions {
  if (isMobile()) {
    return { virtualWidth: 1600, virtualHeight: 720, screenInset: 'interactable' }
  }
  return { virtualWidth: 1920, virtualHeight: 1080 }
}
