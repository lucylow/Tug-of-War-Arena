/**
 * Responsive companion sizing. Portrait-first breakpoints keep the PULL
 * control, hero, and lists readable on compact phones without shrinking
 * below the touch floor.
 */

export type DeviceClass = "compact" | "regular" | "large";

export interface Viewport {
  width: number;
  height: number;
}

export const COMPACT_WIDTH = 380;
export const LARGE_WIDTH = 768;

export function classifyDevice(width: number, height = 0): DeviceClass {
  const w = Number.isFinite(width) ? width : 0;
  if (w >= LARGE_WIDTH) return "large";
  if (w > 0 && w < COMPACT_WIDTH) return "compact";
  if (w <= 0 && Number.isFinite(height) && height < 640) return "compact";
  return "regular";
}

export function isCompactViewport(viewport: Viewport): boolean {
  return classifyDevice(viewport.width, viewport.height) === "compact";
}

export function sectionPadding(device: DeviceClass): number {
  if (device === "compact") return 12;
  if (device === "large") return 24;
  return 16;
}

export function heroMinHeight(device: DeviceClass): number {
  if (device === "compact") return 168;
  if (device === "large") return 260;
  return 220;
}

export function listRowHeight(device: DeviceClass): number {
  if (device === "compact") return 56;
  if (device === "large") return 68;
  return 60;
}

export function playerCardAvatarSize(device: DeviceClass): number {
  if (device === "compact") return 32;
  if (device === "large") return 44;
  return 36;
}

export function maxVisibleRows(device: DeviceClass, compactCap: number, regularCap: number): number {
  return device === "compact" ? compactCap : regularCap;
}
