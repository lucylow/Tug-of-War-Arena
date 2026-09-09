/**
 * Limits enforced by the Decentraland mobile client.
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/optimize-performance
 */
export const MOBILE_LIMITS = {
  triangles: { soft: 1_000_000, hard: 1_200_000 },
  entities: { soft: 4_800, hard: 6_000 },
  meshes: { soft: 2_400, hard: 3_000 },
  geometries: { soft: 1_000, hard: 2_000 },
  materials: { soft: 400, hard: 500 },
  textures: { soft: 400, hard: 500 },
  colliders: { soft: 1_200, hard: 1_500 },
  contentSizeMb: { soft: 120, hard: 150 },
  drawCalls: { soft: 1_000, hard: 2_000 },
  performance: { target: 90, minimum: 85 },
} as const

export type MobileSceneStats = {
  triangles: number
  entities: number
  meshes: number
  materials: number
  textures: number
  drawCalls: number
}

export function checkMobileLimits(stats: MobileSceneStats): { withinLimits: boolean; warnings: string[] } {
  const warnings: string[] = []
  if (stats.triangles > MOBILE_LIMITS.triangles.soft) warnings.push(`Triangles: ${stats.triangles} > ${MOBILE_LIMITS.triangles.soft}`)
  if (stats.entities > MOBILE_LIMITS.entities.soft) warnings.push(`Entities: ${stats.entities} > ${MOBILE_LIMITS.entities.soft}`)
  if (stats.meshes > MOBILE_LIMITS.meshes.soft) warnings.push(`Meshes: ${stats.meshes} > ${MOBILE_LIMITS.meshes.soft}`)
  if (stats.materials > MOBILE_LIMITS.materials.soft) warnings.push(`Materials: ${stats.materials} > ${MOBILE_LIMITS.materials.soft}`)
  if (stats.textures > MOBILE_LIMITS.textures.soft) warnings.push(`Textures: ${stats.textures} > ${MOBILE_LIMITS.textures.soft}`)
  if (stats.drawCalls > MOBILE_LIMITS.drawCalls.soft) warnings.push(`Draw calls: ${stats.drawCalls} > ${MOBILE_LIMITS.drawCalls.soft}`)
  return { withinLimits: warnings.length === 0, warnings }
}
