/**
 * MaterialBudgetTracker watches unique materials, textures, and estimated
 * draw calls against a tighter optimization budget than the explorer hard cap.
 *
 * Drive it from `engine.addSystem` via `tick()` — never `setInterval`.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/optimize-performance
 */

import { isMobileClient } from '../performance/platform'
import { DrawCallBatcher } from './DrawCallBatcher'
import { MaterialPool } from './MaterialPool'
import { TextureAtlasManager } from './TextureAtlas'
import type { BudgetWarning, MaterialBudget } from './types'

export const MOBILE_MATERIAL_BUDGET: MaterialBudget = {
  maxMaterials: 200,
  maxTextures: 200,
  maxTextureResolution: 512,
  maxDrawCalls: 1000,
}

export const DESKTOP_MATERIAL_BUDGET: MaterialBudget = {
  maxMaterials: 500,
  maxTextures: 500,
  maxTextureResolution: 2048,
  maxDrawCalls: 2000,
}

export interface MaterialUsageStats {
  materials: number
  textures: number
  drawCalls: number
  textureResolution: number
}

export class MaterialBudgetTracker {
  private static instance: MaterialBudgetTracker | null = null

  private currentBudget: MaterialBudget
  private materialCount = 0
  private textureCount = 0
  private drawCallCount = 0
  private maxObservedResolution = 0
  private lastCheck = 0
  private checkInterval = 5000
  private onWarning: BudgetWarning | null = null

  private constructor() {
    this.currentBudget = isMobileClient() ? MOBILE_MATERIAL_BUDGET : DESKTOP_MATERIAL_BUDGET
  }

  static getInstance(): MaterialBudgetTracker {
    if (!MaterialBudgetTracker.instance) {
      MaterialBudgetTracker.instance = new MaterialBudgetTracker()
    }
    return MaterialBudgetTracker.instance
  }

  static resetInstance(): void {
    MaterialBudgetTracker.instance = null
  }

  recordMaterial(unique: boolean = true): void {
    if (unique) this.materialCount += 1
  }

  recordTexture(resolution: number = 0, unique: boolean = true): void {
    if (unique) this.textureCount += 1
    if (resolution > this.maxObservedResolution) this.maxObservedResolution = resolution
  }

  recordDrawCalls(count: number): void {
    this.drawCallCount = Math.max(0, count)
  }

  tick(now: number = Date.now()): MaterialUsageStats | null {
    if (now - this.lastCheck < this.checkInterval) return null
    this.lastCheck = now
    return this.checkBudget()
  }

  forceCheck(): MaterialUsageStats {
    this.lastCheck = 0
    return this.checkBudget()
  }

  onBudgetWarning(callback: BudgetWarning): void {
    this.onWarning = callback
  }

  getBudget(): MaterialBudget {
    return { ...this.currentBudget }
  }

  getStats(): MaterialUsageStats {
    return this.collect()
  }

  remaining(metric: keyof MaterialBudget): number {
    const stats = this.collect()
    if (metric === 'maxTextureResolution') {
      return Math.max(0, this.currentBudget.maxTextureResolution - this.maxObservedResolution)
    }
    if (metric === 'maxMaterials') return Math.max(0, this.currentBudget.maxMaterials - stats.materials)
    if (metric === 'maxTextures') return Math.max(0, this.currentBudget.maxTextures - stats.textures)
    return Math.max(0, this.currentBudget.maxDrawCalls - stats.drawCalls)
  }

  setCheckInterval(ms: number): void {
    this.checkInterval = Math.max(250, ms)
  }

  private checkBudget(): MaterialUsageStats {
    const stats = this.collect()
    this.checkMetric('materials', stats.materials, this.currentBudget.maxMaterials)
    this.checkMetric('textures', stats.textures, this.currentBudget.maxTextures)
    this.checkMetric('drawCalls', stats.drawCalls, this.currentBudget.maxDrawCalls)
    this.checkMetric('textureResolution', stats.textureResolution, this.currentBudget.maxTextureResolution)
    return stats
  }

  private collect(): MaterialUsageStats {
    const pooled = MaterialPool.getInstance().getSize()
    const atlas = TextureAtlasManager.getInstance().getStats()
    const batched = DrawCallBatcher.getInstance().getStats()

    this.materialCount = Math.max(this.materialCount, pooled)
    this.textureCount = Math.max(this.textureCount, atlas.count)
    if (batched.totalGroups > 0) {
      this.drawCallCount = batched.totalGroups
    }

    return {
      materials: this.materialCount,
      textures: this.textureCount,
      drawCalls: this.drawCallCount,
      textureResolution: Math.max(this.maxObservedResolution, atlas.maxEdge),
    }
  }

  private checkMetric(name: string, usage: number, limit: number): void {
    if (usage > limit * 0.9) {
      console.warn(`[MaterialBudget] ${name}: ${usage}/${limit} (near limit)`)
      this.onWarning?.(name, usage, limit)
    }
  }
}
