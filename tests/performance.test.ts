import { afterEach, describe, expect, it } from "vitest";

import {
  AdaptiveQualitySystem,
  BudgetAwareLoader,
  DESKTOP_BUDGETS,
  EMPTY_STATS,
  FramerateTracker,
  MOBILE_BUDGETS,
  MemoryTracker,
  PerformanceMonitorUI,
  QUALITY_PRESETS,
  QualityManager,
  SceneBudgetChecker,
  createStats,
  estimateMemoryMb,
  getPerformanceSnapshot,
  resetPerformance,
  setupPerformance,
  tickPerformance,
  venueLodFromQuality,
} from "../scene/src/performance";

afterEach(() => {
  resetPerformance();
});

describe("scene budgets", () => {
  it("matches Decentraland mobile soft/hard bands", () => {
    expect(MOBILE_BUDGETS.triangles.soft).toBe(1_000_000);
    expect(MOBILE_BUDGETS.triangles.hard).toBe(1_200_000);
    expect(MOBILE_BUDGETS.entities.soft).toBe(4_800);
    expect(MOBILE_BUDGETS.drawCalls.hard).toBe(2_000);
    expect(DESKTOP_BUDGETS.entities.soft).toBeGreaterThan(MOBILE_BUDGETS.entities.soft);
  });

  it("estimates memory from meshes and textures", () => {
    expect(estimateMemoryMb({ ...EMPTY_STATS, meshes: 10, textures: 10, entities: 50, triangles: 80_000 })).toBeGreaterThan(
      0,
    );
  });
});

describe("FramerateTracker", () => {
  it("records 60fps from sixty 16ms frames", () => {
    const tracker = FramerateTracker.getInstance();
    for (let i = 0; i < 60; i += 1) {
      tracker.tick(1 / 60);
    }
    expect(tracker.getCurrentFps()).toBeGreaterThan(50);
    expect(tracker.getAverageFps(1)).toBeGreaterThan(50);
  });

  it("fires low and critical callbacks from a rolling average", () => {
    const tracker = FramerateTracker.getInstance();
    const events: string[] = [];
    tracker.onLowFpsEvent(() => events.push("low"));
    tracker.onCriticalFpsEvent(() => events.push("critical"));
    tracker.onFpsRecoveredEvent(() => events.push("recovered"));

    for (let i = 0; i < 5; i += 1) tracker.recordSample(25);
    expect(events).toEqual(["low"]);

    for (let i = 0; i < 5; i += 1) tracker.recordSample(12);
    expect(events).toContain("critical");

    for (let i = 0; i < 5; i += 1) tracker.recordSample(55);
    expect(events).toContain("recovered");
    expect(tracker.isBelowLowThreshold()).toBe(false);
  });
});

describe("SceneBudgetChecker", () => {
  it("warns at the soft band and errors above the hard band", () => {
    const checker = SceneBudgetChecker.getInstance();
    const warnings: string[] = [];
    const errors: string[] = [];
    checker.onWarning((metric) => warnings.push(metric));
    checker.onError((metric) => errors.push(metric));

    checker.setStats(createStats({ triangles: MOBILE_BUDGETS.triangles.soft + 1 }));
    const soft = checker.forceCheck();
    expect(soft.withinSoftLimits).toBe(false);
    expect(soft.withinHardLimits).toBe(true);
    expect(warnings).toContain("triangles");

    checker.setStats(createStats({ entities: MOBILE_BUDGETS.entities.hard + 1 }));
    const hard = checker.forceCheck();
    expect(hard.withinHardLimits).toBe(false);
    expect(errors).toContain("entities");
  });

  it("records primitives incrementally and refuses unaffordable loads", () => {
    const checker = SceneBudgetChecker.getInstance();
    checker.record({ entities: 10, meshes: 10, triangles: 120, drawCalls: 10, materials: 1 });
    expect(checker.collectStats().entities).toBe(10);
    expect(checker.canAfford({ entities: 10 })).toBe(true);
    checker.record({ entities: MOBILE_BUDGETS.entities.soft });
    expect(checker.canAfford({ entities: 1 })).toBe(false);
  });
});

describe("QualityManager", () => {
  it("starts at medium on mobile and steps down to minimal", () => {
    setupPerformance({ mobile: true, debug: false });
    const quality = QualityManager.getInstance();
    expect(quality.getLevel()).toBe("medium");
    expect(quality.getRecommendedLevel()).toBe("medium");
    expect(quality.getSettings().particleCount).toBe(QUALITY_PRESETS.medium.particleCount);
    expect(quality.reduceQuality()).toBe(true);
    expect(quality.getLevel()).toBe("low");
    expect(quality.reduceQuality()).toBe(true);
    expect(quality.reduceQuality()).toBe(false);
    expect(quality.getLevel()).toBe("minimal");
    expect(venueLodFromQuality("minimal")).toBe("low");
  });

  it("notifies listeners when quality changes", () => {
    const quality = QualityManager.getInstance();
    const seen: string[] = [];
    quality.onQualityChange((level) => seen.push(level));
    quality.setQuality("low");
    expect(seen).toEqual(["low"]);
    quality.setQuality("low");
    expect(seen).toEqual(["low"]);
  });
});

describe("AdaptiveQualitySystem", () => {
  it("drops quality on sustained low FPS and climbs back when stable", () => {
    let now = 10_000;
    const handles = setupPerformance({ mobile: true, debug: false, now: () => now });
    expect(handles.quality.getLevel()).toBe("medium");

    for (let i = 0; i < 5; i += 1) handles.fps.recordSample(24);
    expect(handles.quality.getLevel()).toBe("low");
    expect(handles.adaptive.getLastReason()).toBe("fps_low");

    now += 6_000;
    for (let i = 0; i < 5; i += 1) handles.fps.recordSample(58);
    handles.adaptive.evaluate();
    expect(handles.quality.getLevel()).toBe("medium");
  });

  it("skips two steps on a hard budget error", () => {
    const handles = setupPerformance({ mobile: true, debug: false });
    handles.budget.setStats(createStats({ drawCalls: MOBILE_BUDGETS.drawCalls.hard + 10 }));
    handles.budget.forceCheck();
    expect(handles.quality.getLevel()).toBe("minimal");
    expect(handles.adaptive.getLastReason()).toBe("budget_error");
  });

  it("does not auto-raise above medium on mobile", () => {
    let now = 0;
    const handles = setupPerformance({ mobile: true, debug: false, now: () => now });
    handles.quality.setQuality("medium");
    now += 6_000;
    for (let i = 0; i < 5; i += 1) handles.fps.recordSample(60);
    handles.adaptive.evaluate();
    expect(handles.quality.getLevel()).toBe("medium");
  });
});

describe("BudgetAwareLoader", () => {
  it("releases high-priority assets first while the soft cap allows", () => {
    const loader = BudgetAwareLoader.getInstance();
    loader.setLoadInterval(0);
    const loaded: string[] = [];
    loader.requestLoad("models/flags.glb", { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 2, (req) => {
      loaded.push(req.src);
    }, { entities: 4, meshes: 1, triangles: 200 });
    loader.requestLoad("models/rope.glb", { x: 0, y: 1.5, z: 0 }, { x: 1, y: 1, z: 1 }, 10, (req) => {
      loaded.push(req.src);
    }, { entities: 4, meshes: 1, triangles: 200 });

    const batch = loader.processQueue();
    expect(batch[0]?.src).toBe("models/rope.glb");
    expect(loaded[0]).toBe("models/rope.glb");
    expect(loader.loadedCount()).toBe(2);
    expect(SceneBudgetChecker.getInstance().collectStats().entities).toBe(8);
  });

  it("defers loads when the entity budget is exhausted", () => {
    const checker = SceneBudgetChecker.getInstance();
    checker.record({ entities: MOBILE_BUDGETS.entities.soft - 2 });
    const loader = BudgetAwareLoader.getInstance();
    loader.requestLoad("models/crowd.glb", { x: 1, y: 0, z: 1 }, { x: 1, y: 1, z: 1 }, 1, undefined, {
      entities: 10,
    });
    expect(loader.processQueue()).toEqual([]);
    expect(loader.pendingCount()).toBe(1);
  });
});

describe("MemoryTracker and monitor UI", () => {
  it("samples estimated memory and exposes overlay lines", () => {
    const handles = setupPerformance({ mobile: true, debug: true });
    handles.budget.record({ entities: 40, meshes: 20, textures: 8, triangles: 12_000 });
    MemoryTracker.getInstance().sample(Date.now() + 3_000);
    tickPerformance(1 / 60, Date.now() + 3_000);
    const snap = getPerformanceSnapshot();
    expect(snap.visible).toBe(true);
    expect(snap.quality).toBe("medium");
    expect(snap.lines[0]).toContain("FPS");
    expect(PerformanceMonitorUI.getInstance().isVisible()).toBe(true);
    PerformanceMonitorUI.getInstance().hide();
    expect(getPerformanceSnapshot().visible).toBe(false);
  });
});
