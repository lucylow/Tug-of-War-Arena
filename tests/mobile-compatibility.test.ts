import { afterEach, describe, expect, it } from "vitest";

import {
  BLOCKED_MOBILE_ACTIONS,
  COMPANION_BUDGET,
  DISCOVER_REQUIREMENTS,
  FEATURED_SUBMIT_URL,
  GameInput,
  ICON_BUTTON_SIZE,
  MIN_TOUCH_TARGET,
  MOBILE_LIMITS,
  MobileInputMap,
  MobileOptimizer,
  PULL_BUTTON_SIZE,
  SAFE_AREA,
  checkMobileLimits,
  configurePlatformHost,
  evaluateDiscoverReadiness,
  getCompanionResolution,
  getPlatform,
  getScaledFontSize,
  getScaledSize,
  getUIScale,
  getUiPlacement,
  getVirtualResolution,
  hitSlopForSize,
  isDesktop,
  isInSafeZone,
  isMobile,
  isMobileFriendlyAction,
  isTouchTarget,
  isWeb,
  mapArenaControl,
  mobilePreviewInstructions,
  resolveScreenInset,
  setupMobileCompatibility,
  shouldSkipSafeArea,
  submitForFeaturing,
  touchTargetSize,
} from "../lib/mobile";

afterEach(() => {
  configurePlatformHost({ os: "ios" });
  GameInput.resetInstance();
  MobileOptimizer.resetInstance();
});

describe("platform detection", () => {
  it("treats iOS and Android as mobile with a 3× UI scale", () => {
    configurePlatformHost({ os: "ios" });
    expect(isMobile()).toBe(true);
    expect(getPlatform()).toBe("mobile");
    expect(getUIScale()).toBe(3);
    expect(getVirtualResolution()).toEqual({ width: 1600, height: 720 });
    expect(getCompanionResolution()).toEqual({ width: 720, height: 1600 });

    configurePlatformHost({ os: "android" });
    expect(isMobile()).toBe(true);
  });

  it("branches desktop and web, including touch web as mobile", () => {
    configurePlatformHost({ os: "macos" });
    expect(isDesktop()).toBe(true);
    expect(isMobile()).toBe(false);
    expect(getUIScale()).toBe(1);
    expect(getVirtualResolution()).toEqual({ width: 1920, height: 1080 });

    configurePlatformHost({ os: "web" });
    expect(isWeb()).toBe(true);
    expect(isMobile()).toBe(false);

    configurePlatformHost({ os: "web", isTouch: true });
    expect(getPlatform()).toBe("mobile");
  });
});

describe("safe area", () => {
  it("keeps the DCL explorer center band at 30%–75% × 8%–92%", () => {
    expect(SAFE_AREA.center.x).toEqual([0.3, 0.75]);
    expect(SAFE_AREA.center.y).toEqual([0.08, 0.92]);
    expect(isInSafeZone(0.5, 0.5, "dcl-explorer")).toBe(true);
    expect(isInSafeZone(0.1, 0.5, "dcl-explorer")).toBe(false);
    expect(isInSafeZone(0.9, 0.5, "dcl-explorer")).toBe(false);
    expect(isInSafeZone(0.5, 0.04, "dcl-explorer")).toBe(false);
  });

  it("places actionable UI at center and status at top-center", () => {
    const action = getUiPlacement("actionable", "dcl-explorer");
    const status = getUiPlacement("status", "dcl-explorer");
    expect(action.x).toBeCloseTo(0.525);
    expect(action.y).toBeCloseTo(0.5);
    expect(status.y).toBeLessThan(action.y);
    expect(isInSafeZone(status.x, status.y, "dcl-explorer")).toBe(true);
  });

  it("uses device insets on the companion and interactable on the explorer", () => {
    configurePlatformHost({ os: "ios" });
    expect(resolveScreenInset("companion-portrait")).toBe("device");
    expect(resolveScreenInset("dcl-explorer")).toBe("interactable");
    configurePlatformHost({ os: "macos" });
    expect(resolveScreenInset("dcl-explorer")).toBe("device");
    expect(shouldSkipSafeArea("none")).toBe(true);
    expect(shouldSkipSafeArea("device")).toBe(false);
  });
});

describe("UI sizing", () => {
  it("enforces a 44pt minimum touch target on mobile", () => {
    configurePlatformHost({ os: "ios" });
    expect(touchTargetSize(24)).toBe(MIN_TOUCH_TARGET);
    expect(getScaledSize(20)).toBe(MIN_TOUCH_TARGET);
    expect(getScaledFontSize(10)).toBe(16);
    expect(isTouchTarget(ICON_BUTTON_SIZE, ICON_BUTTON_SIZE)).toBe(true);
    expect(isTouchTarget(PULL_BUTTON_SIZE, PULL_BUTTON_SIZE)).toBe(true);
    expect(isTouchTarget(42, 42)).toBe(false);
    expect(hitSlopForSize(32, 32)).toEqual({ top: 6, right: 6, bottom: 6, left: 6 });
  });

  it("leaves desktop sizes unchanged", () => {
    configurePlatformHost({ os: "macos" });
    expect(touchTargetSize(24)).toBe(24);
    expect(getScaledSize(20)).toBe(20);
    expect(getScaledFontSize(10)).toBe(10);
  });
});

describe("touch input mapping", () => {
  it("maps arena controls to reachable mobile actions", () => {
    expect(mapArenaControl("pull")).toBe(MobileInputMap.TAP);
    expect(mapArenaControl("surge")).toBe(MobileInputMap.PRIMARY_ACTION);
    expect(mapArenaControl("ready")).toBe(MobileInputMap.SECONDARY_ACTION);
    expect(mapArenaControl("jump")).toBe(MobileInputMap.JUMP);
    for (const action of BLOCKED_MOBILE_ACTIONS) {
      expect(isMobileFriendlyAction(action)).toBe(false);
    }
  });

  it("skips IA_ACTION_3–6 on mobile and still registers them on desktop", () => {
    configurePlatformHost({ os: "ios" });
    const mobile = GameInput.getInstance();
    const skipped = mobile.registerAction("IA_ACTION_3", () => undefined);
    expect(skipped).toEqual({ registered: false, reason: "IA_ACTION_3 is not reachable on mobile" });
    expect(mobile.onTap(() => undefined).registered).toBe(true);

    GameInput.resetInstance();
    configurePlatformHost({ os: "macos" });
    const desktop = GameInput.getInstance();
    expect(desktop.registerAction("IA_ACTION_3", () => undefined).registered).toBe(true);
  });

  it("emits registered tap handlers", () => {
    const input = GameInput.getInstance();
    let taps = 0;
    input.onTap(() => {
      taps += 1;
    });
    expect(input.emit("IA_POINTER")).toBe(1);
    expect(taps).toBe(1);
    expect(input.emit("IA_PRIMARY")).toBe(0);
  });
});

describe("mobile limits and optimizer", () => {
  it("warns at the soft band and hard-fails above the hard band", () => {
    expect(checkMobileLimits(COMPANION_BUDGET).withinLimits).toBe(true);
    const soft = checkMobileLimits({
      ...COMPANION_BUDGET,
      triangles: MOBILE_LIMITS.triangles.soft + 1,
    });
    expect(soft.withinLimits).toBe(false);
    expect(soft.warnings[0]).toContain("soft limit");
    expect(soft.hardFailures).toEqual([]);

    const hard = checkMobileLimits({
      ...COMPANION_BUDGET,
      entities: MOBILE_LIMITS.entities.hard + 1,
    });
    expect(hard.hardFailures[0]).toContain("hard limit");
  });

  it("shortens lazy-load distance on mobile and reports low FPS", () => {
    configurePlatformHost({ os: "ios" });
    const optimizer = MobileOptimizer.getInstance();
    expect(optimizer.lazyLoadDistance(16)).toBe(12);

    let lowFps: number | null = null;
    const queue: Array<() => void> = [];
    let now = 0;
    const handle = optimizer.enablePerformanceMonitoring(
      (fps) => {
        lowFps = fps;
      },
      {
        now: () => now,
        requestFrame: (cb) => {
          queue.push(cb);
          return queue.length;
        },
        cancelFrame: () => undefined,
      },
    );

    const first = queue.shift();
    expect(first).toBeTypeOf("function");
    now = 1000;
    first?.();
    expect(lowFps).toBe(1);
    handle.stop();

    configurePlatformHost({ os: "macos" });
    expect(MobileOptimizer.getInstance().lazyLoadDistance(16)).toBe(16);
  });
});

describe("Discover featuring audit", () => {
  it("passes the companion control set when a real-device test is recorded", () => {
    const audit = evaluateDiscoverReadiness({
      testedOnRealDevice: true,
      uiPositions: [{ x: 0.5, y: 0.5 }],
    });
    expect(audit.ready).toBe(true);
    expect(audit.checks.every((check) => check.ok)).toBe(true);
    expect(DISCOVER_REQUIREMENTS.performance.minScore).toBe(90);
    expect(submitForFeaturing()).toBe(FEATURED_SUBMIT_URL);
  });

  it("fails blocked input, tiny targets, unsafe placement, and missing device proof", () => {
    const audit = evaluateDiscoverReadiness({
      boundActions: ["IA_ACTION_3"],
      controls: [{ name: "tiny", width: 24, height: 24 }],
      uiPositions: [{ x: 0.05, y: 0.5 }],
      layout: "dcl-explorer",
      performanceScore: 70,
      testedOnRealDevice: false,
    });
    expect(audit.ready).toBe(false);
    expect(audit.checks.find((check) => check.id === "input-mapping")?.ok).toBe(false);
    expect(audit.checks.find((check) => check.id === "touch-targets")?.ok).toBe(false);
    expect(audit.checks.find((check) => check.id === "safe-area")?.ok).toBe(false);
    expect(audit.checks.find((check) => check.id === "performance-score")?.ok).toBe(false);
    expect(audit.checks.find((check) => check.id === "real-device")?.ok).toBe(false);
  });
});

describe("boot and preview", () => {
  it("boots the companion on the host OS and keeps the local budget in range", () => {
    const boot = setupMobileCompatibility("android");
    expect(boot.platform).toBe("mobile");
    expect(boot.screenInset).toBe("device");
    expect(boot.withinLimits).toBe(true);
    expect(mobilePreviewInstructions()).toContain("pnpm start:mobile");
  });
});
