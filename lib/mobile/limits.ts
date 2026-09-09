/**
 * Mobile scene limits enforced by the Decentraland mobile client.
 *
 * Soft limit → warning in the performance panel.
 * Hard limit → scene fails to load.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/optimize-performance
 */

export interface MobileLimitBand {
  soft: number;
  hard: number;
}

export const MOBILE_LIMITS = {
  triangles: { soft: 1_000_000, hard: 1_200_000 },
  entities: { soft: 4_800, hard: 6_000 },
  meshes: { soft: 2_400, hard: 3_000 },
  geometries: { soft: 1_000, hard: 2_000 },
  materials: { soft: 400, hard: 500 },
  textures: { soft: 400, hard: 500 },
  colliders: { soft: 1_200, hard: 1_500 },
  contentSizeMb: { soft: 120, hard: 150 },
  externalContentMb: { soft: 40, hard: 50 },
  memoryMb: { soft: 1638, hard: 2048 },
  drawCalls: { soft: 1_000, hard: 2_000 },
  performance: { target: 90, minimum: 85 },
} as const satisfies Record<string, MobileLimitBand | { target: number; minimum: number }>;

export interface MobileSceneStats {
  triangles: number;
  entities: number;
  meshes: number;
  materials: number;
  textures: number;
  drawCalls: number;
}

export interface MobileLimitCheck {
  withinLimits: boolean;
  warnings: string[];
  hardFailures: string[];
}

function pushBand(
  warnings: string[],
  hardFailures: string[],
  label: string,
  value: number,
  band: MobileLimitBand,
): void {
  if (value > band.hard) {
    hardFailures.push(`${label}: ${value} > ${band.hard} (hard limit)`);
  } else if (value > band.soft) {
    warnings.push(`${label}: ${value} > ${band.soft} (soft limit)`);
  }
}

export function checkMobileLimits(stats: MobileSceneStats): MobileLimitCheck {
  const warnings: string[] = [];
  const hardFailures: string[] = [];

  pushBand(warnings, hardFailures, "Triangles", stats.triangles, MOBILE_LIMITS.triangles);
  pushBand(warnings, hardFailures, "Entities", stats.entities, MOBILE_LIMITS.entities);
  pushBand(warnings, hardFailures, "Meshes", stats.meshes, MOBILE_LIMITS.meshes);
  pushBand(warnings, hardFailures, "Materials", stats.materials, MOBILE_LIMITS.materials);
  pushBand(warnings, hardFailures, "Textures", stats.textures, MOBILE_LIMITS.textures);
  pushBand(warnings, hardFailures, "Draw calls", stats.drawCalls, MOBILE_LIMITS.drawCalls);

  return {
    withinLimits: warnings.length === 0 && hardFailures.length === 0,
    warnings,
    hardFailures,
  };
}

/** Companion-app budget for the Expo prototype (entities ≈ screens + HUD). */
export const COMPANION_BUDGET: MobileSceneStats = {
  triangles: 0,
  entities: 80,
  meshes: 0,
  materials: 12,
  textures: 8,
  drawCalls: 24,
};
