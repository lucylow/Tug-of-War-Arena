import type { GraphicsErrorCategory } from "./errors";

export type CompanionQualityLevel = "high" | "medium" | "low" | "minimal";

export interface CompanionGraphicsConfig {
  level: CompanionQualityLevel;
  particleCount: number;
  confettiEnabled: boolean;
  animationsEnabled: boolean;
  glowEnabled: boolean;
}

export const COMPANION_QUALITY_LEVELS: CompanionQualityLevel[] = ["high", "medium", "low", "minimal"];

export const COMPANION_QUALITY_PRESETS: Record<CompanionQualityLevel, CompanionGraphicsConfig> = {
  high: {
    level: "high",
    particleCount: 100,
    confettiEnabled: true,
    animationsEnabled: true,
    glowEnabled: true,
  },
  medium: {
    level: "medium",
    particleCount: 50,
    confettiEnabled: true,
    animationsEnabled: true,
    glowEnabled: true,
  },
  low: {
    level: "low",
    particleCount: 16,
    confettiEnabled: false,
    animationsEnabled: true,
    glowEnabled: false,
  },
  minimal: {
    level: "minimal",
    particleCount: 0,
    confettiEnabled: false,
    animationsEnabled: false,
    glowEnabled: false,
  },
};

export function configForQuality(level: CompanionQualityLevel): CompanionGraphicsConfig {
  return { ...COMPANION_QUALITY_PRESETS[level] };
}

export function dropQualityLevel(level: CompanionQualityLevel): CompanionQualityLevel {
  const index = COMPANION_QUALITY_LEVELS.indexOf(level);
  return COMPANION_QUALITY_LEVELS[Math.min(index + 1, COMPANION_QUALITY_LEVELS.length - 1)] ?? "minimal";
}

export function raiseQualityLevel(level: CompanionQualityLevel): CompanionQualityLevel {
  const index = COMPANION_QUALITY_LEVELS.indexOf(level);
  return COMPANION_QUALITY_LEVELS[Math.max(index - 1, 0)] ?? "high";
}

export function recommendQualityFromFps(
  fps: number,
  current: CompanionQualityLevel,
): CompanionQualityLevel {
  if (!Number.isFinite(fps) || fps < 20) return "minimal";
  if (fps < 30) return current === "minimal" ? "minimal" : "low";
  if (fps > 50 && (current === "low" || current === "minimal")) return "medium";
  return current;
}

export function recommendQualityFromError(
  category: GraphicsErrorCategory,
  current: CompanionQualityLevel,
): CompanionQualityLevel {
  if (category === "asset_load") return current;
  if (category === "animation") return current === "high" ? "medium" : dropQualityLevel(current);
  return dropQualityLevel(current);
}

export function shouldPauseVisualEffects(config: CompanionGraphicsConfig): boolean {
  return !config.animationsEnabled || config.level === "minimal";
}
