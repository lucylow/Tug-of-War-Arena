/**
 * SDK-free graphics fault helpers for the Decentraland scene.
 * Covered by the Expo Vitest suite so WebGL / GLB recovery stays deterministic.
 */

export type SceneGraphicsFault = "context_loss" | "asset_load" | "render" | "unknown";

export type SceneQualityBand = "ultra" | "high" | "medium" | "low" | "minimal";

export interface GltfLoadPlan {
  src: string;
  usePlaceholder: boolean;
  reason?: string;
}

export function classifySceneFault(message: string): SceneGraphicsFault {
  const lower = message.toLowerCase();
  if (lower.includes("webgl") || lower.includes("context lost") || lower.includes("contextlost")) {
    return "context_loss";
  }
  if (
    lower.includes("glb") ||
    lower.includes("gltf") ||
    lower.includes("texture") ||
    lower.includes("asset") ||
    lower.includes("audio") ||
    lower.includes("clip")
  ) {
    return "asset_load";
  }
  if (
    lower.includes("render") ||
    lower.includes("shader") ||
    lower.includes("material") ||
    lower.includes("particle") ||
    lower.includes("light")
  ) {
    return "render";
  }
  return "unknown";
}

export function planGltfLoad(src: string, fallbackSrc = ""): GltfLoadPlan {
  if (!src.trim()) {
    return { src: fallbackSrc, usePlaceholder: fallbackSrc.length === 0, reason: "empty src" };
  }
  return { src, usePlaceholder: false };
}

export function planGltfFallback(src: string, fallbackSrc = "", failed = false): GltfLoadPlan {
  if (!failed) return planGltfLoad(src, fallbackSrc);
  if (fallbackSrc.trim()) {
    return { src: fallbackSrc, usePlaceholder: false, reason: `fallback after ${src}` };
  }
  return { src, usePlaceholder: true, reason: `placeholder after ${src}` };
}

export function shouldShowContextLostBanner(errorCount: number, lastErrorAgeMs: number): boolean {
  if (errorCount <= 0) return false;
  return lastErrorAgeMs < 8_000;
}

export const WEBGL_RESTORE_DELAY_MS = 2000;

export function nextSceneQualityForFps(current: SceneQualityBand, fps: number): SceneQualityBand {
  if (fps < 20) return "minimal";
  if (fps < 30) {
    if (current === "ultra" || current === "high") return "medium";
    if (current === "medium") return "low";
    return "minimal";
  }
  return current;
}
