import { describe, expect, it } from "vitest";

import { PULL_BUTTON_SIZE } from "../lib/mobile";
import {
  DEFAULT_HIT_SLOP,
  MIN_TOUCH_TARGET_PT,
  ONE_THUMB_PULL_SIZE,
  effectiveTouchSize,
  expandHitSlop,
  hitSlopForRect,
  isInThumbReach,
  isOneThumbPull,
  meetsTouchFloor,
  pullControlMetrics,
} from "../lib/mobile-ux";

describe("one-thumb pull geometry", () => {
  it("keeps the PULL control at 136pt, matching the companion sizing constant", () => {
    expect(ONE_THUMB_PULL_SIZE).toBe(136);
    expect(ONE_THUMB_PULL_SIZE).toBe(PULL_BUTTON_SIZE);
    expect(isOneThumbPull(136, 136)).toBe(true);
    expect(isOneThumbPull(44, 44)).toBe(false);
    const metrics = pullControlMetrics();
    expect(metrics.size).toBe(136);
    expect(metrics.radius).toBe(68);
    expect(metrics.meetsFloor).toBe(true);
    expect(metrics.hitSlop).toEqual(expandHitSlop(DEFAULT_HIT_SLOP));
  });

  it("expands undersized chrome to the 44pt floor with hit slop", () => {
    expect(meetsTouchFloor(44, 44)).toBe(true);
    expect(meetsTouchFloor(32, 32)).toBe(false);
    expect(hitSlopForRect(32, 32)).toEqual({ top: 6, right: 6, bottom: 6, left: 6 });
    expect(hitSlopForRect(44, 44)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    expect(effectiveTouchSize({ width: 32, height: 32 }, hitSlopForRect(32, 32))).toEqual({
      width: MIN_TOUCH_TARGET_PT,
      height: MIN_TOUCH_TARGET_PT,
    });
  });

  it("places the pull in the lower thumb-reach band", () => {
    expect(isInThumbReach(0.5, 0.78)).toBe(true);
    expect(isInThumbReach(0.5, 0.2)).toBe(false);
    expect(isInThumbReach(0.05, 0.8)).toBe(false);
  });
});
