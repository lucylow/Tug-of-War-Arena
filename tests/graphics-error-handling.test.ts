import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AssetLoader,
  ErrorReportingService,
  GRAPHICS_ASSET_FALLBACKS,
  GraphicsLogger,
  GraphicsQualityManager,
  PerformanceMonitor,
  classifyGraphicsError,
  fallbackUriForType,
  graphicsErrorCopy,
  graphicsErrorFromAsset,
  hashAssetKey,
  initialGraphicsRecoveryState,
  nextAssetRetryDelay,
  nextQualityForFps,
  recommendQualityFromError,
  recommendQualityFromFps,
  reduceGraphicsRecovery,
  shouldDisableEffects,
  shouldPauseVisualEffects,
  shouldRetryAssetLoad,
} from "../lib/graphics";
import { Logger } from "../lib/logger";
import {
  GraphicsErrorHandler,
  QualityManager,
  classifySceneGraphicsError,
  decideGltfLoad,
  initialContextLossState,
  reduceContextLoss,
  resetPerformance,
  shouldDropQualityForEvent,
} from "../scene/src/performance";
import {
  classifySceneFault,
  nextSceneQualityForFps,
  planGltfFallback,
  shouldShowContextLostBanner,
} from "../scene/src/logic/graphicsErrors";

afterEach(() => {
  GraphicsLogger.resetInstance();
  AssetLoader.resetInstance();
  GraphicsQualityManager.resetInstance();
  PerformanceMonitor.resetInstance();
  ErrorReportingService.resetInstance();
  resetPerformance();
  Logger.clear();
});

describe("graphics error classification", () => {
  it("maps WebGL, animation, asset, and performance failures", () => {
    expect(classifyGraphicsError(new Error("WebGL context lost"))).toBe("context_loss");
    expect(classifyGraphicsError("Reanimated worklet crashed")).toBe("animation");
    expect(classifyGraphicsError("Failed to load arena.glb")).toBe("asset_load");
    expect(classifyGraphicsError("FPS dropped below 20")).toBe("performance");
    expect(classifyGraphicsError("Skia canvas failed")).toBe("render");
  });

  it("disables effects for render, animation, and context loss", () => {
    expect(shouldDisableEffects("asset_load")).toBe(false);
    expect(shouldDisableEffects("render")).toBe(true);
    expect(shouldDisableEffects("context_loss")).toBe(true);
  });
});

describe("graphics recovery reducer", () => {
  it("captures a render failure and keeps retry count across reset", () => {
    const failed = reduceGraphicsRecovery(initialGraphicsRecoveryState, {
      type: "capture",
      message: "Skia canvas failed",
    });
    expect(failed.hasError).toBe(true);
    expect(failed.message).toBe("Skia canvas failed");
    expect(failed.disableEffects).toBe(true);
    expect(failed.retryCount).toBe(1);

    const reset = reduceGraphicsRecovery(failed, { type: "reset" });
    expect(reset.hasError).toBe(false);
    expect(reset.retryCount).toBe(1);
    expect(reset.message).toBeNull();
  });

  it("keeps recovery copy and accessibility labels stable", () => {
    expect(graphicsErrorCopy.accessibilityLabel).toBe("Tug of War Arena graphics recovery");
    expect(graphicsErrorCopy.fallbackTitle).toBe("Limited Graphics Mode");
    expect(graphicsErrorCopy.buttonLabel.length).toBeGreaterThan(3);
    expect(graphicsErrorCopy.retryLabel.length).toBeGreaterThan(3);
  });
});

describe("asset loader recovery", () => {
  it("retries remote loads and returns a type-specific fallback", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("HTTP 404: Not Found");
    });
    const loader = new AssetLoader({
      retryCount: 2,
      retryDelayMs: 0,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      delay: async () => undefined,
    });

    const result = await loader.loadAsset({
      uri: "https://invalid.example.com/missing.png",
      type: "image",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(result.error).toContain("404");
    expect(result.uri).toBe(GRAPHICS_ASSET_FALLBACKS.image);
    expect(fallbackUriForType("image")).toContain("data:image");
  });

  it("serves cached URIs without refetching", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, statusText: "OK" }));
    const loader = new AssetLoader({
      retryCount: 0,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const first = await loader.loadAsset({ uri: "https://cdn.example.com/rope.png", type: "image" });
    const second = await loader.loadAsset({ uri: "https://cdn.example.com/rope.png", type: "image" });
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(graphicsErrorFromAsset(first)).toBeNull();
  });

  it("hashes cache keys and spaces retries", () => {
    expect(hashAssetKey("arena.glb")).toMatch(/^asset_/);
    expect(nextAssetRetryDelay(2, 1000)).toBe(2000);
    expect(shouldRetryAssetLoad(1, 2)).toBe(true);
    expect(shouldRetryAssetLoad(3, 2)).toBe(false);
  });
});

describe("companion quality policy", () => {
  it("drops to minimal under 20fps and climbs from low when stable", () => {
    expect(nextQualityForFps("high", 18)).toBe("minimal");
    expect(nextQualityForFps("high", 28)).toBe("medium");
    expect(nextQualityForFps("low", 52)).toBe("medium");
    expect(recommendQualityFromFps(18, "high")).toBe("minimal");
    expect(recommendQualityFromFps(28, "high")).toBe(nextQualityForFps("high", 28));
    expect(recommendQualityFromError("asset_load", "high")).toBe("high");
    expect(recommendQualityFromError("context_loss", "high")).toBe("medium");
    expect(shouldPauseVisualEffects({ level: "minimal", particleCount: 0, confettiEnabled: false, animationsEnabled: false, glowEnabled: false })).toBe(true);
  });

  it("lets GraphicsQualityManager follow FPS reports", () => {
    const manager = GraphicsQualityManager.getInstance();
    expect(manager.handlePerformanceIssue({ fps: 18, memory: 40, droppedFrames: 2, timestamp: 1 })).toBe("minimal");
    expect(manager.getConfig().particleCount).toBe(0);
  });
});

describe("graphics logger", () => {
  it("keeps a bounded ring buffer and reports errors", () => {
    const logger = new GraphicsLogger(2);
    logger.log("warning", "performance", "low fps");
    logger.log("error", "render", "canvas failed");
    logger.log("fatal", "context_loss", "webgl gone");
    expect(logger.getLogs()).toHaveLength(2);
    expect(logger.getLast()?.category).toBe("context_loss");

    ErrorReportingService.getInstance().reportGraphicsError("AnimatedRope", new Error("worklet crash"));
    expect(ErrorReportingService.getInstance().getReports()[0]?.category).toBe("AnimatedRope");
  });
});

describe("performance monitor samples", () => {
  it("emits a report when FPS stays under the warning threshold", () => {
    const monitor = PerformanceMonitor.getInstance();
    monitor.configure({ warningThreshold: 30, now: () => 0, memoryProbe: () => 12 });
    const reports: number[] = [];
    monitor.onIssue((report) => reports.push(report.fps));

    let now = 0;
    for (let frame = 0; frame < 40; frame += 1) {
      now += 50;
      monitor.tick(now);
    }

    expect(reports.length).toBeGreaterThan(0);
    expect(reports[0]).toBeLessThan(30);
  });
});

describe("decentraland scene graphics faults", () => {
  it("plans GLB fallbacks and classifies explorer faults", () => {
    expect(classifySceneFault("WebGL context lost")).toBe("context_loss");
    expect(classifySceneFault("ParticleSystem unavailable")).toBe("render");
    expect(classifySceneFault("Audio clip failed")).toBe("asset_load");
    expect(planGltfFallback("models/arena.glb", "models/arena_fallback.glb", true)).toEqual({
      src: "models/arena_fallback.glb",
      usePlaceholder: false,
      reason: "fallback after models/arena.glb",
    });
    expect(planGltfFallback("models/missing.glb", "", true).usePlaceholder).toBe(true);
    expect(decideGltfLoad({ useGlbAssets: false, src: "models/arena.glb" })).toBe("fallback");
    expect(decideGltfLoad({ useGlbAssets: true, src: "models/arena.glb", createThrows: true })).toBe("fallback");
    expect(nextSceneQualityForFps("high", 18)).toBe("minimal");
    expect(shouldShowContextLostBanner(1, 1000)).toBe(true);
    expect(shouldShowContextLostBanner(1, 9000)).toBe(false);
  });

  it("drops scene quality after a context-loss capture", () => {
    QualityManager.getInstance().setQuality("high");
    const lost = reduceContextLoss(initialContextLossState, { type: "lost" });
    expect(lost.lost).toBe(true);
    expect(classifySceneGraphicsError("webglcontextlost")).toBe("context_loss");
    expect(shouldDropQualityForEvent("context_loss")).toBe(true);

    const handler = GraphicsErrorHandler.getInstance();
    handler.markContextLost();
    expect(handler.getContextState().lost).toBe(true);
    expect(QualityManager.getInstance().getLevel()).not.toBe("high");
    handler.markContextRestored();
    expect(handler.getContextState().lost).toBe(false);
  });
});
