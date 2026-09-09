/**
 * PerformanceMonitorUI owns debug-overlay visibility and the snapshot
 * the HUD reads each frame. Rendering stays in `ui.tsx` (ReactEcs).
 */

import { FramerateTracker } from './FramerateTracker'
import { QualityManager } from './QualityManager'
import { SceneBudgetChecker } from './SceneBudgetChecker'
import { MemoryTracker } from './MemoryTracker'
import { AdaptiveQualitySystem } from './AdaptiveQualitySystem'
import type { QualityLevel } from './QualityManager'
import type { SceneBudget, SceneStats } from './budgets'

export interface PerformanceSnapshot {
  visible: boolean
  fps: number
  avgFps: number
  quality: QualityLevel
  stats: SceneStats
  budget: SceneBudget
  memoryMb: number
  warnings: string[]
  errors: string[]
  lastReason: string | null
  lines: string[]
}

function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__
}

export class PerformanceMonitorUI {
  private static instance: PerformanceMonitorUI | null = null
  private visible = false

  private constructor() {
    this.visible = isDev()
  }

  static getInstance(): PerformanceMonitorUI {
    if (!PerformanceMonitorUI.instance) {
      PerformanceMonitorUI.instance = new PerformanceMonitorUI()
    }
    return PerformanceMonitorUI.instance
  }

  static resetInstance(): void {
    PerformanceMonitorUI.instance = null
  }

  toggle(): void {
    this.visible = !this.visible
  }

  show(): void {
    this.visible = true
  }

  hide(): void {
    this.visible = false
  }

  isVisible(): boolean {
    return this.visible
  }

  snapshot(): PerformanceSnapshot {
    const fpsTracker = FramerateTracker.getInstance()
    const qualityManager = QualityManager.getInstance()
    const budgetChecker = SceneBudgetChecker.getInstance()
    const report = budgetChecker.getLastReport()
    const stats = budgetChecker.collectStats()
    const fps = fpsTracker.getCurrentFps()
    const avgFps = fpsTracker.getAverageFps(5)
    const quality = qualityManager.getLevel()
    const memoryMb = MemoryTracker.getInstance().getUsedMb() || stats.memoryMb
    const lastReason = AdaptiveQualitySystem.getInstance().getLastReason()

    const lines = [
      `FPS ${Math.round(fps)}  avg ${Math.round(avgFps)}`,
      `Quality ${quality}`,
      `Ent ${stats.entities}/${budgetChecker.getBudget().entities.soft}`,
      `Tri ${Math.round(stats.triangles / 1000)}k  DC ${stats.drawCalls}`,
      `Mem ${Math.round(memoryMb)}MB`,
    ]
    if (lastReason) lines.push(`Adapt ${lastReason}`)
    if (report.warnings[0]) lines.push(report.warnings[0])
    if (report.errors[0]) lines.push(report.errors[0])

    return {
      visible: this.visible,
      fps,
      avgFps,
      quality,
      stats,
      budget: budgetChecker.getBudget(),
      memoryMb,
      warnings: report.warnings,
      errors: report.errors,
      lastReason,
      lines,
    }
  }
}

export function getPerformanceSnapshot(): PerformanceSnapshot {
  return PerformanceMonitorUI.getInstance().snapshot()
}
