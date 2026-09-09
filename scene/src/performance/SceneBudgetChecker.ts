/**
 * SceneBudgetChecker tracks incremental scene usage against soft/hard limits.
 * Counts are maintained as entities are created — no random mock stats.
 */

import {
  BUDGET_METRICS,
  DESKTOP_BUDGETS,
  EMPTY_STATS,
  MOBILE_BUDGETS,
  addStats,
  estimateMemoryMb,
  type BudgetMetric,
  type SceneBudget,
  type SceneStats,
} from './budgets'
import { isMobileClient } from './platform'

export type BudgetCallback = (metric: string, usage: number, limit: number) => void

export interface BudgetReport {
  stats: SceneStats
  warnings: string[]
  errors: string[]
  withinSoftLimits: boolean
  withinHardLimits: boolean
}

export class SceneBudgetChecker {
  private static instance: SceneBudgetChecker | null = null

  private currentBudget: SceneBudget
  private stats: SceneStats = { ...EMPTY_STATS }
  private lastCheck = 0
  private checkInterval = 5000
  private lastReport: BudgetReport = {
    stats: { ...EMPTY_STATS },
    warnings: [],
    errors: [],
    withinSoftLimits: true,
    withinHardLimits: true,
  }

  private onBudgetWarning: BudgetCallback | null = null
  private onBudgetError: BudgetCallback | null = null

  private constructor() {
    this.currentBudget = isMobileClient() ? MOBILE_BUDGETS : DESKTOP_BUDGETS
  }

  static getInstance(): SceneBudgetChecker {
    if (!SceneBudgetChecker.instance) {
      SceneBudgetChecker.instance = new SceneBudgetChecker()
    }
    return SceneBudgetChecker.instance
  }

  static resetInstance(): void {
    SceneBudgetChecker.instance = null
  }

  /**
   * Add (or subtract) usage. Primitive helpers call this as meshes spawn.
   */
  record(delta: Partial<SceneStats>): void {
    this.stats = addStats(this.stats, delta)
    if (delta.memoryMb === undefined) {
      this.stats.memoryMb = estimateMemoryMb(this.stats)
    }
  }

  setStats(stats: SceneStats): void {
    this.stats = { ...stats }
    if (stats.memoryMb === 0) {
      this.stats.memoryMb = estimateMemoryMb(this.stats)
    }
  }

  tick(now: number = Date.now()): BudgetReport | null {
    if (now - this.lastCheck < this.checkInterval) return null
    this.lastCheck = now
    return this.checkBudget()
  }

  forceCheck(): BudgetReport {
    this.lastCheck = 0
    return this.checkBudget()
  }

  private checkBudget(): BudgetReport {
    const stats = this.collectStats()
    const warnings: string[] = []
    const errors: string[] = []

    for (const metric of BUDGET_METRICS) {
      const usage = stats[metric]
      const limits = this.currentBudget[metric]
      if (usage > limits.hard) {
        errors.push(`${metric}: ${usage} > ${limits.hard}`)
        this.onBudgetError?.(metric, usage, limits.hard)
      } else if (usage > limits.soft) {
        warnings.push(`${metric}: ${usage} > ${limits.soft}`)
        this.onBudgetWarning?.(metric, usage, limits.soft)
      }
    }

    this.lastReport = {
      stats,
      warnings,
      errors,
      withinSoftLimits: warnings.length === 0 && errors.length === 0,
      withinHardLimits: errors.length === 0,
    }
    return this.lastReport
  }

  collectStats(): SceneStats {
    return { ...this.stats, memoryMb: estimateMemoryMb(this.stats) }
  }

  getLastReport(): BudgetReport {
    return this.lastReport
  }

  getBudget(): SceneBudget {
    return this.currentBudget
  }

  remaining(metric: BudgetMetric, band: 'soft' | 'hard' = 'soft'): number {
    return Math.max(0, this.currentBudget[metric][band] - this.stats[metric])
  }

  canAfford(cost: Partial<SceneStats>): boolean {
    const next = addStats(this.stats, cost)
    for (const metric of BUDGET_METRICS) {
      if (next[metric] > this.currentBudget[metric].soft) return false
    }
    return true
  }

  onWarning(callback: BudgetCallback): void {
    this.onBudgetWarning = callback
  }

  onError(callback: BudgetCallback): void {
    this.onBudgetError = callback
  }

  setCheckInterval(ms: number): void {
    this.checkInterval = Math.max(250, ms)
  }
}

export function recordPrimitive(options: {
  triangles: number
  collider?: boolean
  textures?: number
  uniqueMaterial?: boolean
}): void {
  SceneBudgetChecker.getInstance().record({
    entities: 1,
    meshes: 1,
    materials: options.uniqueMaterial === false ? 0 : 1,
    triangles: options.triangles,
    drawCalls: 1,
    textures: options.textures ?? 0,
    colliders: options.collider ? 1 : 0,
  })
}
