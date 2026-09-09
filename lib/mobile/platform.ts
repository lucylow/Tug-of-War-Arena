/**
 * Platform detection for the Decentraland / Friendzone mobile companion.
 *
 * Mirrors `@dcl/sdk/platform` (`isMobile`, `isDesktop`, `isWeb`, `getPlatform`)
 * so the Expo app and a future SDK7 scene can share the same branching rules.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/detect-platform
 */

export type ClientPlatform = "mobile" | "desktop" | "web";
export type HostOS = "ios" | "android" | "web" | "windows" | "macos" | string;

export interface PlatformHost {
  os: HostOS;
  /** True when a web client is a touch device (phone browser / DCL mobile web). */
  isTouch?: boolean;
}

/**
 * Mobile-first default: this repository is the portrait companion app.
 * `configurePlatformHost` should run once at boot with the real `Platform.OS`.
 */
let host: PlatformHost = { os: "ios" };

export function configurePlatformHost(next: PlatformHost): void {
  host = { os: next.os, isTouch: next.isTouch };
}

export function getPlatformHost(): PlatformHost {
  return host;
}

export function getPlatform(): ClientPlatform {
  if (host.os === "ios" || host.os === "android") return "mobile";
  if (host.os === "web") return host.isTouch ? "mobile" : "web";
  return "desktop";
}

export function isMobile(): boolean {
  return getPlatform() === "mobile";
}

export function isDesktop(): boolean {
  return getPlatform() === "desktop";
}

export function isWeb(): boolean {
  return getPlatform() === "web";
}

export function isTouchDevice(): boolean {
  return isMobile() || host.isTouch === true;
}

/**
 * UI scale factor used when the two platforms genuinely need different sizes.
 * DCL used to recommend 3× on mobile; the explorer now applies most of that
 * automatically. The companion still uses 3× as a conservative touch-target
 * multiplier when a desktop-authored pixel size is passed in.
 */
export function getUIScale(): number {
  return isMobile() ? 3 : 1;
}

/**
 * Virtual screen reference resolution.
 * Mobile / DCL explorer: 1600×720 landscape.
 * Desktop / web: 1920×1080.
 * The Expo companion is portrait-first; callers that need a portrait frame
 * should swap width/height via `getCompanionResolution`.
 */
export function getVirtualResolution(): { width: number; height: number } {
  if (isMobile()) return { width: 1600, height: 720 };
  return { width: 1920, height: 1080 };
}

/** Portrait-first frame used by the Expo companion (720×1600). */
export function getCompanionResolution(): { width: number; height: number } {
  if (isMobile()) return { width: 720, height: 1600 };
  return { width: 1080, height: 1920 };
}

export const PlatformUtils = {
  isMobile,
  isDesktop,
  isWeb,
  isTouchDevice,
  getPlatform,
  getUIScale,
  getVirtualResolution,
  getCompanionResolution,
};
