import { afterEach, describe, expect, it } from "vitest";

import { MobileOptimizer, configurePlatformHost } from "../lib/mobile";
import {
  COMPANION_RENDER_BUDGET,
  VisibilityAwareMonitor,
  boundedQueue,
  classifyDevice,
  createDiagnosticSnapshot,
  durationForMotion,
  enqueueNotice,
  emptyNoticeQueue,
  formatFpsLine,
  gradeFromFps,
  memoryBand,
  particleBudget,
  pressScaleForMotion,
  sectionPadding,
  shouldSampleFps,
  windowSlice,
} from "../lib/mobile-ux";

afterEach(() => {
  configurePlatformHost({ os: "ios" });
  MobileOptimizer.resetInstance();
  VisibilityAwareMonitor.resetInstance();
});

describe("visibility-aware performance", () => {
  it("does not report low FPS while hidden", () => {
    configurePlatformHost({ os: "ios" });
    const optimizer = MobileOptimizer.getInstance();
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

    handle.setVisible?.(false);
    const first = queue.shift();
    now = 1000;
    first?.();
    expect(lowFps).toBeNull();
    handle.stop();
  });

  it("samples FPS only when the view is visible and the app is active", () => {
    expect(shouldSampleFps(true, "active")).toBe(true);
    expect(shouldSampleFps(false, "active")).toBe(false);
    expect(shouldSampleFps(true, "background")).toBe(false);

    const samples: number[] = [];
    const queue: Array<() => void> = [];
    let now = 0;
    const handle = VisibilityAwareMonitor.getInstance().start(
      (sample) => samples.push(sample.fps),
      {
        now: () => now,
        requestFrame: (cb) => {
          queue.push(cb);
          return queue.length;
        },
        cancelFrame: () => undefined,
      },
    );
    const tick = queue.shift();
    now = 1000;
    tick?.();
    expect(samples).toEqual([1]);
    handle.setVisible(false);
    handle.stop();
  });
});

describe("render budgets, motion, and diagnostics", () => {
  it("windows lists and caps toasts and particles", () => {
    expect(windowSlice([1, 2, 3, 4], 1, 2)).toEqual([2, 3]);
    expect(boundedQueue([1, 2, 3, 4], 3)).toEqual([2, 3, 4]);
    expect(particleBudget(true, 40)).toBe(0);
    expect(particleBudget(false, 40)).toBe(COMPANION_RENDER_BUDGET.particleCap);
    expect(memoryBand(40)).toBe("ok");
    expect(memoryBand(COMPANION_RENDER_BUDGET.memoryMbSoft + 1)).toBe("soft");
    const notices = enqueueNotice(emptyNoticeQueue(), { kind: "info", message: "hi" }, 10);
    expect(notices.items).toHaveLength(1);
    expect(enqueueNotice(notices, { kind: "info", message: "too soon" }, 20).items).toHaveLength(1);
  });

  it("collapses motion and sizes compact phones tighter", () => {
    expect(durationForMotion(true, 280)).toBe(0);
    expect(pressScaleForMotion(true)).toBe(1);
    expect(classifyDevice(360)).toBe("compact");
    expect(classifyDevice(390)).toBe("regular");
    expect(classifyDevice(800)).toBe("large");
    expect(sectionPadding("compact")).toBeLessThan(sectionPadding("large"));
  });

  it("formats FPS diagnostics", () => {
    expect(gradeFromFps(60)).toBe("good");
    expect(gradeFromFps(24)).toBe("low");
    expect(formatFpsLine(48, 32, true)).toContain("48 FPS");
    expect(createDiagnosticSnapshot({ fps: 12, visible: false }).line).toContain("paused");
  });
});
