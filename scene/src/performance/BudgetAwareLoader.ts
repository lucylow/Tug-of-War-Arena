/**
 * BudgetAwareLoader queues GLB / decoration loads and only releases them
 * while the scene stays under the soft entity / mesh caps.
 */

import { SceneBudgetChecker } from './SceneBudgetChecker'
import { QualityManager } from './QualityManager'
import { isMobileClient } from './platform'

export type Vec3Like = { x: number; y: number; z: number }

export interface AssetLoadRequest {
  id: string
  src: string
  position: Vec3Like
  scale: Vec3Like
  priority: number
  entityCost: number
  meshCost: number
  triangleCost: number
  onLoad?: (request: AssetLoadRequest) => void
}

const DEFAULT_SCALE: Vec3Like = { x: 1, y: 1, z: 1 }

export class BudgetAwareLoader {
  private static instance: BudgetAwareLoader | null = null

  private pendingLoads: AssetLoadRequest[] = []
  private loadedIds: string[] = []
  private isProcessing = false
  private loadInterval = 2000
  private lastProcess = 0
  private nextId = 1

  private constructor() {}

  static getInstance(): BudgetAwareLoader {
    if (!BudgetAwareLoader.instance) {
      BudgetAwareLoader.instance = new BudgetAwareLoader()
    }
    return BudgetAwareLoader.instance
  }

  static resetInstance(): void {
    BudgetAwareLoader.instance = null
  }

  requestLoad(
    src: string,
    position: Vec3Like,
    scale: Vec3Like = DEFAULT_SCALE,
    priority: number = 0,
    onLoad?: (request: AssetLoadRequest) => void,
    cost: { entities?: number; meshes?: number; triangles?: number } = {},
  ): string {
    const id = `load-${this.nextId}`
    this.nextId += 1
    this.pendingLoads.push({
      id,
      src,
      position,
      scale,
      priority,
      entityCost: cost.entities ?? (isMobileClient() ? 8 : 12),
      meshCost: cost.meshes ?? 1,
      triangleCost: cost.triangles ?? 4000,
      onLoad,
    })
    this.pendingLoads.sort((a, b) => b.priority - a.priority)
    return id
  }

  tick(now: number = Date.now()): AssetLoadRequest[] {
    if (now - this.lastProcess < this.loadInterval) return []
    this.lastProcess = now
    return this.processQueue()
  }

  processQueue(): AssetLoadRequest[] {
    if (this.isProcessing || this.pendingLoads.length === 0) return []
    this.isProcessing = true

    const checker = SceneBudgetChecker.getInstance()
    const quality = QualityManager.getInstance().getSettings()
    const loaded: AssetLoadRequest[] = []

    while (this.pendingLoads.length > 0) {
      const next = this.pendingLoads[0]
      if (!next) break

      const stats = checker.collectStats()
      if (stats.entities + next.entityCost > quality.maxEntities) break
      if (
        !checker.canAfford({
          entities: next.entityCost,
          meshes: next.meshCost,
          triangles: next.triangleCost,
          drawCalls: 1,
        })
      ) {
        break
      }

      this.pendingLoads.shift()
      checker.record({
        entities: next.entityCost,
        meshes: next.meshCost,
        triangles: next.triangleCost,
        drawCalls: 1,
        textures: 1,
      })
      next.onLoad?.(next)
      this.loadedIds.push(next.id)
      loaded.push(next)
      if (loaded.length >= 3) break
    }

    this.isProcessing = false
    return loaded
  }

  pendingCount(): number {
    return this.pendingLoads.length
  }

  loadedCount(): number {
    return this.loadedIds.length
  }

  clearPending(): void {
    this.pendingLoads = []
  }

  setLoadInterval(ms: number): void {
    this.loadInterval = Math.max(100, ms)
  }
}
