import { configurePlatformHost, getPlatform, isMobile } from "./platform";
import { resolveScreenInset } from "./safeArea";
import { setupMobileInput } from "./input";
import { checkMobileLimits, COMPANION_BUDGET } from "./limits";

export interface MobileCompatibilityBoot {
  platform: ReturnType<typeof getPlatform>;
  screenInset: ReturnType<typeof resolveScreenInset>;
  withinLimits: boolean;
}

/**
 * Boot hook for the Expo companion. Call once from the root layout with `Platform.OS`.
 * Detects platform, selects a safe-area mode, and logs a budget check in __DEV__.
 */
export function setupMobileCompatibility(os: string): MobileCompatibilityBoot {
  configurePlatformHost({ os });
  setupMobileInput();

  const platform = getPlatform();
  const screenInset = resolveScreenInset();
  const limits = checkMobileLimits(COMPANION_BUDGET);

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    const label = isMobile() ? "MOBILE" : platform.toUpperCase();
    console.log(`[mobile] Tug of War Arena running on ${label}; inset=${screenInset}`);
    if (!limits.withinLimits) {
      console.warn("[mobile] budget warnings", limits.warnings, limits.hardFailures);
    }
  }

  return { platform, screenInset, withinLimits: limits.withinLimits };
}

export {
  PlatformUtils,
  configurePlatformHost,
  getCompanionResolution,
  getPlatform,
  getPlatformHost,
  getUIScale,
  getVirtualResolution,
  isDesktop,
  isMobile,
  isTouchDevice,
  isWeb,
  type ClientPlatform,
  type HostOS,
  type PlatformHost,
} from "./platform";

export {
  COMPANION_SAFE_AREA,
  MIN_INTERACTABLE_CLIENT,
  SAFE_AREA,
  getInteractablePadding,
  getSafeAreaMargins,
  getSafeZone,
  getUiPlacement,
  isInSafeZone,
  resolveScreenInset,
  shouldSkipSafeArea,
  type NormalizedRect,
  type SafeAreaLayout,
  type SafeAreaMargins,
  type ScreenInsetMode,
} from "./safeArea";

export {
  BUTTON_HEIGHT,
  FONT_SIZE_BODY,
  FONT_SIZE_HEADING,
  ICON_BUTTON_SIZE,
  MIN_TOUCH_TARGET,
  PULL_BUTTON_SIZE,
  UI_SIZING,
  getScaledFontSize,
  getScaledSize,
  hitSlopForSize,
  isTouchTarget,
  touchTargetSize,
} from "./sizing";

export {
  BLOCKED_MOBILE_ACTIONS,
  GameInput,
  MobileInputMap,
  isMobileFriendlyAction,
  mapArenaControl,
  setupMobileInput,
  type ArenaControl,
  type InputAction,
  type InputRegistration,
} from "./input";

export {
  COMPANION_BUDGET,
  MOBILE_LIMITS,
  checkMobileLimits,
  type MobileLimitCheck,
  type MobileSceneStats,
} from "./limits";

export { MobileOptimizer, type FrameClock, type PerformanceMonitorHandle } from "./optimize";

export { PREVIEW_COMMANDS, mobilePreviewInstructions } from "./preview";

export {
  DISCOVER_REQUIREMENTS,
  FEATURED_SUBMIT_URL,
  defaultCompanionControls,
  evaluateDiscoverReadiness,
  submitForFeaturing,
  type DiscoverAudit,
  type DiscoverAuditInput,
} from "./featured";
