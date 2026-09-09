/**
 * Mobile Discover featuring requirements.
 *
 * The Expo companion is the judged Friendzone surface. A future SDK7 scene
 * must meet the same Discover bar to appear in the Decentraland mobile app.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/get-featured
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/ios-curation
 */

import { BLOCKED_MOBILE_ACTIONS, isMobileFriendlyAction, mapArenaControl, type InputAction } from "./input";
import { checkMobileLimits, COMPANION_BUDGET, MOBILE_LIMITS, type MobileSceneStats } from "./limits";
import { isMobile } from "./platform";
import { isInSafeZone, type SafeAreaLayout } from "./safeArea";
import { ICON_BUTTON_SIZE, isTouchTarget, MIN_TOUCH_TARGET, PULL_BUTTON_SIZE } from "./sizing";

export const DISCOVER_REQUIREMENTS = {
  performance: {
    minScore: 90,
  },
  ui: {
    minTouchTarget: MIN_TOUCH_TARGET,
    safeArea: true,
    mobileSizing: true,
  },
  input: {
    avoidActions: [...BLOCKED_MOBILE_ACTIONS],
  },
  testing: {
    requireRealDevice: true,
    recommendedDevice: "Samsung Galaxy A54",
  },
} as const;

export const FEATURED_SUBMIT_URL =
  "https://docs.decentraland.org/creator/build-for-mobile/develop/get-featured";

export function submitForFeaturing(): string {
  return FEATURED_SUBMIT_URL;
}

export interface DiscoverAuditInput {
  layout?: SafeAreaLayout;
  uiPositions?: Array<{ x: number; y: number }>;
  controls?: Array<{ name: string; width: number; height: number }>;
  boundActions?: InputAction[];
  stats?: MobileSceneStats;
  performanceScore?: number;
  testedOnRealDevice?: boolean;
}

export interface DiscoverAudit {
  ready: boolean;
  checks: Array<{ id: string; ok: boolean; detail: string }>;
}

export function defaultCompanionControls(): Array<{ name: string; width: number; height: number }> {
  return [
    { name: "pull", width: PULL_BUTTON_SIZE, height: PULL_BUTTON_SIZE },
    { name: "icon", width: ICON_BUTTON_SIZE, height: ICON_BUTTON_SIZE },
  ];
}

export function evaluateDiscoverReadiness(input: DiscoverAuditInput = {}): DiscoverAudit {
  const layout = input.layout ?? "companion-portrait";
  const controls = input.controls ?? defaultCompanionControls();
  const boundActions = input.boundActions ?? [
    mapArenaControl("pull"),
    mapArenaControl("surge"),
    mapArenaControl("ready"),
  ];
  const stats = input.stats ?? COMPANION_BUDGET;
  const positions = input.uiPositions ?? [{ x: 0.5, y: 0.5 }];

  const limits = checkMobileLimits(stats);
  const touchOk = controls.every((control) => isTouchTarget(control.width, control.height));
  const inputOk = boundActions.every((action) => isMobileFriendlyAction(action));
  const safeOk = positions.every((pos) => isInSafeZone(pos.x, pos.y, layout));
  const score = input.performanceScore ?? MOBILE_LIMITS.performance.target;
  const performanceOk = score >= DISCOVER_REQUIREMENTS.performance.minScore;
  const deviceOk = input.testedOnRealDevice === true;

  const checks = [
    { id: "platform-branching", ok: true, detail: isMobile() ? "mobile branch active" : "desktop/web branch active" },
    { id: "safe-area", ok: safeOk, detail: safeOk ? "critical UI inside the safe zone" : "UI collides with reserved chrome" },
    { id: "touch-targets", ok: touchOk, detail: touchOk ? `all controls ≥ ${MIN_TOUCH_TARGET}pt` : "a control is below 44pt" },
    { id: "input-mapping", ok: inputOk, detail: inputOk ? "key actions avoid IA_ACTION_3–6" : "blocked action bound" },
    { id: "scene-limits", ok: limits.withinLimits, detail: limits.withinLimits ? "within mobile soft limits" : [...limits.warnings, ...limits.hardFailures].join("; ") },
    { id: "performance-score", ok: performanceOk, detail: `score ${score}% (min ${DISCOVER_REQUIREMENTS.performance.minScore}%)` },
    { id: "real-device", ok: deviceOk, detail: deviceOk ? `test on ${DISCOVER_REQUIREMENTS.testing.recommendedDevice}` : "real-device test still required" },
  ];

  return { ready: checks.every((check) => check.ok), checks };
}
