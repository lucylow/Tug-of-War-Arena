/**
 * Mobile safe area — hardware insets plus explorer-reserved chrome.
 *
 * On the Decentraland mobile client the recommended scene UI band is
 * x: 30%–75%, y: 8%–92%. The Expo companion is portrait-first and uses
 * React Native SafeArea for hardware insets; DCL explorer margins are
 * applied only when `layout` is `dcl-explorer`.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/safe-area
 */

import { isMobile } from "./platform";

export type ScreenInsetMode = "device" | "interactable" | "none";
export type SafeAreaLayout = "companion-portrait" | "dcl-explorer";

export interface NormalizedRect {
  x: readonly [number, number];
  y: readonly [number, number];
}

export interface SafeAreaMargins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Reserved margins on the DCL mobile explorer (normalized 0–1), based on
 * the 1600×720 landscape reference. Do not place scene UI in these bands.
 */
export const SAFE_AREA = {
  reserved: {
    left: 0.3,
    right: 0.25,
    top: 0.08,
    bottom: 0.08,
  },
  /** Center safe zone recommended for all scene UI. */
  center: {
    x: [0.3, 0.75] as const,
    y: [0.08, 0.92] as const,
  },
  /** Right-side gap — small elements only (max 48×48). */
  rightGap: {
    x: [0.75, 1] as const,
    y: [0.22, 0.5] as const,
  },
} as const;

/**
 * Portrait companion chrome: keep content off the status bar / home indicator
 * conceptually, and leave the bottom tab bar (≈8%) clear.
 */
export const COMPANION_SAFE_AREA = {
  reserved: {
    left: 0.04,
    right: 0.04,
    top: 0.02,
    bottom: 0.08,
  },
  center: {
    x: [0.04, 0.96] as const,
    y: [0.02, 0.92] as const,
  },
} as const;

export const MIN_INTERACTABLE_CLIENT = "1.12.1";

export function getSafeAreaLayout(): SafeAreaLayout {
  return "companion-portrait";
}

export function getSafeZone(layout: SafeAreaLayout = getSafeAreaLayout()): NormalizedRect {
  if (layout === "dcl-explorer") return SAFE_AREA.center;
  return COMPANION_SAFE_AREA.center;
}

export function getSafeAreaMargins(layout: SafeAreaLayout = getSafeAreaLayout()): SafeAreaMargins {
  const reserved = layout === "dcl-explorer" ? SAFE_AREA.reserved : COMPANION_SAFE_AREA.reserved;
  return {
    left: reserved.left,
    right: reserved.right,
    top: reserved.top,
    bottom: reserved.bottom,
  };
}

export function isInSafeZone(
  x: number,
  y: number,
  layout: SafeAreaLayout = getSafeAreaLayout(),
): boolean {
  const [xMin, xMax] = getSafeZone(layout).x;
  const [yMin, yMax] = getSafeZone(layout).y;
  return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
}

/**
 * Extra padding (points) to add on top of hardware SafeArea when using
 * `screenInset: 'interactable'` in the companion. Landscape DCL 30% gutters
 * are not applied here — they would crush the portrait layout.
 */
export function getInteractablePadding(layout: SafeAreaLayout = getSafeAreaLayout()): SafeAreaMargins {
  if (layout === "dcl-explorer") {
    return getSafeAreaMargins("dcl-explorer");
  }
  return { left: 0, right: 0, top: 0, bottom: 0 };
}

/**
 * Choose the renderer inset mode. `'interactable'` is recommended on mobile
 * so scene UI does not clash with joystick / chat / action buttons.
 */
export function resolveScreenInset(layout: SafeAreaLayout = getSafeAreaLayout()): ScreenInsetMode {
  if (!isMobile()) return "device";
  return layout === "dcl-explorer" ? "interactable" : "device";
}

export function shouldSkipSafeArea(mode: ScreenInsetMode): boolean {
  return mode === "none";
}

/**
 * Normalized position for an actionable dialog (center) vs a status toast (top-center).
 */
export function getUiPlacement(kind: "actionable" | "status", layout: SafeAreaLayout = getSafeAreaLayout()): {
  x: number;
  y: number;
} {
  const zone = getSafeZone(layout);
  const x = (zone.x[0] + zone.x[1]) / 2;
  if (kind === "status") return { x, y: zone.y[0] + 0.04 };
  return { x, y: (zone.y[0] + zone.y[1]) / 2 };
}
