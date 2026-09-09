import { getPlatform, isDesktop, isMobile, isWeb } from '@dcl/sdk/platform'

/**
 * Platform detection for the Decentraland explorer.
 * `getPlatform()` is async — wait until it is non-null before branching UI.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/detect-platform
 */
export const PlatformUtils = {
  isMobile,
  isDesktop,
  isWeb,
  getPlatform,
  getUIScale: (): number => (isMobile() ? 3 : 1),
  getVirtualResolution: (): { width: number; height: number } =>
    isMobile() ? { width: 1600, height: 720 } : { width: 1920, height: 1080 },
  isTouchDevice: (): boolean => isMobile(),
}

export { getPlatform, isDesktop, isMobile, isWeb }
