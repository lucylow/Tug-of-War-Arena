export type GraphicsErrorType = "asset_load" | "context_loss" | "render" | "animation" | "performance";

export type QualityLevel = "high" | "medium" | "low" | "minimal";

export interface GraphicsError {
  type: GraphicsErrorType;
  message: string;
  details?: unknown;
}

export interface GraphicsConfig {
  level: QualityLevel;
  particleCount: number;
  shadowQuality: number;
  textureResolution: number;
  antiAliasing: boolean;
  postProcessing: boolean;
}

export interface PerformanceReport {
  fps: number;
  memory: number;
  droppedFrames: number;
  timestamp: number;
}

export const QUALITY_ORDER: QualityLevel[] = ["high", "medium", "low", "minimal"];

export const QUALITY_PRESETS: Record<QualityLevel, GraphicsConfig> = {
  high: {
    level: "high",
    particleCount: 100,
    shadowQuality: 2,
    textureResolution: 1024,
    antiAliasing: true,
    postProcessing: true,
  },
  medium: {
    level: "medium",
    particleCount: 50,
    shadowQuality: 1,
    textureResolution: 512,
    antiAliasing: true,
    postProcessing: false,
  },
  low: {
    level: "low",
    particleCount: 20,
    shadowQuality: 0,
    textureResolution: 256,
    antiAliasing: false,
    postProcessing: false,
  },
  minimal: {
    level: "minimal",
    particleCount: 0,
    shadowQuality: 0,
    textureResolution: 128,
    antiAliasing: false,
    postProcessing: false,
  },
};

export function configForLevel(level: QualityLevel): GraphicsConfig {
  return { ...QUALITY_PRESETS[level] };
}

/**
 * Decide the next client quality band from a measured FPS sample.
 * Drops quickly under 30fps, floors at minimal under 20fps, and climbs one step when stable.
 */
export function nextQualityForFps(current: QualityLevel, fps: number): QualityLevel {
  if (!Number.isFinite(fps) || fps < 0) return current;
  if (fps < 20) return "minimal";
  if (fps < 30 && current !== "minimal") return current === "high" ? "medium" : "low";
  if (fps > 50 && current === "low") return "medium";
  if (fps > 55 && current === "medium") return "high";
  return current;
}

export function classifyGraphicsErrorType(error: unknown): GraphicsErrorType {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();
  if (lower.includes("webgl") || lower.includes("context lost") || lower.includes("contextlost")) return "context_loss";
  if (lower.includes("reanimated") || lower.includes("worklet") || lower.includes("keyframe")) return "animation";
  if (lower.includes("fps") || lower.includes("memory") || lower.includes("performance")) return "performance";
  if (lower.includes("asset") || lower.includes("glb") || lower.includes("texture") || lower.includes("fetch")) {
    return "asset_load";
  }
  return "render";
}
