import { afterEach, describe, expect, it } from "vitest";

import {
  COMBO_VISIBLE_AT,
  CONFETTI_DURATION_MS,
  DEFAULT_SWIPE_THRESHOLD,
  DEFAULT_TAP_SCALE,
  HUD_LOW_TIME,
  SURGE_STREAK,
  buildRopePoints,
  clampScale,
  comboMultiplier,
  confettiPose,
  countdownLabel,
  createConfettiPieces,
  createImmediateScheduler,
  detectSwipeDirection,
  formatHudScore,
  formatHudTimer,
  isComboVisible,
  isSurgeReady,
  nextCountdown,
  normalizeRopePosition,
  powerProgress,
  ropePathD,
  scheduleAfterInteractions,
  shouldGlow,
  shouldPulseTimer,
  withAlpha,
} from "../lib/animations";
import { canPlayHaptics } from "../lib/haptics-policy";
import { GameClient } from "../lib/game-client";
import { GameInput, MobileInputMap } from "../lib/mobile";
import { arenaTransition, fadeFromBottom, fadeIn, slideLeft } from "../lib/navigation/transitions";

afterEach(() => {
  GameInput.resetInstance();
});

describe("gesture detection", () => {
  it("returns null until the threshold is crossed", () => {
    expect(detectSwipeDirection(10, 8, DEFAULT_SWIPE_THRESHOLD)).toBeNull();
    expect(detectSwipeDirection(49, 0, 50)).toBeNull();
  });

  it("prefers the dominant axis", () => {
    expect(detectSwipeDirection(80, 10)).toBe("right");
    expect(detectSwipeDirection(-80, 10)).toBe("left");
    expect(detectSwipeDirection(10, -80)).toBe("up");
    expect(detectSwipeDirection(10, 80)).toBe("down");
  });

  it("clamps tap scales into a safe spring range", () => {
    expect(clampScale(undefined)).toBe(DEFAULT_TAP_SCALE);
    expect(clampScale(Number.NaN)).toBe(DEFAULT_TAP_SCALE);
    expect(clampScale(0.2)).toBe(0.5);
    expect(clampScale(1.4)).toBe(1);
    expect(clampScale(0.88)).toBe(0.88);
  });
});

describe("power bars", () => {
  it("clamps progress and glow", () => {
    expect(powerProgress(250, 500)).toBe(0.5);
    expect(powerProgress(800, 500)).toBe(1);
    expect(powerProgress(-4, 500)).toBe(0);
    expect(powerProgress(10, 0)).toBe(0);
    expect(shouldGlow(400, 500, true)).toBe(true);
    expect(shouldGlow(200, 500, true)).toBe(false);
    expect(shouldGlow(400, 500, false)).toBe(false);
  });

  it("appends hex alpha for solid colors", () => {
    expect(withAlpha("#FF6B6B", "44")).toBe("#FF6B6B44");
    expect(withAlpha("rgba(0,0,0,1)", "44")).toBe("rgba(0,0,0,1)");
  });
});

describe("rope physics path", () => {
  it("builds a left-to-right curve whose amplitude grows with tension", () => {
    const calm = buildRopePoints(0, 200, 20, 2);
    const taut = buildRopePoints(44, 200, 20, 2);
    expect(calm[0]?.x).toBe(0);
    expect(calm[calm.length - 1]?.x).toBe(200);
    const calmAmp = Math.max(...calm.map((point) => Math.abs(point.y)));
    const tautAmp = Math.max(...taut.map((point) => Math.abs(point.y)));
    expect(tautAmp).toBeGreaterThan(calmAmp);
    expect(ropePathD(taut).startsWith("M")).toBe(true);
  });

  it("clamps out-of-range positions", () => {
    expect(normalizeRopePosition(90)).toBe(44);
    expect(normalizeRopePosition(-90)).toBe(-44);
    expect(normalizeRopePosition(Number.NaN)).toBe(0);
  });
});

describe("combo and countdown", () => {
  it("shows combo from three taps and charges surge at seven", () => {
    expect(isComboVisible(COMBO_VISIBLE_AT - 1)).toBe(false);
    expect(isComboVisible(COMBO_VISIBLE_AT)).toBe(true);
    expect(comboMultiplier(3)).toBe(1.1);
    expect(comboMultiplier(7)).toBe(1.5);
    expect(isSurgeReady(SURGE_STREAK - 1)).toBe(false);
    expect(isSurgeReady(SURGE_STREAK)).toBe(true);
  });

  it("walks 3-2-1-GO then clears", () => {
    expect(countdownLabel(3)).toBe("3");
    expect(countdownLabel(0)).toBe("GO!");
    expect(nextCountdown(3)).toBe(2);
    expect(nextCountdown(1)).toBe(0);
    expect(nextCountdown(0)).toBeNull();
    expect(nextCountdown(9)).toBeNull();
  });
});

describe("confetti and HUD", () => {
  it("spawns a deterministic burst and settles off-screen", () => {
    const pieces = createConfettiPieces(12, 360, 640, undefined, 7);
    expect(pieces).toHaveLength(12);
    const first = pieces[0];
    expect(first).toBeDefined();
    if (!first) return;
    const start = confettiPose(first, 0);
    const end = confettiPose(first, 1);
    expect(start.opacity).toBe(1);
    expect(end.opacity).toBe(0);
    expect(end.y).toBeGreaterThan(start.y);
    expect(CONFETTI_DURATION_MS).toBe(2000);
  });

  it("pulses the timer only in the closing seconds", () => {
    expect(shouldPulseTimer(HUD_LOW_TIME)).toBe(false);
    expect(shouldPulseTimer(9)).toBe(true);
    expect(formatHudTimer(9.2)).toBe("10");
    expect(formatHudScore(12.4, 7.8)).toBe("12 - 8");
  });
});

describe("haptics and game client", () => {
  it("skips haptics on web", () => {
    expect(canPlayHaptics("web")).toBe(false);
    expect(canPlayHaptics("ios")).toBe(true);
    expect(canPlayHaptics("android")).toBe(true);
  });

  it("maps tap and upward swipe onto mobile-friendly input actions", () => {
    const input = GameInput.getInstance();
    const taps: string[] = [];
    const surges: string[] = [];
    input.onTap(() => taps.push("tap"));
    input.onPrimaryAction(() => surges.push("surge"));
    GameClient.sendTap();
    GameClient.sendSwipe("up");
    GameClient.sendSwipe("left");
    expect(taps).toEqual(["tap"]);
    expect(surges).toEqual(["surge"]);
    expect(MobileInputMap.TAP).toBe("IA_POINTER");
    expect(MobileInputMap.PRIMARY_ACTION).toBe("IA_PRIMARY");
  });
});

describe("performance and navigation", () => {
  it("runs scheduled work through an injected scheduler", () => {
    const calls: string[] = [];
    const handle = scheduleAfterInteractions(
      () => calls.push("run"),
      (task) => {
        task();
        return { cancel: () => calls.push("cancel") };
      },
    );
    expect(calls).toEqual(["run"]);
    handle.cancel();
    expect(calls).toEqual(["run", "cancel"]);
    const immediate = createImmediateScheduler();
    const pending = immediate(() => calls.push("later"));
    pending.cancel();
  });

  it("exports expo-router compatible transition presets", () => {
    expect(slideLeft.animation).toBe("slide_from_right");
    expect(fadeFromBottom.animation).toBe("fade_from_bottom");
    expect(fadeIn.animation).toBe("fade");
    expect(arenaTransition).toBe(fadeFromBottom);
  });
});
