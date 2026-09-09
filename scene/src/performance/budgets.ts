/**
 * Decentraland mobile / desktop scene budgets.
 * Soft → warning. Hard → scene can fail to load on the explorer.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/optimize-performance
 */

export interface BudgetBand {
  soft: number
  hard: number
}

export interface SceneBudget {
  triangles: BudgetBand
  entities: BudgetBand
  meshes: BudgetBand
  materials: BudgetBand
  textures: BudgetBand
  drawCalls: BudgetBand
  colliders: BudgetBand
  memoryMb: BudgetBand
}

export interface SceneStats {
  triangles: number
  entities: number
  meshes: number
  materials: number
  textures: number
  drawCalls: number
  colliders: number
  memoryMb: number
}

export type BudgetMetric = keyof SceneBudget

export const EMPTY_STATS: SceneStats = {
  triangles: 0,
  entities: 0,
  meshes: 0,
  materials: 0,
  textures: 0,
  drawCalls: 0,
  colliders: 0,
  memoryMb: 0,
}

export const MOBILE_BUDGETS: SceneBudget = {
  triangles: { soft: 1_000_000, hard: 1_200_000 },
  entities: { soft: 4_800, hard: 6_000 },
  meshes: { soft: 2_400, hard: 3_000 },
  materials: { soft: 400, hard: 500 },
  textures: { soft: 400, hard: 500 },
  drawCalls: { soft: 1_000, hard: 2_000 },
  colliders: { soft: 1_200, hard: 1_500 },
  memoryMb: { soft: 1638, hard: 2048 },
}

export const DESKTOP_BUDGETS: SceneBudget = {
  triangles: { soft: 2_000_000, hard: 3_000_000 },
  entities: { soft: 10_000, hard: 15_000 },
  meshes: { soft: 5_000, hard: 8_000 },
  materials: { soft: 800, hard: 1200 },
  textures: { soft: 800, hard: 1200 },
  drawCalls: { soft: 2_000, hard: 4_000 },
  colliders: { soft: 2_400, hard: 3_000 },
  memoryMb: { soft: 3276, hard: 4096 },
}

export const BUDGET_METRICS: BudgetMetric[] = [
  'triangles',
  'entities',
  'meshes',
  'materials',
  'textures',
  'drawCalls',
  'colliders',
  'memoryMb',
]

export function createStats(partial: Partial<SceneStats> = {}): SceneStats {
  return { ...EMPTY_STATS, ...partial }
}

export function addStats(base: SceneStats, delta: Partial<SceneStats>): SceneStats {
  return {
    triangles: Math.max(0, base.triangles + (delta.triangles ?? 0)),
    entities: Math.max(0, base.entities + (delta.entities ?? 0)),
    meshes: Math.max(0, base.meshes + (delta.meshes ?? 0)),
    materials: Math.max(0, base.materials + (delta.materials ?? 0)),
    textures: Math.max(0, base.textures + (delta.textures ?? 0)),
    drawCalls: Math.max(0, base.drawCalls + (delta.drawCalls ?? 0)),
    colliders: Math.max(0, base.colliders + (delta.colliders ?? 0)),
    memoryMb: Math.max(0, base.memoryMb + (delta.memoryMb ?? 0)),
  }
}

export function estimateMemoryMb(stats: Omit<SceneStats, 'memoryMb'>): number {
  const meshMb = stats.meshes * 0.08
  const textureMb = stats.textures * 0.35
  const entityMb = stats.entities * 0.02
  const triangleMb = stats.triangles / 80_000
  return Math.round((meshMb + textureMb + entityMb + triangleMb) * 10) / 10
}
